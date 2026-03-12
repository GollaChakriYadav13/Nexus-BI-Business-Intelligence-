"""
Data-Agnostic RAG Chart API — ChromaDB + Local Embeddings
==========================================================

Architecture (v6)
-----------------

  Any CSV file  ──►  POST /api/upload-csv
       │                   │
       │              pandas DataFrame
       │                   │
       ▼                   ▼
  chromadb.PersistentClient          ← 100% local, zero external API calls
  Default collection: "bmw_inventory"
  Dynamic collections: "upload_<uuid4>" (one per uploaded CSV)
  Embedding:  chromadb.utils.embedding_functions
              .DefaultEmbeddingFunction()          ← all-MiniLM-L6-v2 (local)
       │
       ▼  (query time, top-15 retrieval)
  Retrieved rows → compact text summary
       │
       ▼
  google.generativeai  gemini-2.5-flash
  generation_config = { response_mime_type: "application/json" }
       │
       ▼
  Recharts JSON  →  FastAPI ChartResponse

Key design choices
------------------
• Data-format agnostic: _row_to_text() dynamically converts any CSV schema
  into a "col_name: value" pipe-delimited string with no hardcoded columns.
• Dynamic CSV upload: POST /api/upload-csv creates a unique ChromaDB
  collection per file and returns its collection_name for targeting.
• Dynamic collection routing: ChartRequest.collection_name lets the client
  target any uploaded collection; omit it to fall back to "bmw_inventory".
• Zero external embedding API calls — Chroma's DefaultEmbeddingFunction
  downloads all-MiniLM-L6-v2 on first run and caches it locally.
• One-time ingestion guard:  collection.count() > 0  skips re-ingestion
  on every subsequent server restart.
• Gemini 2.5 Flash is used ONLY for the final generation step, not for
  embedding — dramatically reducing API surface area.
• response_mime_type="application/json" mathematically enforces structured
  output; no prompt-side JSON fences needed.
• Conversational Memory (Context Chaining): the optional `previous_query`
  field on ChartRequest lets the client pass the prior turn's question so
  that follow-up queries are resolved against the full conversational context
  both at retrieval time (ChromaDB) and at generation time (Gemini prompt).

Install
-------
pip install fastapi uvicorn pandas pyarrow chromadb google-genai python-dotenv
"""

from __future__ import annotations

import io
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

# Load .env FIRST — must happen before any os.environ.get() call so that
# variables defined in .env (e.g. GOOGLE_API_KEY) are available immediately.
from dotenv import load_dotenv
load_dotenv()

import chromadb
import pandas as pd
from google import genai
from google.genai import types
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration  (override any value via environment variable)
# ---------------------------------------------------------------------------

HARDCODED_KEY: str   = "GOOGLE_API_KEY"
GOOGLE_API_KEY: str  = os.environ.get("GOOGLE_API_KEY", HARDCODED_KEY)
CSV_PATH: str        = os.environ.get("CSV_PATH",        "../data/BMW_Cleaned.csv")
CHROMA_DIR: str      = os.environ.get("CHROMA_DIR",      "./chroma_db")
COLLECTION_NAME: str = os.environ.get("COLLECTION_NAME", "bmw_inventory")
RETRIEVAL_TOP_K: int = 15

# Chroma ingestion batch size — keeps memory flat for large datasets
INGEST_BATCH: int = 500

# ---------------------------------------------------------------------------
# Gemini client — google.genai SDK (generation only, never used for embeddings)
# ---------------------------------------------------------------------------
# A single Client instance is created at module load and reused for every
# request.  Constructing it here (outside the endpoint) avoids per-request
# overhead and satisfies the "initialise outside the endpoint" requirement.

gemini_client = genai.Client(api_key=GOOGLE_API_KEY)

# ---------------------------------------------------------------------------
# Global ChromaDB client + default collection handle — set once during lifespan
# ---------------------------------------------------------------------------

_chroma_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None


