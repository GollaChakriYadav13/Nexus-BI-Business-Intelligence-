# ⬡ Nexus BI — Nexus BI Terminal

> **Hackathon Winner · Agentic Business Intelligence · Data-Agnostic RAG Dashboard**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Local_Vectors-FF6F00?style=flat-square&logo=databricks&logoColor=white)](https://www.trychroma.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-Google_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-94a3b8?style=flat-square)](LICENSE)

---

**Nexus BI — Nexus BI Terminal** is a fully agentic, data-agnostic Business Intelligence dashboard. Drop in any CSV, ask a question in plain English, and receive an interactive chart alongside a C-suite executive insight — all powered by local vector embeddings and a structured-output LLM pipeline. No BI configuration. No schema mapping. No data leaves your machine for embedding.

![Nexus BI Terminal Dashboard](https://placehold.co/1200x600/0f172a/94a3b8?text=Nexus+BI+Terminal+%E2%80%94+Nexus+BI)

---

## ✨ Feature Highlights

| Capability | Detail |
|---|---|
| 🗂️ **Data-Agnostic Ingestion** | Upload any CSV — the backend dynamically parses every schema with zero hardcoded column names |
| 🧠 **Zero-API-Call Embeddings** | `all-MiniLM-L6-v2` runs fully on-device via ChromaDB. No rate limits, no privacy leakage |
| 🤖 **Agentic RAG Generation** | Gemini 2.0 Flash performs top-15 semantic retrieval → structured chart generation in one shot |
| 🔒 **Strict JSON Enforcement** | `response_mime_type="application/json"` mathematically guarantees Recharts-compatible output |
| 💬 **Conversational Memory** | Follow-up queries chain `previous_query` at both retrieval and generation time |
| 📊 **5 Chart Types** | Bar, Line, Area, Pie, Scatter — auto-selected by the agent based on query semantics |
| 📄 **PDF Briefing Export** | `jsPDF` + `html2canvas` engine renders the full dashboard to a professional PDF report |
| 🎨 **Editorial Luxury UI** | Glassmorphism · Bento Box Grid · Z-index hover physics · Slate Canvas design system |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXUS BI — NEXUS BI                     │
│                                                                 │
│  ┌──────────────┐    POST /api/upload-csv    ┌───────────────┐  │
│  │  React/Vite  │ ─────────────────────────► │   FastAPI     │  │
│  │  Frontend    │                            │   Backend     │  │
│  │              │ ◄───────────────────────── │               │  │
│  │  Recharts    │    ChartResponse (JSON)     │               │  │
│  │  jsPDF       │                            └──────┬────────┘  │
│  └──────────────┘                                   │           │
│                                            ┌────────▼────────┐  │
│                              Any CSV ────► │  pandas DataFrame│  │
│                                            └────────┬────────┘  │
│                                                     │           │
│                                            ┌────────▼────────┐  │
│                                            │   ChromaDB      │  │
│                                            │ PersistentClient│  │
│                                            │                 │  │
│                                            │ Embedding:      │  │
│                                            │ all-MiniLM-L6-v2│  │
│                                            │ (100% local)    │  │
│                                            └────────┬────────┘  │
│                                                     │           │
│                                         Top-15 Semantic Docs    │
│                                                     │           │
│                                            ┌────────▼────────┐  │
│                                            │ Gemini 2.0 Flash│  │
│                                            │ (generation only)│  │
│                                            │                 │  │
│                                            │ response_mime_  │  │
│                                            │ type=           │  │
│                                            │ "application/   │  │
│                                            │  json"          │  │
│                                            └────────┬────────┘  │
│                                                     │           │
│                                         { chart_data, chart_type│
│                                           x_axis_key, y_axis_key│
│                                           title, insight_summary}│
└─────────────────────────────────────────────────────────────────┘
```

### RAG Pipeline — Step by Step

**Step 0 — Collection Routing** · Each uploaded CSV gets a unique `upload_<uuid4>` ChromaDB collection. The client passes the `collection_name` to target it; omit it to fall back to the default dataset.

**Step 1 — Context-Aware Retrieval** · If `previous_query` is present, the retrieval string becomes `"<previous_query>. Filtered by: <current_query>"` — so short follow-ups like *"diesel only"* still hit semantically correct rows.

**Step 2 — Augmentation** · The top-15 retrieved rows are serialised as a numbered context block and injected into the Gemini prompt.

**Step 3 — Structured Generation** · Gemini 2.0 Flash returns a single JSON object. `response_mime_type="application/json"` enforces the contract at the API layer — no prompt-side JSON fences required.

**Step 4 — Validation & Dispatch** · The backend validates all six required keys (`chart_data`, `chart_type`, `x_axis_key`, `y_axis_key`, `title`, `insight_summary`) before returning the `ChartResponse` to the frontend.

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| API Framework | **FastAPI** | Async REST endpoints, Pydantic validation, OpenAPI docs |
| Vector Database | **ChromaDB** (`PersistentClient`) | Per-CSV collections, cosine similarity search |
| Embedding Model | **all-MiniLM-L6-v2** (local) | Zero-API, zero-latency semantic embeddings |
| LLM | **Gemini 2.0 Flash** (`google-genai`) | Structured chart + insight generation |
| Data Processing | **pandas** | Schema-agnostic CSV parsing and DataFrame ops |
| Config | **python-dotenv** | Environment-based secrets management |
| Server | **Uvicorn** | ASGI server with hot-reload support |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React 18** + **Vite** | Component architecture, fast HMR |
| Styling | **Tailwind CSS** | Slate Canvas design system, glassmorphism utilities |
| Charts | **Recharts** | Bar, Line, Area, Pie, Scatter — Recharts-native JSON |
| HTTP Client | **Axios** | API communication with the FastAPI backend |
| PDF Engine | **jsPDF** + **html2canvas** + **jspdf-autotable** | Dashboard-to-PDF briefing export |
| Icons | **Lucide React** | Consistent iconography throughout the UI |

---

## 📁 Project Structure

```
nexus-bi/
├── backend/
│   ├── main.py               # FastAPI app — RAG pipeline, endpoints, Gemini client
│   ├── chroma_db/            # Persistent ChromaDB storage (auto-created at runtime)
│   ├── data/
│   │   └── BMW_Cleaned.csv   # Default demo dataset
│   ├── requirements.txt
│   └── .env                  # GOOGLE_API_KEY (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Nexus BI Terminal — full UI, PDF engine, chart renderer
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Installation

### Prerequisites

- **Python** ≥ 3.10
- **Node.js** ≥ 18
- A **Google AI API Key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

### 1 · Clone the Repository

```bash
git clone https://github.com/your-org/nexus-bi.git
cd nexus-bi
```

---

### 2 · Backend Setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pandas pyarrow chromadb google-genai python-dotenv
```

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_API_KEY=your_google_ai_api_key_here

# Optional overrides (defaults shown)
# CSV_PATH=../data/BMW_Cleaned.csv
# CHROMA_DIR=./chroma_db
# COLLECTION_NAME=bmw_inventory
```

Start the API server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

On first launch, ChromaDB will download and cache `all-MiniLM-L6-v2` locally (~90 MB, one-time only). The default dataset is ingested automatically. You should see:

```
INFO  ChromaDB initialised — 10,781 documents in 'bmw_inventory'
INFO  Application startup complete.
```

> 🩺 **Health check:** `GET http://localhost:8000/health` returns collection stats, embedding model info, and all active dynamic collections.

---

### 3 · Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The UI is available at **`http://localhost:5173`**.

---

### 4 · Using Nexus BI Terminal

1. **Default Dataset** — The app loads the BMW inventory dataset automatically. Type any natural-language query into the terminal prompt.

2. **Upload Your Own CSV** — Click the **Upload CSV** button in the sidebar. The backend creates an isolated vector collection for your file and targets it for all subsequent queries.

3. **Ask a Question** — Examples:
   - *"Show me average price by fuel type as a bar chart"*
   - *"What's the mileage trend for petrol cars across years?"*
   - *"Which models have the highest tax? Pie chart."*

4. **Follow-Up Queries** — The terminal chains your previous question automatically. Try:
   - *"Now show me only 2018 models"*
   - *"Filter to automatic transmission only"*

5. **Export** — Click **Export PDF Briefing** to render the full dashboard — charts, insights, and data table — into a downloadable PDF.

---

## 🔌 API Reference

### `POST /api/upload-csv`

Uploads a CSV file and creates a dedicated ChromaDB collection.

```json
// Response
{
  "collection_name": "upload_3f7a1c2d-...",
  "total_rows": 4821,
  "columns": ["Region", "Product", "Revenue", "Units", "Quarter"]
}
```

### `POST /api/generate-chart`

Runs the full RAG pipeline and returns a Recharts-ready chart payload.

```json
// Request body
{
  "query": "Show average revenue by region as a bar chart",
  "collection_name": "upload_3f7a1c2d-...",   // optional — omit for default dataset
  "previous_query": "Show total units sold"    // optional — enables conversational memory
}
```

```json
// Response
{
  "chart_data": [{ "Region": "North", "Revenue": 84200 }, ...],
  "chart_type": "bar",
  "x_axis_key": "Region",
  "y_axis_key": "Revenue",
  "title": "Average Revenue by Region",
  "insight_summary": "The Northern region leads revenue generation by 34% over the nearest competitor, driven primarily by high-margin product lines in Q3. Executives should consider replicating the North's distribution model in the underperforming West territory."
}
```

### `GET /health`

Returns system status, indexed document counts, and all active collections.

---

## 🔑 Key Design Decisions

**Data-format agnosticism** is achieved by `_row_to_text()`, which dynamically serialises any DataFrame row into a pipe-delimited `col_name: value` string with no hardcoded schema. This single function is what makes the entire RAG pipeline portable across any CSV domain.

**Privacy-first embeddings** — `all-MiniLM-L6-v2` runs locally via ChromaDB's `DefaultEmbeddingFunction`. It is downloaded once on first startup and cached. Gemini is invoked *only* for the final generation step, minimising external API surface area.

**One-time ingestion guard** — `collection.count() > 0` prevents re-embedding an already-indexed dataset on every server restart, keeping cold-start times near-instant after the first run.

**Batch ingestion** — Large CSVs are ingested in configurable batches of 500 rows (`INGEST_BATCH`) to keep memory consumption flat regardless of dataset size.

---

## 🗺️ Roadmap

- [ ] Multi-CSV join queries across collections
- [ ] Streaming chart generation with SSE
- [ ] OAuth-gated multi-user collection isolation
- [ ] Local LLM support (Ollama / LM Studio) as a Gemini drop-in
- [ ] Scheduled report delivery via email / Slack
- [ ] PostgreSQL + pgvector backend option for enterprise scale

---

## 🤝 Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change. Make sure all API-facing changes include corresponding updates to this README.

```bash
# Run backend with hot-reload
uvicorn main:app --reload

# Lint frontend
npm run lint
```

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Built with ⬡ by **Team rexo~Boyz** &nbsp;·&nbsp; Powered by ChromaDB, Gemini, and open-source ♥

</div>