def get_chroma_client() -> chromadb.PersistentClient:
    if _chroma_client is None:
        raise RuntimeError("ChromaDB client has not been initialised yet.")
    return _chroma_client


def get_collection() -> chromadb.Collection:
    if _collection is None:
        raise RuntimeError("ChromaDB collection has not been initialised yet.")
    return _collection


# ---------------------------------------------------------------------------
# Row → human-readable text document
# ---------------------------------------------------------------------------

def _row_to_text(row: pd.Series) -> str:
    """
    Convert any DataFrame row into a dense pipe-delimited natural-language string.

    Completely data-format agnostic — no hardcoded column names. Every column
    is rendered as "ColumnName: value", normalising the column name (stripped of
    leading/trailing whitespace) and coercing values to clean strings.

    Numeric values that parse as integers are rendered without a decimal point
    for compactness; all others are rendered as-is.

    Example output (BMW CSV):
        "model: 5 Series | year: 2014 | price: 11200 | transmission: Automatic
         | mileage: 67068 | fuelType: Diesel | tax: 125 | mpg: 57.6 | engineSize: 2.0"

    Example output (arbitrary sales CSV):
        "Region: North | Product: Widget A | Revenue: 84200 | Units: 312 | Quarter: Q3"

    The verbose "key: value" format maximises semantic signal for the local
    all-MiniLM-L6-v2 embedding model regardless of the domain.
    """
    parts: list[str] = []
    for col, val in row.items():
        col_clean = str(col).strip()
        # Render whole numbers without spurious ".0" suffix
        try:
            float_val = float(val)
            str_val = str(int(float_val)) if float_val == int(float_val) else str(val)
        except (ValueError, TypeError):
            str_val = str(val).strip()
        parts.append(f"{col_clean}: {str_val}")
    return " | ".join(parts)


def _ingest_dataframe(collection: chromadb.Collection, df: pd.DataFrame) -> int:
    """
    Ingest a pandas DataFrame into a ChromaDB collection in batches.

    Completely data-format agnostic — works with any column schema.
    Returns the total number of documents ingested.

    The DefaultEmbeddingFunction (all-MiniLM-L6-v2) runs entirely on-device —
    no network calls, no quota consumption.
    """
    total = len(df)
    log.info("Beginning ingestion of %d rows in batches of %d …", total, INGEST_BATCH)

    for batch_start in range(0, total, INGEST_BATCH):
        batch = df.iloc[batch_start : batch_start + INGEST_BATCH]
        documents: list[str]   = []
        ids: list[str]         = []
        metadatas: list[dict]  = []

        for df_idx, row in batch.iterrows():
            documents.append(_row_to_text(row))
            ids.append(f"row_{df_idx}")
            metadatas.append(
                {str(col).strip(): str(val) for col, val in row.items()}
            )

        collection.add(documents=documents, ids=ids, metadatas=metadatas)
        ingested_so_far = min(batch_start + INGEST_BATCH, total)
        log.info("  Ingested %d / %d rows …", ingested_so_far, total)

    log.info("Ingestion complete — %d documents stored in collection '%s'.",
             total, collection.name)
    return total


# ---------------------------------------------------------------------------
# One-time CSV ingestion into ChromaDB (startup path for default collection)
# ---------------------------------------------------------------------------

def _ingest_csv(collection: chromadb.Collection, csv_path: str) -> None:
    """
    Load a CSV from disk via pandas and ingest it into the given collection.
    Used exclusively during server startup for the default bmw_inventory collection.
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(
            f"CSV file not found: {csv_path!r}\n"
            f"Set the CSV_PATH environment variable to the correct location."
        )

    log.info("Loading CSV from '%s' …", csv_path)
    df = pd.read_csv(csv_path, engine="pyarrow")
    df.columns = df.columns.str.strip()
    log.info("Loaded %d rows.", len(df))
    _ingest_dataframe(collection, df)


# ---------------------------------------------------------------------------
# FastAPI lifespan: initialise ChromaDB (one-time ingest if needed)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _chroma_client, _collection

    log.info("=== Server startup: initialising ChromaDB ===")

    # Local persistent client — all data lives in CHROMA_DIR on disk.
    # Stored as a module-level global so the upload endpoint can create
    # new collections without re-instantiating the client per request.
    _chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

    # DefaultEmbeddingFunction wraps sentence-transformers all-MiniLM-L6-v2.
    # Downloaded once (~22 MB) on first use, then cached locally forever.
    # Zero external API calls, zero rate-limit risk.
    embed_fn = DefaultEmbeddingFunction()

    _collection = _chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},   # cosine similarity for text
    )

    existing = _collection.count()
    if existing > 0:
        log.info(
            "Collection '%s' already contains %d documents — skipping ingestion.",
            COLLECTION_NAME, existing,
        )
    else:
        log.info(
            "Collection '%s' is empty — ingesting CSV …", COLLECTION_NAME
        )
        _ingest_csv(_collection, CSV_PATH)

    log.info(
        "=== ChromaDB ready: %d documents in '%s'. Serving requests. ===",
        _collection.count(), COLLECTION_NAME,
    )

    yield  # ── application is live ──

    _chroma_client = None
    _collection = None
    log.info("=== Server shutdown: ChromaDB handle released. ===")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Data-Agnostic RAG Chart API (Local Embeddings)",
    version="6.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ChartRequest(BaseModel):
    query: str                           # e.g. "Show average price by model as a bar chart"
    previous_query: str | None = None    # Optional: prior question for context chaining
    collection_name: str | None = None   # Optional: target a specific uploaded collection;
                                         # omit to use the default bmw_inventory collection


class UploadResponse(BaseModel):
    collection_name: str    # Unique ChromaDB collection name assigned to this upload
    total_rows: int         # Number of rows ingested from the CSV
    columns: list[str]      # Column names detected in the uploaded CSV


class ChartResponse(BaseModel):
    chart_data: list[dict]
    chart_type: str        # Recharts component: BarChart | LineChart | …
    x_axis_key: str
    y_axis_key: str
    title: str
    insight_summary: str   # 2-3 sentence executive summary of the data trends


# ---------------------------------------------------------------------------
# Prompt template (generation only — embeddings are handled by Chroma)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an elite data analyst and visualisation engineer. You will be given:
  1. A user chart request (and optionally the user's PREVIOUS question).
  2. A set of retrieved dataset rows (the most semantically relevant records \
from the user's data).

Your role is NOT to summarise raw rows — it is to act as an intelligent analyst who:
  - Applies the user's requested aggregations, filters, and transformations with precision.
  - Produces chart_data that is a strict, computed result of those operations on the \
retrieved rows.
  - Delivers insight_summary that reads like a briefing from a data scientist to an \
executive: specific numbers, named segments, and actionable conclusions.

Return a SINGLE JSON object — nothing else. The JSON MUST conform to this exact schema:
{
  "chart_data":       [ /* 5 to 15 objects; each is one computed data point */ ],
  "chart_type":       "<BarChart | LineChart | PieChart | AreaChart | ScatterChart>",
  "x_axis_key":       "<exact key name used on the X axis in chart_data objects>",
  "y_axis_key":       "<exact key name used on the Y axis in chart_data objects>",
  "title":            "<concise, descriptive chart title that reflects any active filters>",
  "insight_summary":  "<see INSIGHT RULES below>"
}

=== INSIGHT RULES (non-negotiable) ===
- insight_summary MUST be 2-3 complete sentences. No bullet points, no markdown.
- It MUST reference specific values, segment labels, or field names from chart_data.
- It MUST convey a conclusion a C-suite reader would act on (e.g. a pricing gap, \
  a volume leader, an outlier, a trend reversal, or a category dominance).
- Generic statements like "the data shows various trends" are STRICTLY FORBIDDEN.

=== CHART DATA RULES (non-negotiable) ===
- chart_data must contain between 5 and 15 data points.
- All numeric values must be actual JSON numbers — never strings.
- Round all floats/averages to 2 decimal places.
- x_axis_key and y_axis_key must exactly match the key names used in chart_data objects.

=== OUTPUT FORMAT RULES ===
- Do NOT emit markdown fences, preamble, commentary, or any text outside the JSON object.
- response_mime_type is already set to application/json — comply strictly.
"""


def _build_prompt(
    user_query: str,
    retrieved_rows: list[str],
    previous_query: str | None = None,
) -> str:
    """
    Assemble the full generation prompt from four ordered sections:

      1. _SYSTEM_PROMPT       — role definition, schema, and output rules.
      2. conversation_section — injected ONLY when previous_query is present;
                                forces the LLM to treat the current request as
                                a strict filter/transformation of the prior view
                                rather than a fresh, disconnected summary.
      3. Retrieved rows       — the top-k ChromaDB documents providing raw data.
      4. User request         — the current natural-language query.

    The conversation_section is the critical prompt-engineering layer that
    upgrades the LLM from a "dumb row summariser" into an intelligent analyst
    that understands dataset continuity across conversational turns.
    """
    context_block = "\n".join(
        f"  [{i + 1}] {doc}" for i, doc in enumerate(retrieved_rows)
    )

    conversation_section = ""
    if previous_query:
        conversation_section = (
            "=== CONVERSATION CONTEXT — READ THIS BEFORE GENERATING ===\n"
            f'The user\'s PREVIOUS question was: "{previous_query}"\n'
            f'The user\'s CURRENT question is:   "{user_query}"\n\n'

            "INTERPRETATION DIRECTIVE:\n"
            "The current question is NOT a standalone request. It is a FILTER or "
            "TRANSFORMATION applied on top of the previous data view. You must:\n"
            "  1. Treat the previous question as the baseline dataset context "
            "(same models, same metric, same chart intent).\n"
            "  2. Apply the current question as a strict narrowing constraint "
            "(e.g. a fuel-type filter, a price threshold, a year range, a count "
            "minimum, a sort order, or a chart-type change) on that baseline.\n"
            "  3. Compute chart_data using ONLY the rows that satisfy BOTH the "
            "previous context AND the current constraint simultaneously.\n"
            "  4. If the current constraint reduces the eligible rows below 5 "
            "data points, surface the closest matching subset rather than "
            "reverting to a generic full-dataset view.\n\n"

            "INSIGHT SUMMARY DIRECTIVE (strictly enforced):\n"
            "Your insight_summary MUST open by explicitly acknowledging the active "
            'filter or transformation, e.g.: "Filtering the previous view to only '
            'show [constraint], ..." or "Applying a [threshold/filter] to the '
            '[previous metric] view, ...". '
            "It must then quantify the delta or subset — name the segments that "
            "survived the filter, cite their specific values from chart_data, and "
            "explain what the narrowed view reveals that the original did not. "
            "A generic summary that ignores the conversational constraint is a "
            "CRITICAL FAILURE — do not produce one.\n"
            "=== END CONVERSATION CONTEXT ===\n\n"
        )

    return (
        f"{_SYSTEM_PROMPT}\n\n"
        f"{conversation_section}"
        f"--- RETRIEVED INVENTORY ROWS ({len(retrieved_rows)}) ---\n"
        f"{context_block}\n\n"
        f"--- USER REQUEST ---\n"
        f"{user_query}"
    )


# ---------------------------------------------------------------------------
# /api/upload-csv  — dynamic CSV ingestion into a new ChromaDB collection
# ---------------------------------------------------------------------------

@app.post("/api/upload-csv", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    """
    Accept any CSV file, create a unique ChromaDB collection for it, ingest
    all rows using the generic _row_to_text() formatter, and return the
    collection_name so the client can target it in subsequent /api/generate-chart
    requests via ChartRequest.collection_name.

    Collection naming convention:  upload_<uuid4>
    (e.g. "upload_3f2a1b4c-8e7d-4c9f-a1b2-3c4d5e6f7890")

    The collection persists on disk in CHROMA_DIR across server restarts.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported. Please upload a valid CSV file.",
        )

    # ── Read uploaded bytes into a pandas DataFrame ───────────────────────────
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.strip()
    except Exception as exc:
        log.exception("Failed to parse uploaded CSV '%s'", file.filename)
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse CSV file: {exc}",
        ) from exc

    if df.empty:
        raise HTTPException(status_code=422, detail="Uploaded CSV contains no rows.")

    columns: list[str] = df.columns.tolist()
    total_rows: int = len(df)
    log.info(
        "Uploaded CSV '%s': %d rows, %d columns: %s",
        file.filename, total_rows, len(columns), columns,
    )

    # ── Create a unique collection for this upload ────────────────────────────
    new_collection_name = f"upload_{uuid.uuid4()}"
    embed_fn = DefaultEmbeddingFunction()

    try:
        chroma_client = get_chroma_client()
        new_collection = chroma_client.create_collection(
            name=new_collection_name,
            embedding_function=embed_fn,
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as exc:
        log.exception("Failed to create ChromaDB collection '%s'", new_collection_name)
        raise HTTPException(
            status_code=500,
            detail=f"ChromaDB collection creation failed: {exc}",
        ) from exc

    # ── Ingest all rows using the shared data-agnostic helper ─────────────────
    try:
        _ingest_dataframe(new_collection, df)
    except Exception as exc:
        log.exception("Ingestion failed for collection '%s'", new_collection_name)
        # Best-effort cleanup: delete the partially-ingested collection
        try:
            chroma_client.delete_collection(new_collection_name)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {exc}",
        ) from exc

    log.info(
        "Upload complete — collection '%s' ready with %d documents.",
        new_collection_name, total_rows,
    )

    return UploadResponse(
        collection_name=new_collection_name,
        total_rows=total_rows,
        columns=columns,
    )


# ---------------------------------------------------------------------------
# /api/generate-chart
# ---------------------------------------------------------------------------

@app.post("/api/generate-chart", response_model=ChartResponse)
async def generate_chart(request: ChartRequest) -> ChartResponse:
    """
    RAG chart generation — zero external embedding API calls.

    Step 0 — Collection Routing
        If request.collection_name is provided, fetch that specific collection
        from ChromaDB (must have been created via POST /api/upload-csv).
        Otherwise fall back to the default bmw_inventory collection that was
        initialised at server startup.

    Step 1 — Retrieval
        If `previous_query` is present the retrieval query is enriched by
        combining the prior question with the current one so that ChromaDB
        searches the vector space using the full conversational context:
            "<previous_query>. Filtered by: <current_query>"
        This ensures follow-up questions retrieve semantically appropriate
        rows even when the current query is very short (e.g. "diesel only").

    Step 2 — Augmentation
        The retrieved rows are formatted into a compact numbered context block.

    Step 3 — Generation
        Gemini 2.5 Flash receives the context + conversation history + user
        query and returns a strict JSON object (enforced by
        response_mime_type="application/json").

    Step 4 — Validation & Response
        The JSON is parsed and validated before being returned as ChartResponse.
    """
    # ── Step 0: Resolve target collection ────────────────────────────────────
    if request.collection_name:
        # Dynamic collection: created via /api/upload-csv
        try:
            chroma_client = get_chroma_client()
            embed_fn = DefaultEmbeddingFunction()
            col = chroma_client.get_collection(
                name=request.collection_name,
                embedding_function=embed_fn,
            )
            log.info("Routing request to dynamic collection '%s'.", request.collection_name)
        except Exception as exc:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Collection '{request.collection_name}' not found. "
                    f"Upload a CSV first via POST /api/upload-csv to create it. "
                    f"Detail: {exc}"
                ),
            ) from exc
    else:
        # Default fallback: bmw_inventory (initialised at startup)
        col = get_collection()
        log.info("No collection_name provided — using default collection '%s'.", COLLECTION_NAME)

    # ── Step 1: Build retrieval query (context-aware when follow-up) ─────────
    if request.previous_query:
        retrieval_query = f"{request.previous_query}. Filtered by: {request.query}"
        log.info(
            "Context-chained retrieval query: %r  (previous: %r, current: %r)",
            retrieval_query, request.previous_query, request.query,
        )
    else:
        retrieval_query = request.query

    # ── Step 1b: Query ChromaDB (local embedding) ────────────────────────────
    try:
        results = col.query(
            query_texts=[retrieval_query],
            n_results=RETRIEVAL_TOP_K,
            include=["documents"],
        )
    except Exception as exc:
        log.exception("ChromaDB query failed")
        raise HTTPException(status_code=502, detail=f"ChromaDB error: {exc}") from exc

    retrieved_docs: list[str] = results["documents"][0]  # list of row strings

    if not retrieved_docs:
        raise HTTPException(
            status_code=404,
            detail="No relevant inventory rows found for this query.",
        )

    log.info(
        "Retrieved %d rows from ChromaDB for retrieval query: %r",
        len(retrieved_docs), retrieval_query,
    )

    # ── Step 2: Build augmented prompt (inject conversation history) ─────────
    prompt = _build_prompt(
        user_query=request.query,
        retrieved_rows=retrieved_docs,
        previous_query=request.previous_query,
    )

    # ── Step 3: Generate with Gemini 2.5 Flash (google.genai SDK) ────────────
    try:
        gemini_response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",  # enforces strict JSON output
                temperature=0.2,
            ),
        )
        raw_text: str = gemini_response.text.strip()
    except Exception as exc:
        log.exception("Gemini generation failed")
        raise HTTPException(
            status_code=502, detail=f"Gemini API error: {exc}"
        ) from exc

    # ── Step 4: Parse & validate ──────────────────────────────────────────────
    # Defensive fence-strip in case the model ignores response_mime_type
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        raw_text = raw_text.lstrip("json").strip()

    try:
        payload: dict = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        log.error("Non-JSON Gemini response:\n%s", raw_text)
        raise HTTPException(
            status_code=500,
            detail=f"Model returned invalid JSON: {exc}\n\nRaw:\n{raw_text}",
        ) from exc

    required_keys = {"chart_data", "chart_type", "x_axis_key", "y_axis_key", "title", "insight_summary"}
    missing = required_keys - payload.keys()
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Response missing required keys: {missing}",
        )

    chart_data = payload["chart_data"]
    if not isinstance(chart_data, list) or len(chart_data) == 0:
        raise HTTPException(
            status_code=500,
            detail="'chart_data' must be a non-empty JSON array.",
        )

    return ChartResponse(
        chart_data=chart_data,
        chart_type=payload["chart_type"],
        x_axis_key=payload["x_axis_key"],
        y_axis_key=payload["y_axis_key"],
        title=payload["title"],
        insight_summary=payload["insight_summary"],
    )


# ---------------------------------------------------------------------------
# Health-check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict:
    col = get_collection()
    chroma_client = get_chroma_client()
    all_collections = [c.name for c in chroma_client.list_collections()]
    return {
        "status":                "ok",
        "default_collection":    COLLECTION_NAME,
        "default_docs_indexed":  col.count(),
        "all_collections":       all_collections,
        "retrieval_top_k":       RETRIEVAL_TOP_K,
        "embedding":             "local — all-MiniLM-L6-v2 (DefaultEmbeddingFunction)",
        "llm":                   "gemini-2.5-flash via google.genai SDK (generation only)",
        "chroma_dir":            CHROMA_DIR,
        "conversational_memory": "enabled — pass previous_query in ChartRequest",
        "dynamic_collections":   "enabled — POST /api/upload-csv to create, pass collection_name in ChartRequest to target",
    }


# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)