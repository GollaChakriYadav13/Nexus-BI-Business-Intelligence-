/**
 * BMW AI INTELLIGENCE TERMINAL
 * Design: Modern Luxury · Editorial Tech · Bento Box Grid
 * Slate Canvas · Soft Glassmorphism · Focus Magnifier Hover Physics
 * PDF Engine: jsPDF + autoTable + html2canvas  [PRESERVED — DO NOT TOUCH]
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Loader2, BarChart2, AlertCircle,
  Package, DollarSign, Star, Activity,
  ChevronLeft, ChevronRight, WifiOff,
  FileDown, CheckCircle2, Cpu,
  ArrowRight, ChevronDown,
  Search, Sparkles, BrainCircuit, TrendingUp,
  Layers, Zap, Upload, Database, X, Table2,
} from "lucide-react";
import {
  BarChart as ReBarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — Slate Canvas System
───────────────────────────────────────────────────────────────────────────── */
const T = {
  /* Canvas — true slate-900 */
  bg:      "#0f172a",   // slate-900
  bgMid:   "#111827",   // gray-900
  bgDeep:  "#0a1120",   // deeper

  /* Glass surfaces */
  glass:   "rgba(30,41,59,0.55)",    // slate-800/55
  glassMd: "rgba(30,41,59,0.40)",    // slate-800/40
  glassLt: "rgba(51,65,85,0.35)",    // slate-700/35
  glassBdr:"rgba(71,85,105,0.50)",   // slate-600/50
  glassHov:"rgba(30,41,59,0.70)",    // hover state

  /* Text hierarchy */
  t0:  "#f1f5f9",  // slate-100 — primary
  t1:  "#cbd5e1",  // slate-300 — body
  t2:  "#94a3b8",  // slate-400 — secondary
  t3:  "#64748b",  // slate-500 — muted

  /* Accent — powder blue */
  accent:  "#94a3b8",   // slate-400 primary accent
  accentB: "#cbd5e1",   // slate-300 bright
  accentD: "#64748b",   // slate-500 dim
  accentG: "rgba(148,163,184,0.12)",
  accentGB:"rgba(148,163,184,0.20)",

  /* Vivid accent for CTA */
  vivid:   "#38bdf8",   // sky-400
  vividD:  "#0ea5e9",   // sky-500
  vividG:  "rgba(56,189,248,0.12)",

  /* Status */
  green:   "#4ade80",
  greenG:  "rgba(74,222,128,0.12)",
  amber:   "#fbbf24",
  amberG:  "rgba(251,191,36,0.12)",
  red:     "#f87171",
  redG:    "rgba(248,113,113,0.12)",

  /* Chart — muted powder blue monochromatic */
  c1:  "#94a3b8",  // slate-400
  c2:  "#7dd3fc",  // sky-300
  c3:  "#86efac",  // green-300
  c4:  "#fde68a",  // amber-200
};

/* ─────────────────────────────────────────────────────────────────────────────
   TYPOGRAPHY
───────────────────────────────────────────────────────────────────────────── */
const mono = { fontFamily:"'DM Mono','Fira Code','Cascadia Code',monospace" };
const sans = { fontFamily:"'Inter','Plus Jakarta Sans',system-ui,sans-serif" };

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL CSS — Glassmorphism system, bento grid, hover physics
───────────────────────────────────────────────────────────────────────────── */
const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; font-size:15px; }
  body { background:#0f172a; font-family:'Inter',system-ui,sans-serif; color:#cbd5e1; }
  ::selection { background:rgba(56,189,248,0.25); color:#f1f5f9; }
  ::placeholder { color:#475569; font-family:'DM Mono',monospace; font-size:13px; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:#0f172a; }
  ::-webkit-scrollbar-thumb { background:rgba(100,116,139,0.4); border-radius:999px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(100,116,139,0.6); }

  /* ── Keyframes ───────────────────────────── */
  @keyframes enterY {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
  @keyframes spin    { to{transform:rotate(360deg);} }
  @keyframes chartReveal {
    from { opacity:0; transform:scaleY(.94) translateY(12px); }
    to   { opacity:1; transform:scaleY(1) translateY(0); }
  }
  @keyframes livePulse {
    0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,.55); }
    60%     { box-shadow:0 0 0 8px rgba(74,222,128,0); }
  }
  @keyframes compilePulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  @keyframes floatUp { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
  @keyframes shimmerSlide {
    0%   { background-position:-600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes insightReveal {
    from { opacity:0; transform:translateX(20px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes dotBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }

  /* ── Entrance classes ────────────────────── */
  .a-enter   { animation:enterY .55s cubic-bezier(.16,1,.3,1) both; }
  .a-enter-1 { animation:enterY .55s .07s cubic-bezier(.16,1,.3,1) both; }
  .a-enter-2 { animation:enterY .55s .14s cubic-bezier(.16,1,.3,1) both; }
  .a-enter-3 { animation:enterY .55s .21s cubic-bezier(.16,1,.3,1) both; }
  .a-enter-4 { animation:enterY .55s .28s cubic-bezier(.16,1,.3,1) both; }
  .a-chart   { animation:chartReveal .6s cubic-bezier(.16,1,.3,1) both; transform-origin:bottom; }
  .a-insight { animation:insightReveal .6s .15s cubic-bezier(.16,1,.3,1) both; }

  /* ── GLASSMORPHISM CARD ──────────────────── */
  .glass-card {
    background: rgba(30,41,59,0.55);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(71,85,105,0.50);
    border-radius: 24px;
    position: relative;
    /* Note: overflow is intentionally NOT set to hidden here.
       Cards that need to clip inner content (e.g. tables) apply
       overflow:hidden directly on their inner wrapper div, not the
       scaling card itself — doing so on the scaling element cuts off
       the scale(1.15) transform at the card's original boundary. */
  }
  .glass-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    pointer-events:none;
  }

  /* ── SUBTLE HOVER LIFT — Analytics & Inventory ──────── */
  .hover-card {
    transition: transform 500ms cubic-bezier(0.25,1,0.5,1),
                box-shadow 500ms ease-out,
                background 500ms ease-out,
                border-color 500ms ease-out;
    cursor: default;
  }
  .hover-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(148,163,184,0.12);
    background: rgba(30,41,59,0.70) !important;
    border-color: rgba(100,116,139,0.60) !important;
  }

  /* ── FOCUS MAGNIFIER — Fleet Overview cards only ──────── */
  /*
   * z-index:10 at rest → z-index:50 on hover (immediate).
   * z-index resets after animation finishes (500ms delay on out).
   * Parent grids need overflow:visible to avoid clipping the scale.
   */
  .magnify-card {
    position: relative;
    z-index: 10;
    transform-origin: center center;
    transition: transform 500ms cubic-bezier(0.25,1,0.5,1),
                box-shadow 500ms cubic-bezier(0.25,1,0.5,1),
                background 500ms ease-out,
                border-color 500ms ease-out,
                z-index 0ms 500ms;
    cursor: default;
    will-change: transform;
  }
  .magnify-card:hover {
    transform: scale(1.15);
    z-index: 50;
    transition: transform 500ms cubic-bezier(0.25,1,0.5,1),
                box-shadow 500ms cubic-bezier(0.25,1,0.5,1),
                background 500ms ease-out,
                border-color 500ms ease-out,
                z-index 0ms;
    box-shadow: 0 0 50px rgba(0,0,0,0.50),
                0 32px 80px rgba(0,0,0,0.40),
                0 0 0 1px rgba(148,163,184,0.15);
    background: rgba(30,41,59,0.80) !important;
    border-color: rgba(100,116,139,0.70) !important;
  }

  /* ── BENTO GRID ──────────────────────────── */
  .bento-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media(min-width: 1024px) {
    .bento-grid {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .bento-chart  { grid-column: span 2; }
    .bento-insight{ grid-column: span 1; }
    .bento-full   { grid-column: span 3; }
  }

  /* ── STAT GRID ───────────────────────────── */
  /* same overflow:visible treatment for KPI cards */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    overflow: visible;
    padding: 10px;
    margin: -10px;
  }
  @media(min-width: 900px) {
    .stat-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── TWO COL ─────────────────────────────── */
  .two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media(min-width: 900px) {
    .two-col { grid-template-columns: 1fr 1fr; }
  }

  /* ── NAV TAB ─────────────────────────────── */
  .tab {
    display:inline-flex; align-items:center; gap:7px;
    padding:6px 18px; height:36px;
    background:transparent; border:none; color:#64748b;
    font-size:13px; font-weight:500;
    cursor:pointer; transition:all 250ms ease;
    font-family:'Inter',sans-serif; white-space:nowrap; border-radius:999px;
  }
  .tab:hover { color:#cbd5e1; background:rgba(148,163,184,0.08); }
  .tab.on {
    color:#f1f5f9;
    background:rgba(148,163,184,0.14);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);
  }

  /* ── QUERY INPUT ─────────────────────────── */
  .cmd {
    display:flex; align-items:center;
    background:rgba(15,23,42,0.70);
    border:1.5px solid rgba(71,85,105,0.60);
    border-radius:16px;
    transition:border-color 250ms, box-shadow 250ms;
    overflow:hidden;
    backdrop-filter:blur(12px);
  }
  .cmd:focus-within {
    border-color:rgba(56,189,248,0.50) !important;
    box-shadow:0 0 0 4px rgba(56,189,248,0.08) !important;
  }
  .cmd-field {
    flex:1; border:none; outline:none; background:transparent;
    color:#f1f5f9; font-size:14.5px; padding:16px 20px;
    font-family:'DM Mono',monospace; min-width:0;
  }

  /* ── RUN BUTTON ──────────────────────────── */
  .exec {
    display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,#38bdf8,#0ea5e9);
    color:#0c1a2e;
    border:none; border-radius:11px; margin:6px; padding:0 26px;
    font-size:13px; font-weight:700;
    cursor:pointer; font-family:'Inter',sans-serif; white-space:nowrap;
    transition:all 250ms ease; flex-shrink:0;
    box-shadow:0 4px 16px rgba(14,165,233,0.35);
  }
  .exec:hover:not(:disabled) {
    background:linear-gradient(135deg,#7dd3fc,#38bdf8);
    transform:translateY(-1px);
    box-shadow:0 6px 24px rgba(14,165,233,0.50);
  }
  .exec:active:not(:disabled) { transform:translateY(0); }
  .exec:disabled { background:rgba(30,41,59,0.6); color:#334155; cursor:not-allowed; box-shadow:none; }

  /* ── GHOST BUTTON ────────────────────────── */
  .ghost {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(148,163,184,0.08);
    border:1.5px solid rgba(71,85,105,0.50); color:#94a3b8;
    padding:0 16px; height:34px; border-radius:999px;
    font-size:12px; font-weight:500;
    cursor:pointer; font-family:'Inter',sans-serif;
    transition:all 250ms ease;
  }
  .ghost:hover { background:rgba(148,163,184,0.14); color:#e2e8f0; border-color:rgba(100,116,139,0.70); }
  .ghost:disabled { opacity:.35; cursor:not-allowed; }

  /* ── PDF BUTTON ──────────────────────────── */
  .pdfbtn {
    display:inline-flex; align-items:center; gap:7px;
    background:rgba(30,41,59,0.60);
    border:1.5px solid rgba(71,85,105,0.50); color:#94a3b8;
    padding:0 16px; height:34px; border-radius:999px;
    font-size:12px; font-weight:500;
    cursor:pointer; font-family:'Inter',sans-serif;
    transition:all 250ms ease;
    backdrop-filter:blur(8px);
  }
  .pdfbtn:hover:not(:disabled) {
    background:rgba(56,189,248,0.10);
    border-color:rgba(56,189,248,0.40);
    color:#7dd3fc; transform:translateY(-1px);
  }
  .pdfbtn:disabled { opacity:.3; cursor:not-allowed; }
  .pdfbtn.busy { animation:compilePulse .9s ease-in-out infinite; border-color:rgba(56,189,248,0.35); color:#7dd3fc; }
  .pdfbtn.done { border-color:rgba(74,222,128,0.45); color:#4ade80; background:rgba(74,222,128,0.08); }

  /* ── SUGGESTION CHIPS ────────────────────── */
  .chip {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(30,41,59,0.55);
    border:1.5px solid rgba(71,85,105,0.45); color:#64748b;
    padding:6px 15px; font-size:12px; border-radius:999px;
    font-family:'Inter',sans-serif;
    cursor:pointer; transition:all 250ms ease; white-space:nowrap;
    backdrop-filter:blur(8px);
  }
  .chip:hover {
    border-color:rgba(56,189,248,0.40); color:#93c5fd;
    background:rgba(56,189,248,0.08); transform:translateY(-1px);
    box-shadow:0 4px 16px rgba(0,0,0,0.20);
  }

  /* ── KPI GLASS CARD ──────────────────────── */
  .kpi-card {
    background:rgba(30,41,59,0.55);
    backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(71,85,105,0.50);
    border-radius:20px;
    padding:24px 26px;
    position:relative; overflow:hidden;
    z-index: 10;
    transform-origin: center center;
    transition: transform 500ms cubic-bezier(0.25,1,0.5,1),
                box-shadow 500ms cubic-bezier(0.25,1,0.5,1),
                background 500ms ease-out,
                border-color 500ms ease-out,
                z-index 0ms 500ms;
    will-change: transform;
  }
  .kpi-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  }
  .kpi-card:hover {
    transform: scale(1.15);
    z-index: 50;
    transition: transform 500ms cubic-bezier(0.25,1,0.5,1),
                box-shadow 500ms cubic-bezier(0.25,1,0.5,1),
                background 500ms ease-out,
                border-color 500ms ease-out,
                z-index 0ms;
    box-shadow: 0 0 50px rgba(0,0,0,0.50), 0 32px 80px rgba(0,0,0,0.40);
    background:rgba(30,41,59,0.80) !important;
    border-color:rgba(100,116,139,0.70) !important;
  }

  /* ── DATA TABLE ──────────────────────────── */
  .dt { width:100%; border-collapse:collapse; font-size:13px; }
  .dt thead th {
    padding:13px 18px; text-align:left; font-weight:600;
    font-size:10.5px; letter-spacing:.08em; text-transform:uppercase;
    font-family:'DM Mono',monospace; color:#475569;
    border-bottom:1px solid rgba(71,85,105,0.40);
    background:rgba(15,23,42,0.40);
    white-space:nowrap; cursor:pointer; transition:color 120ms;
  }
  .dt thead th:hover { color:#94a3b8; }
  .dt thead th.sort-on { color:#94a3b8; }
  .dt tbody td {
    padding:12px 18px;
    border-bottom:1px solid rgba(71,85,105,0.20);
    color:#94a3b8;
    transition:background 120ms;
  }
  .dt tbody tr:hover td { background:rgba(148,163,184,0.04); }
  .dt tbody tr:last-child td { border-bottom:none; }

  /* ── STATUS BADGE ────────────────────────── */
  .sbadge {
    display:inline-block; padding:4px 12px; border-radius:999px;
    font-family:'Inter',sans-serif; font-size:11px;
    font-weight:600; letter-spacing:.03em;
  }

  /* ── PAGINATION ──────────────────────────── */
  .pgbtn {
    display:flex; align-items:center; gap:3px;
    background:rgba(30,41,59,0.55);
    border:1.5px solid rgba(71,85,105,0.45); color:#64748b; border-radius:999px;
    padding:6px 12px; font-size:11px; font-family:'Inter',sans-serif;
    cursor:pointer; transition:all 200ms ease; backdrop-filter:blur(8px);
  }
  .pgbtn:hover:not(:disabled) { border-color:rgba(148,163,184,0.45); color:#cbd5e1; background:rgba(51,65,85,0.60); }
  .pgbtn:disabled { opacity:.2; cursor:default; }
  .pgn {
    width:32px; height:32px; display:flex; align-items:center; justify-content:center;
    background:rgba(30,41,59,0.55); border:1.5px solid rgba(71,85,105,0.40); border-radius:999px;
    color:#64748b; font-family:'DM Mono',monospace; font-size:11px;
    cursor:pointer; transition:all 200ms ease;
  }
  .pgn:hover:not(.on) { border-color:rgba(148,163,184,0.35); color:#cbd5e1; }
  .pgn.on { background:rgba(148,163,184,0.18); border-color:rgba(148,163,184,0.40); color:#f1f5f9;
             box-shadow:0 2px 8px rgba(0,0,0,0.20); }

  /* ── INSIGHT SHIMMER (loading) ───────────── */
  .insight-shimmer {
    background: linear-gradient(90deg,
      rgba(51,65,85,0.4) 0%,
      rgba(100,116,139,0.25) 40%,
      rgba(51,65,85,0.4) 80%
    );
    background-size: 600px 100%;
    animation: shimmerSlide 1.6s ease-in-out infinite;
    border-radius: 6px;
  }

  /* ── AGENT COMPOSER (bottom input inside AgentSpace) ──────── */
  .agent-composer {
    display: flex; align-items: flex-end; gap: 8px;
    padding: 10px 12px;
    background: rgba(10,17,32,0.60);
    border-top: 1px solid rgba(71,85,105,0.30);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
  }
  .agent-field {
    flex: 1; border: 1.5px solid rgba(71,85,105,0.50);
    border-radius: 12px; background: rgba(15,23,42,0.70);
    color: #f1f5f9; font-size: 13px; line-height: 1.5;
    padding: 9px 14px; resize: none; outline: none;
    font-family: 'DM Mono', monospace; min-width: 0;
    max-height: 96px; overflow-y: auto;
    transition: border-color 250ms, box-shadow 250ms;
    scrollbar-width: none;
  }
  .agent-field::-webkit-scrollbar { display: none; }
  .agent-field::placeholder { color: #334155; font-size: 12px; }
  .agent-field:focus {
    border-color: rgba(56,189,248,0.45);
    box-shadow: 0 0 0 3px rgba(56,189,248,0.07);
  }
  .agent-send {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg,#38bdf8,#0ea5e9);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 220ms ease;
    box-shadow: 0 4px 12px rgba(14,165,233,0.30);
  }
  .agent-send:hover:not(:disabled) {
    background: linear-gradient(135deg,#7dd3fc,#38bdf8);
    transform: translateY(-1px); box-shadow: 0 6px 18px rgba(14,165,233,0.45);
  }
  .agent-send:active:not(:disabled) { transform: translateY(0); }
  .agent-send:disabled { background: rgba(30,41,59,0.6); box-shadow: none; cursor: not-allowed; }

  /* ── TOPIC BADGE (above top bar when topic is set) ────────── */
  .topic-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 12px; border-radius: 999px;
    background: rgba(148,163,184,0.07);
    border: 1.5px solid rgba(148,163,184,0.18);
    font-family: 'DM Mono', monospace; font-size: 10.5px;
    color: #64748b; letter-spacing: .04em;
    animation: fadeIn 250ms ease both;
    white-space: nowrap; overflow: hidden; max-width: 480px;
  }
  .topic-badge .tb-label {
    color: #475569; font-size: 9px; letter-spacing: .10em;
    text-transform: uppercase; flex-shrink: 0;
  }
  .topic-badge .tb-value {
    overflow: hidden; text-overflow: ellipsis; color: #94a3b8;
  }

  /* ── NEW TOPIC BUTTON ─────────────────────────────────────── */
  .new-topic-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 0 14px; height: 30px; border-radius: 999px;
    background: rgba(56,189,248,0.07);
    border: 1.5px solid rgba(56,189,248,0.22);
    color: #7dd3fc; font-size: 11px; font-weight: 500;
    font-family: 'Inter', sans-serif; cursor: pointer;
    transition: all 220ms ease; white-space: nowrap; flex-shrink: 0;
  }
  .new-topic-btn:hover {
    background: rgba(56,189,248,0.14);
    border-color: rgba(56,189,248,0.45);
    color: #bae6fd; transform: translateY(-1px);
  }
  .new-topic-btn:active { transform: translateY(0); }

  /* ── CSV DROPZONE ──────────────────────────────────────────── */
  @keyframes vectorPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); border-color: rgba(56,189,248,0.30); }
    50%     { box-shadow: 0 0 28px 4px rgba(56,189,248,0.18); border-color: rgba(56,189,248,0.70); }
  }
  @keyframes uploadSpin { to { transform: rotate(360deg); } }
  @keyframes successPop {
    0%   { transform: scale(0.7); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .dropzone {
    position: relative;
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px;
    background: rgba(15,23,42,0.70);
    border: 1.5px dashed rgba(71,85,105,0.55);
    border-radius: 14px;
    cursor: pointer;
    transition: border-color 250ms, background 250ms, box-shadow 250ms;
    backdrop-filter: blur(12px);
    overflow: hidden;
  }
  .dropzone:hover, .dropzone.drag-over {
    border-color: rgba(56,189,248,0.55);
    background: rgba(56,189,248,0.05);
    box-shadow: 0 0 20px rgba(56,189,248,0.10);
  }
  .dropzone input[type="file"] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%;
  }
  .dropzone.uploading {
    animation: vectorPulse 1.4s ease-in-out infinite;
    pointer-events: none;
  }
  .dropzone.success {
    border-style: solid;
    border-color: rgba(74,222,128,0.50);
    background: rgba(74,222,128,0.05);
    box-shadow: 0 0 20px rgba(74,222,128,0.10);
    animation: none;
  }

  /* ── DATASET ACTIVE BADGE (header) ─────────────────────────── */
  .dataset-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 4px 11px; border-radius: 999px;
    background: rgba(74,222,128,0.08);
    border: 1.5px solid rgba(74,222,128,0.28);
    font-family: 'DM Mono', monospace; font-size: 10px;
    color: #4ade80; letter-spacing: .04em;
    animation: fadeIn 300ms ease both;
    white-space: nowrap;
    cursor: pointer;
    transition: all 220ms ease;
  }
  .dataset-badge:hover {
    background: rgba(248,113,113,0.08);
    border-color: rgba(248,113,113,0.35);
    color: #f87171;
  }

  /* ── CUSTOM KPI CARDS ──────────────────────────────────────── */
  .custom-kpi {
    background: rgba(30,41,59,0.55);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(71,85,105,0.50);
    border-radius: 20px; padding: 22px 24px;
    position: relative; overflow: hidden;
    animation: enterY .5s cubic-bezier(.16,1,.3,1) both;
  }
  .custom-kpi::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(74,222,128,0.18), transparent);
    pointer-events: none;
  }

  /* ── AMBIENT GLOW ────────────────────────── */
  .ambient {
    position:fixed; pointer-events:none; z-index:0; border-radius:50%;
  }

  /* ── RESPONSIVE ──────────────────────────── */
  @media(max-width:768px) {
    .nav-tabs { display:none !important; }
    .nav-tabs.mobile-open {
      display:flex !important; flex-direction:column;
      position:absolute; top:62px; left:0; right:0;
      background:rgba(15,23,42,0.97); backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(71,85,105,0.40);
      z-index:400; padding:8px 16px 14px; gap:4px;
    }
    .mob-btn { display:flex !important; }
  }
  @media(min-width:769px) { .mob-btn { display:none !important; } }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC DATA  [PRESERVED]
───────────────────────────────────────────────────────────────────────────── */
const DS = {
  totalInventory:   10781,
  avgPrice:         52340,
  mostPopularModel: "3 Series 320i",
  availableCount:   6847,
  reservedCount:    2190,
  soldCount:        1744,
  seriesBreakdown: [
    { series:"3 Series", count:2841 }, { series:"5 Series", count:1920 },
    { series:"X3",       count:1540 }, { series:"X5",       count:1380 },
    { series:"1 Series", count:980  }, { series:"7 Series", count:740  },
    { series:"M Series", count:680  }, { series:"i Series", count:420  },
    { series:"X7",       count:280  },
  ],
  avgPriceByYear: [
    { year:"2018", avgPrice:38200 }, { year:"2019", avgPrice:41500 },
    { year:"2020", avgPrice:44800 }, { year:"2021", avgPrice:49200 },
    { year:"2022", avgPrice:53700 }, { year:"2023", avgPrice:61400 },
  ],
  fuelBreakdown: [
    { name:"Petrol", value:5210 }, { name:"Diesel", value:2890 },
    { name:"Hybrid", value:1620 }, { name:"Electric", value:1061 },
  ],
};

const MODELS_META = [
  { model:"3 Series 320i",  series:"3 Series", base:34900  },
  { model:"3 Series 330e",  series:"3 Series", base:44500  },
  { model:"3 Series M340i", series:"3 Series", base:58700  },
  { model:"5 Series 520d",  series:"5 Series", base:47200  },
  { model:"5 Series 530d",  series:"5 Series", base:52700  },
  { model:"5 Series 540i",  series:"5 Series", base:61800  },
  { model:"7 Series 740Le", series:"7 Series", base:98400  },
  { model:"7 Series 750i",  series:"7 Series", base:112000 },
  { model:"X3 xDrive20d",   series:"X3",       base:41800  },
  { model:"X3 xDrive30i",   series:"X3",       base:45900  },
  { model:"X5 xDrive40i",   series:"X5",       base:68200  },
  { model:"X5 xDrive45e",   series:"X5",       base:74600  },
  { model:"X7 xDrive50i",   series:"X7",       base:112000 },
  { model:"M2 Competition", series:"M Series", base:74600  },
  { model:"M3 Competition", series:"M Series", base:87900  },
  { model:"M4 Competition", series:"M Series", base:89500  },
  { model:"1 Series 118i",  series:"1 Series", base:28100  },
  { model:"1 Series 120d",  series:"1 Series", base:30400  },
  { model:"i4 eDrive40",    series:"i Series", base:67300  },
  { model:"iX xDrive50",    series:"i Series", base:95200  },
];
const FUELS    = ["Petrol","Diesel","Hybrid","Electric"];
const TRANS    = ["Automatic","Manual"];
const STATUSES = ["Available","Available","Available","Reserved","Sold"];
const COLOURS  = ["Alpine White","Jet Black","Mineral Grey","Phytonic Blue","Aventurine Red","Frozen Grey"];
const YEARS    = [2018,2019,2020,2021,2022,2023];

const BMW_INVENTORY = Array.from({ length:50 }, (_,i) => {
  const m = MODELS_META[i % MODELS_META.length];
  return {
    id:           `BM-${String(i+1).padStart(4,"0")}`,
    model:        m.model,
    series:       m.series,
    year:         YEARS[i % YEARS.length],
    fuel:         FUELS[i % FUELS.length],
    transmission: TRANS[i % 2],
    mileage:      2000 + (i * 1637) % 78000,
    price:        m.base + ((i * 1231) % 12000) - 6000,
    colour:       COLOURS[i % COLOURS.length],
    status:       STATUSES[i % STATUSES.length],
  };
});

/* Mock includes insight_summary for offline demo */
const MOCK_RESULT = {
  chart_type: "bar",
  title:      "BMW Average Listing Price by Year (2018–2023)",
  x_axis_key: "year",
  y_axis_key: "avgPrice",
  chart_data: DS.avgPriceByYear,
  insight_summary: "Listing prices have grown consistently at ~10% CAGR from 2018–2023, accelerating sharply post-2021 driven by global semiconductor shortages and constrained new-vehicle supply. The 2023 average of £61,400 represents a 60.7% premium over 2018 baseline. Premium and EV segments are key price drivers. Expect continued softening in 2024 as supply normalises, with EV models sustaining price floors due to battery cost structures.",
};

const TABS        = ["Analytics", "Inventory", "Fleet Overview"];
const SUGGESTIONS = [
  "price vs mileage — 2018 models",
  "avg price trend by year",
  "sales volume by series",
];
const PAGE_SIZE  = 10;
const PIE_COLORS = [T.c1, T.c2, T.c3, T.c4];

const STATUS_META = {
  Available: { bg:"rgba(74,222,128,.10)",  border:"rgba(74,222,128,.30)",  text:"#4ade80" },
  Reserved:  { bg:"rgba(251,191,36,.10)",  border:"rgba(251,191,36,.28)",  text:"#fbbf24" },
  Sold:      { bg:"rgba(100,116,139,.10)", border:"rgba(100,116,139,.28)", text:"#94a3b8" },
};
const FUEL_ICONS = { Petrol:"⛽", Diesel:"🛢", Hybrid:"⚡", Electric:"🔋" };

/* ─────────────────────────────────────────────────────────────────────────────
   PDF EXPORT ENGINE  [PRESERVED — DO NOT TOUCH]
───────────────────────────────────────────────────────────────────────────── */
async function generatePDF({ chartRef, chartData, chartTitle, userQuery }) {
  const canvas = await html2canvas(chartRef.current, {
    backgroundColor:"#080808", scale:2.5, useCORS:true, logging:false, imageTimeout:0,
  });
  const chartImg = canvas.toDataURL("image/png");
  const imgRatio = canvas.width / canvas.height;
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const GUTTER = 16;
  doc.setFillColor(8,8,8); doc.rect(0,0,W,H,"F");
  doc.setFillColor(0,212,255); doc.rect(0,0,W,0.8,"F");
  doc.setFillColor(13,13,13); doc.rect(0,0.8,W,22,"F");
  const lx=GUTTER, ly=4, qs=4;
  [[0,0,T.c1],[qs,0,"#080808"],[0,qs,"#080808"],[qs,qs,T.c1]].forEach(([ox,oy,c])=>{
    const [r,g,b]=c==="080808"?[8,8,8]:[0,212,255];
    doc.setFillColor(r,g,b); doc.rect(lx+ox,ly+oy,qs,qs,"F");
  });
  doc.setDrawColor(30,30,30); doc.setLineWidth(0.25); doc.rect(lx,ly,qs*2,qs*2);
  doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(242,242,242);
  doc.text("BMW AI INTELLIGENCE BRIEFING", lx+qs*2+6, ly+5.5);
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(45,45,45);
  doc.text("ENTERPRISE ANALYTICS TERMINAL  ·  CONFIDENTIAL  ·  v2.1", lx+qs*2+6, ly+10.5);
  doc.setFontSize(6.5); doc.setTextColor(38,38,38);
  doc.text(`GENERATED: ${new Date().toUTCString()}`, W-GUTTER, ly+5.5, {align:"right"});
  doc.text(`RECORDS: ${chartData?.length??0}  ·  SOURCE: BMW AI ENGINE`, W-GUTTER, ly+10.5, {align:"right"});
  doc.setDrawColor(22,22,22); doc.setLineWidth(0.35); doc.line(GUTTER,23.5,W-GUTTER,23.5);
  let curY=30;
  doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(0,212,255);
  doc.text("▸  REPORT OBJECTIVE", GUTTER, curY); curY+=5;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(180,180,180);
  const queryLines=doc.splitTextToSize(`"${userQuery||"No query specified"}"`, W-GUTTER*2);
  doc.text(queryLines, GUTTER, curY); curY+=queryLines.length*4.8+3;
  doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(0,212,255);
  doc.text("▸  ANALYSIS OUTPUT", GUTTER, curY); curY+=4;
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(230,230,230);
  doc.text(chartTitle||"Visual Analysis", GUTTER, curY); curY+=3;
  const availH=H-curY-52, imgH=Math.min(availH,72);
  const imgW=Math.min(imgH*imgRatio, W-GUTTER*2);
  const finalImgH=imgW/imgRatio;
  doc.setFillColor(13,13,13); doc.setDrawColor(22,22,22); doc.setLineWidth(0.25);
  doc.rect(GUTTER,curY,imgW,finalImgH+3,"FD");
  doc.addImage(chartImg,"PNG",GUTTER+1.5,curY+1.5,imgW-3,finalImgH);
  curY+=finalImgH+6;
  doc.setFont("helvetica","bold"); doc.setFontSize(6); doc.setTextColor(0,212,255);
  doc.text("▸  RAW DATA POINTS", GUTTER, curY); curY+=3;
  if (chartData?.length) {
    const cols=Object.keys(chartData[0]);
    autoTable(doc,{
      startY:curY, head:[cols.map(c=>c.toUpperCase())],
      body:chartData.map(row=>cols.map(k=>{ const v=row[k]; return typeof v==="number"?v.toLocaleString():String(v??"—"); })),
      theme:"plain", margin:{left:GUTTER,right:GUTTER},
      styles:{font:"courier",fontSize:7.5,cellPadding:{top:2.5,bottom:2.5,left:5,right:5},textColor:[140,140,140],lineColor:[20,20,20],lineWidth:0.25,fillColor:[8,8,8],minCellHeight:7},
      headStyles:{fillColor:[13,13,13],textColor:[0,212,255],fontStyle:"bold",fontSize:6.5,lineColor:[22,22,22],lineWidth:0.4,halign:"left",cellPadding:{top:3,bottom:3,left:5,right:5}},
      alternateRowStyles:{fillColor:[11,11,11]},
      columnStyles:Object.fromEntries(cols.map((_,i)=>[i,{halign:"left"}])),
    });
  }
  const footerY=H-6;
  doc.setDrawColor(18,18,18); doc.setLineWidth(0.3); doc.line(GUTTER,footerY-3,W-GUTTER,footerY-3);
  doc.setFont("helvetica","normal"); doc.setFontSize(6); doc.setTextColor(35,35,35);
  doc.text("BMW AI INSIGHT ENGINE  ·  ENTERPRISE INTELLIGENCE TERMINAL  ·  INTERNAL USE ONLY", GUTTER, footerY);
  doc.text("PAGE 1", W-GUTTER, footerY, {align:"right"});
  doc.save("BMW_Intelligence_Briefing.pdf");
}

/* ─────────────────────────────────────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

/* Glass tooltip */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(15,23,42,0.95)", backdropFilter:"blur(20px)",
      border:"1px solid rgba(71,85,105,0.60)", borderRadius:14,
      padding:"12px 16px", boxShadow:"0 16px 48px rgba(0,0,0,0.50)",
    }}>
      <p style={{ color:"#f1f5f9", ...mono, fontSize:11, marginBottom:8, fontWeight:600 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ ...mono, fontSize:12, margin:"3px 0" }}>
          <span style={{ color:"#475569", marginRight:6 }}>{p.name}:</span>
          <span style={{ color:"#94a3b8", fontWeight:700 }}>
            {typeof p.value==="number" ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

function TypeTag({ type }) {
  return (
    <span style={{
      ...sans, fontSize:11, fontWeight:600,
      color:"#94a3b8",
      background:"rgba(148,163,184,0.10)",
      border:"1.5px solid rgba(148,163,184,0.20)",
      borderRadius:999, padding:"3px 12px",
    }}>
      {(type||"").toUpperCase()}
    </span>
  );
}

function SBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.Sold;
  return (
    <span className="sbadge" style={{ background:s.bg, border:`1.5px solid ${s.border}`, color:s.text }}>
      {status}
    </span>
  );
}

function AnimNum({ target, prefix="", suffix="" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur=0;
    const steps=55, inc=target/steps;
    const id=setInterval(()=>{
      cur+=inc;
      if (cur>=target) { setV(target); clearInterval(id); }
      else setV(Math.round(cur));
    }, 13);
    return ()=>clearInterval(id);
  }, [target]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHART RENDERER — muted powder blue on glass
───────────────────────────────────────────────────────────────────────────── */
function ChartRenderer({ chartType, chartData, xAxisKey, yAxisKey, animKey }) {
  const common    = { data:chartData, margin:{top:16,right:28,left:10,bottom:28} };
  const axisStyle = { fill:"#475569", fontSize:11, fontFamily:"'DM Mono',monospace" };
  const gridStyle = { stroke:"#334155", strokeDasharray:"3 3" };

  const sharedAxes = (
    <>
      <CartesianGrid {...gridStyle} />
      <XAxis dataKey={xAxisKey} tick={axisStyle} axisLine={{stroke:"#334155"}} tickLine={false} />
      <YAxis tick={axisStyle} axisLine={{stroke:"#334155"}} tickLine={false} tickFormatter={v=>v.toLocaleString()} />
      <Tooltip content={<CustomTooltip/>} cursor={{fill:"rgba(148,163,184,0.05)"}} />
      <Legend wrapperStyle={{ color:"#64748b", fontSize:12, paddingTop:14, fontFamily:"'Inter',sans-serif" }} />
    </>
  );

  return (
    <div key={animKey} className="a-chart" style={{ width:"100%", height:"100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType==="line" ? (
          <LineChart {...common}>
            {sharedAxes}
            <Line type="monotone" dataKey={yAxisKey} stroke="#94a3b8" strokeWidth={2.5}
              dot={{r:4,fill:"#94a3b8",strokeWidth:0}}
              activeDot={{r:7,fill:"#cbd5e1",stroke:"#0f172a",strokeWidth:2}} />
          </LineChart>
        ) : chartType==="area" ? (
          <AreaChart {...common}>
            {sharedAxes}
            <Area type="monotone" dataKey={yAxisKey} stroke="#94a3b8" strokeWidth={2.5}
              fill="#94a3b8" fillOpacity={0.08} />
          </AreaChart>
        ) : (
          <ReBarChart {...common}>
            {sharedAxes}
            <Bar dataKey={yAxisKey} fill="#94a3b8" radius={[5,5,0,0]} maxBarSize={52} animationDuration={580}/>
          </ReBarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AGENT SPACE — Conversational right panel
   · Top bar query = active topic (context anchor)
   · Agent composer = follow-up input, always anchored to current topic
   · New topic from top bar → resets thread automatically
───────────────────────────────────────────────────────────────────────────── */
function AgentSpace({ chatHistory, agentInput, setAgentInput, onSend, agentLoading }) {
  const isEmpty  = chatHistory.length === 0;
  const turns    = Math.floor(chatHistory.length / 2);

  // Scoped to this component — never touches the page scroll
  const messagesEndRef = useRef(null);

  // Auto-resize textarea as user types
  const taRef = useRef(null);
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
  }, [agentInput]);

  // block:"nearest" scrolls ONLY inside the chat box — never yanks the page
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }, [chatHistory, agentLoading]);

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div
      className="glass-card a-insight bento-insight"
      style={{ display:"flex", flexDirection:"column", overflow:"hidden", height:600, maxHeight:600 }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 20px", borderBottom:"1px solid rgba(71,85,105,0.28)", flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{
            width:28, height:28, borderRadius:8,
            background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.22)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <BrainCircuit size={13} color="#38bdf8"/>
          </div>
          <div>
            <span style={{ ...mono, fontSize:9, color:"#38bdf8", letterSpacing:".12em", textTransform:"uppercase", display:"block" }}>
              Agent Space
            </span>
            <span style={{ ...sans, fontSize:13, fontWeight:700, color:"#f1f5f9", letterSpacing:"-.01em" }}>
              Conversation Thread
            </span>
          </div>
        </div>

        {turns > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:5,
            background:"rgba(56,189,248,0.07)", border:"1.5px solid rgba(56,189,248,0.18)",
            borderRadius:999, padding:"3px 10px",
          }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"livePulse 2.4s infinite" }}/>
            <span style={{ ...mono, fontSize:10, color:"#7dd3fc" }}>
              {turns} turn{turns !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable message list — ONLY this div scrolls ──────── */}
      <div style={{
        flex:1, minHeight:0, overflowY:"auto", overflowX:"hidden",
        padding:"14px 14px 6px",
        display:"flex", flexDirection:"column", gap:10,
        overscrollBehavior:"contain",
      }}>
        {/* Empty state */}
        {isEmpty && !agentLoading && (
          <div style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap:14, opacity:.4, padding:"44px 0",
          }}>
            <BrainCircuit size={28} color="#475569" style={{ animation:"floatUp 3s ease-in-out infinite" }}/>
            <div style={{ textAlign:"center" }}>
              <p style={{ ...sans, fontSize:13, color:"#475569", marginBottom:5 }}>No conversation yet</p>
              <p style={{ ...mono, fontSize:10, color:"#2d3f55", letterSpacing:".05em", lineHeight:1.6 }}>
                Run a topic above to start,<br/>then ask follow-ups here
              </p>
            </div>
          </div>
        )}

        {/* Bubbles */}
        {chatHistory.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} style={{
              display:"flex", flexDirection:"column",
              alignItems: isUser ? "flex-end" : "flex-start",
              animation:"enterY .38s cubic-bezier(.16,1,.3,1) both",
              animationDelay:`${(i % 6) * 35}ms`,
            }}>
              {/* Role label */}
              <div style={{
                display:"flex", alignItems:"center", gap:5, marginBottom:4,
                flexDirection: isUser ? "row-reverse" : "row",
              }}>
                {!isUser && (
                  <div style={{
                    width:17, height:17, borderRadius:5,
                    background:"rgba(56,189,248,0.14)", border:"1px solid rgba(56,189,248,0.22)",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    <Sparkles size={8} color="#38bdf8"/>
                  </div>
                )}
                <span style={{
                  ...mono, fontSize:9, letterSpacing:".10em", textTransform:"uppercase",
                  color: isUser ? "#334155" : "#38bdf8",
                }}>
                  {isUser ? "You" : "AI Agent"}
                </span>
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth:"93%", padding:"9px 13px",
                borderRadius: isUser ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
                ...(isUser ? {
                  background:"rgba(30,41,59,0.80)",
                  border:"1.5px solid rgba(71,85,105,0.50)",
                } : {
                  background:"rgba(56,189,248,0.06)",
                  border:"1.5px solid rgba(56,189,248,0.13)",
                }),
                color:"#cbd5e1", fontSize: isUser ? 13 : 12.5,
                lineHeight:1.7, ...sans, wordBreak:"break-word",
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {agentLoading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{
                width:17, height:17, borderRadius:5,
                background:"rgba(56,189,248,0.14)", border:"1px solid rgba(56,189,248,0.22)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <Sparkles size={8} color="#38bdf8"/>
              </div>
              <span style={{ ...mono, fontSize:9, letterSpacing:".10em", color:"#38bdf8", textTransform:"uppercase" }}>
                AI Agent
              </span>
            </div>
            <div style={{
              padding:"9px 14px",
              background:"rgba(56,189,248,0.06)", border:"1.5px solid rgba(56,189,248,0.13)",
              borderRadius:"3px 14px 14px 14px",
              display:"flex", alignItems:"center", gap:5,
            }}>
              {[0,1,2].map(d => (
                <div key={d} style={{
                  width:5, height:5, borderRadius:"50%", background:"#38bdf8", opacity:.55,
                  animation:`dotBlink 1.2s ${d*0.2}s ease-in-out infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* Auto-scroll anchor — scoped to this container */}
        <div ref={messagesEndRef}/>
      </div>

      {/* ── Composer — pinned bottom input ─────────────────────── */}
      <div className="agent-composer">
        <textarea
          ref={taRef}
          className="agent-field"
          rows={1}
          value={agentInput}
          onChange={e => setAgentInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a follow-up… (Enter to send)"
          spellCheck={false}
        />
        <button
          className="agent-send"
          onClick={onSend}
          disabled={agentLoading || !agentInput.trim()}
          title="Send (Enter)"
        >
          {agentLoading
            ? <Loader2 size={14} color="#0c1a2e" style={{ animation:"spin .7s linear infinite" }}/>
            : <ArrowRight size={14} color="#0c1a2e"/>
          }
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ERROR BANNER
───────────────────────────────────────────────────────────────────────────── */
function ErrBanner({ error, is502 }) {
  if (!error) return null;
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:14,
      background:is502 ? "rgba(248,113,113,0.07)" : "rgba(251,191,36,0.07)",
      border:`1.5px solid ${is502?"rgba(248,113,113,0.25)":"rgba(251,191,36,0.22)"}`,
      borderRadius:16, padding:"16px 20px", marginBottom:22,
      backdropFilter:"blur(12px)", animation:"fadeIn .3s ease both",
    }}>
      <div style={{ flexShrink:0, marginTop:2 }}>
        {is502 ? <WifiOff size={15} color="#f87171"/> : <AlertCircle size={15} color="#fbbf24"/>}
      </div>
      <div>
        <p style={{...mono,fontSize:12,fontWeight:700,marginBottom:5,
          color:is502?"#f87171":"#fbbf24",
          ...(is502?{animation:"compilePulse 1.8s ease-in-out infinite"}:{}),
        }}>
          {is502 ? "502 — Service Reconnecting" : "API Unavailable — Demo Mode"}
        </p>
        <p style={{ fontSize:13, lineHeight:1.65, color:is502?"rgba(248,113,113,.75)":"rgba(251,191,36,.75)" }}>
          {is502 ? "Backend returned 502. Cached demo data displayed." : error}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GLASS DATA TABLE
───────────────────────────────────────────────────────────────────────────── */
function DataTable({ data, xKey, yKey }) {
  if (!data?.length) return null;
  const keys = Object.keys(data[0]);
  return (
    <div style={{ overflowX:"auto", borderRadius:20, overflow:"hidden" }}>
      <table className="dt">
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k} className={k===xKey||k===yKey?"sort-on":""}>
                {k.toUpperCase()}{(k===xKey||k===yKey)?" ↑":""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row,i) => (
            <tr key={i}>
              {keys.map(k => (
                <td key={k} style={{
                  color: k===yKey ? "#cbd5e1" : "#64748b",
                  background: i%2===0 ? "rgba(15,23,42,0.30)" : "rgba(15,23,42,0.15)",
                  ...(k===yKey ? {...mono,fontWeight:700} : {}),
                }}>
                  {typeof row[k]==="number" ? row[k].toLocaleString() : row[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INVENTORY TAB
───────────────────────────────────────────────────────────────────────────── */
function InventoryTab() {
  const [page,    setPage]    = useState(0);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [filter,  setFilter]  = useState("All");

  const series   = ["All", ...Array.from(new Set(BMW_INVENTORY.map(r => r.series)))];
  const filtered = BMW_INVENTORY.filter(r => filter==="All" || r.series===filter);
  const sorted   = [...filtered].sort((a,b) => {
    const av=a[sortKey], bv=b[sortKey];
    const c=typeof av==="number"?av-bv:String(av).localeCompare(String(bv));
    return sortDir==="asc"?c:-c;
  });
  const totalPages = Math.ceil(sorted.length/PAGE_SIZE);
  const slice      = sorted.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE);
  const doSort     = k => {
    if (sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(0);
  };

  const cols = [
    {k:"id",l:"ID"},{k:"model",l:"Model"},{k:"year",l:"Year"},
    {k:"series",l:"Series"},{k:"fuel",l:"Fuel"},{k:"transmission",l:"Trans"},
    {k:"mileage",l:"Mileage"},{k:"price",l:"Price"},{k:"colour",l:"Colour"},{k:"status",l:"Status"},
  ];

  return (
    <div className="a-enter">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <p style={{...mono,fontSize:10.5,color:T.t3,letterSpacing:".14em",textTransform:"uppercase",marginBottom:8}}>
          Vehicle Inventory
        </p>
        <h2 style={{...sans,fontSize:26,fontWeight:700,color:T.t0,letterSpacing:"-.03em",marginBottom:6}}>
          BMW Fleet Registry
        </h2>
        <p style={{fontSize:14,color:T.t2}}>
          Showing <span style={{color:T.t1}}>50</span> of{" "}
          <span style={{color:T.accentB,...mono}}>10,781</span> total records
        </p>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:20}}>
        {series.map(s => (
          <button key={s} className="chip" onClick={()=>{setFilter(s);setPage(0);}}
            style={{
              color:filter===s?"#f1f5f9":"#64748b",
              borderColor:filter===s?"rgba(148,163,184,0.50)":"rgba(71,85,105,0.45)",
              background:filter===s?"rgba(148,163,184,0.14)":"rgba(30,41,59,0.55)",
              fontWeight:filter===s?600:400,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Glass table */}
      <div className="glass-card hover-card" style={{ overflow:"hidden", marginBottom:18 }}>
        <div style={{ overflowX:"auto" }}>
          <table className="dt">
            <thead>
              <tr>
                {cols.map(({k,l}) => (
                  <th key={k} className={sortKey===k?"sort-on":""} onClick={()=>doSort(k)}>
                    {l}{sortKey===k&&(sortDir==="asc"?" ↑":" ↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row,i) => (
                <tr key={row.id}>
                  <td style={{...mono,fontSize:11,color:"#334155",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.id}</td>
                  <td style={{color:"#f1f5f9",fontWeight:700,fontSize:14,...sans,background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.model}</td>
                  <td style={{...mono,color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.year}</td>
                  <td style={{color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.series}</td>
                  <td style={{color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}><span style={{marginRight:5}}>{FUEL_ICONS[row.fuel]}</span>{row.fuel}</td>
                  <td style={{color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.transmission}</td>
                  <td style={{...mono,color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.mileage.toLocaleString()}</td>
                  <td style={{...mono,color:"#cbd5e1",fontWeight:700,background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>${row.price.toLocaleString()}</td>
                  <td style={{color:"#64748b",background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}>{row.colour}</td>
                  <td style={{background:i%2===0?"rgba(15,23,42,0.30)":"rgba(15,23,42,0.15)"}}><SBadge status={row.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <span style={{...mono,fontSize:11,color:T.t3,letterSpacing:".04em"}}>
          Page {page+1} of {totalPages} · {filtered.length} records
        </span>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <button className="pgbtn" onClick={()=>setPage(0)} disabled={page===0}><ChevronLeft size={10}/><ChevronLeft size={10} style={{marginLeft:-4}}/></button>
          <button className="pgbtn" onClick={()=>setPage(p=>p-1)} disabled={page===0}><ChevronLeft size={11}/> Prev</button>
          {Array.from({length:totalPages},(_,i)=>i).filter(i=>Math.abs(i-page)<=2).map(i=>(
            <button key={i} className={`pgn${i===page?" on":""}`} onClick={()=>setPage(i)}>{i+1}</button>
          ))}
          <button className="pgbtn" onClick={()=>setPage(p=>p+1)} disabled={page>=totalPages-1}>Next <ChevronRight size={11}/></button>
          <button className="pgbtn" onClick={()=>setPage(totalPages-1)} disabled={page>=totalPages-1}><ChevronRight size={10}/><ChevronRight size={10} style={{marginLeft:-4}}/></button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FLEET OVERVIEW TAB
───────────────────────────────────────────────────────────────────────────── */
function FleetOverview() {
  const axS = { fill:"#334155", fontSize:11, fontFamily:"'DM Mono',monospace" };
  const kpis = [
    { Icon:Package,    label:"Total Inventory",   num:DS.totalInventory, pre:"",  color:"#94a3b8", glowC:"rgba(148,163,184,0.12)", delay:"0s"   },
    { Icon:DollarSign, label:"Avg Listing Price",  num:DS.avgPrice,       pre:"$", color:"#4ade80", glowC:"rgba(74,222,128,0.12)",  delay:".06s" },
    { Icon:Star,       label:"Top Model",          str:DS.mostPopularModel,        color:"#fbbf24", glowC:"rgba(251,191,36,0.12)",  delay:".12s" },
    { Icon:Activity,   label:"Available Now",      num:DS.availableCount, pre:"",  color:"#38bdf8", glowC:"rgba(56,189,248,0.12)",  delay:".18s" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="a-enter" style={{ marginBottom:32 }}>
        <p style={{...mono,fontSize:10.5,color:T.t3,letterSpacing:".14em",textTransform:"uppercase",marginBottom:8}}>
          Fleet Overview
        </p>
        <h2 style={{...sans,color:T.t0,fontSize:28,fontWeight:700,letterSpacing:"-.03em"}}>
          BMW Fleet Intelligence
        </h2>
        <p style={{color:T.t2,fontSize:14,marginTop:8}}>
          Aggregated analytics across{" "}
          <span style={{color:T.accentB,...mono}}>10,781</span> vehicles
        </p>
      </div>

      {/* KPI bento row */}
      <div className="stat-grid" style={{ marginBottom:16 }}>
        {kpis.map(({Icon,label,num,str,pre="",color,glowC,delay}) => (
          <div key={label} className="kpi-card" style={{ "--kc":color, animation:`enterY .55s ${delay} cubic-bezier(.16,1,.3,1) both` }}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <div style={{padding:9,background:glowC,borderRadius:10,border:`1.5px solid ${color}28`}}>
                <Icon size={14} color={color}/>
              </div>
              <span style={{...sans,fontSize:12,color:T.t2,fontWeight:500}}>{label}</span>
            </div>
            <div style={{color:T.t0,fontSize:str?15:26,fontWeight:700,...sans,letterSpacing:"-.03em"}}>
              {str ? str : <AnimNum target={num} prefix={pre}/>}
            </div>
          </div>
        ))}
      </div>

      {/* Status distribution — glass */}
      <div className="glass-card magnify-card a-enter-1" style={{ padding:"24px 26px", marginBottom:16 }}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <span style={{...sans,fontSize:13,color:T.t0,fontWeight:600}}>Fleet Status Distribution</span>
          <span style={{...mono,fontSize:11,color:T.t3}}>{DS.totalInventory.toLocaleString()} total</span>
        </div>
        <div style={{display:"flex",height:6,gap:2,marginBottom:16,borderRadius:999,overflow:"hidden"}}>
          {[
            {label:"Available",count:DS.availableCount,color:"#4ade80"},
            {label:"Reserved", count:DS.reservedCount, color:"#fbbf24"},
            {label:"Sold",     count:DS.soldCount,      color:"#334155"},
          ].map(({label,count,color}) => (
            <div key={label} style={{flex:count/DS.totalInventory,background:color,borderRadius:999}} title={`${label}: ${count.toLocaleString()}`}/>
          ))}
        </div>
        <div style={{display:"flex",gap:26,flexWrap:"wrap"}}>
          {[
            {label:"Available",count:DS.availableCount,color:"#4ade80"},
            {label:"Reserved", count:DS.reservedCount, color:"#fbbf24"},
            {label:"Sold",     count:DS.soldCount,      color:"#475569"},
          ].map(({label,count,color}) => (
            <div key={label} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:color}}/>
              <span style={{...sans,fontSize:12,color:T.t2}}>{label}</span>
              <span style={{...mono,fontSize:12,color:T.t0,fontWeight:700}}>{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two charts */}
      <div className="two-col" style={{ marginBottom:16 }}>
        <div className="glass-card magnify-card a-enter-2" style={{padding:"24px 20px 16px"}}>
          <p style={{...sans,fontSize:13,color:T.t0,fontWeight:600,marginBottom:16}}>Avg Price — Year on Year</p>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={DS.avgPriceByYear} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={axS} axisLine={false} tickLine={false}/>
              <YAxis tick={axS} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="avgPrice" name="Avg Price"
                stroke="#94a3b8" strokeWidth={2} fill="#94a3b8" fillOpacity={0.07} animationDuration={850}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card magnify-card a-enter-2" style={{padding:"24px 20px 16px"}}>
          <p style={{...sans,fontSize:13,color:T.t0,fontWeight:600,marginBottom:16}}>Fuel Type Breakdown</p>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <PieChart width={130} height={130}>
              <Pie data={DS.fuelBreakdown} dataKey="value" cx={63} cy={63} innerRadius={38} outerRadius={58} paddingAngle={3}>
                {DS.fuelBreakdown.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} stroke="none"/>)}
              </Pie>
              <Tooltip content={<CustomTooltip/>}/>
            </PieChart>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
              {DS.fuelBreakdown.map((f,i)=>(
                <div key={f.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:PIE_COLORS[i]}}/>
                    <span style={{fontSize:13,color:T.t2,...sans}}>{f.name}</span>
                  </div>
                  <span style={{...mono,fontSize:12,color:T.t0,fontWeight:700}}>{f.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Series bar */}
      <div className="glass-card magnify-card a-enter-3" style={{padding:"24px 20px 16px"}}>
        <p style={{...sans,fontSize:13,color:T.t0,fontWeight:600,marginBottom:16}}>Inventory Volume by Series</p>
        <ResponsiveContainer width="100%" height={165}>
          <ReBarChart data={DS.seriesBreakdown} margin={{top:0,right:4,left:0,bottom:0}}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="series" tick={{...axS,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={axS} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" fill="#94a3b8" radius={[5,5,0,0]} maxBarSize={44} animationDuration={680}/>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────────────────────────── */
export default function App() {

  // ── State ─────────────────────────────────────────────────────────────────
  const [query,        setQuery]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [is502,        setIs502]        = useState(false);
  const [result,       setResult]       = useState(null);
  const [activeTab,    setActiveTab]    = useState("Analytics");
  const [chartKey,     setChartKey]     = useState(0);
  const [insightSummary, setInsightSummary] = useState(null);

  // ── Conversation layer ────────────────────────────────────────────────────
  const [activeTopic,   setActiveTopic]   = useState(null);
  const [chatHistory,   setChatHistory]   = useState([]);
  const [agentInput,    setAgentInput]    = useState("");
  const [agentLoading,  setAgentLoading]  = useState(false);

  // ── CSV Upload / Dataset layer ────────────────────────────────────────────
  // currentCollection = null means default BMW dataset; string = custom upload
  // datasetStats      = { rows, columns: string[], filename }
  // isUploading       = vectorisation in progress
  // uploadStatus      = "idle" | "uploading" | "success" | "error"
  const [currentCollection, setCurrentCollection] = useState(null);
  const [datasetStats,      setDatasetStats]      = useState(null);
  const [uploadStatus,      setUploadStatus]      = useState("idle"); // replaces boolean
  const [uploadError,       setUploadError]       = useState(null);
  const [dragOver,          setDragOver]          = useState(false);
  const fileInputRef = useRef(null);

  // ── UI-only ───────────────────────────────────────────────────────────────
  const [pdfState,   setPdfState]   = useState("idle");
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const chartRef = useRef(null);

  // ── CSV Upload handler ────────────────────────────────────────────────────
  const handleUploadCSV = useCallback(async (file) => {
    if (!file || !file.name.endsWith(".csv")) return;
    setUploadStatus("uploading");
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await axios.post("http://localhost:8000/api/upload-csv", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentCollection(data.collection_name);
      setDatasetStats({
        rows:     data.rows     ?? data.total_rows    ?? "—",
        columns:  data.columns  ?? data.column_names  ?? [],
        filename: file.name,
      });
      setUploadStatus("success");
      // Fresh context — clear chat and any active topic
      setChatHistory([]);
      setActiveTopic(null);
      setResult(null);
      setInsightSummary(null);
      setQuery("");
      // Reset success indicator after 3 s
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Upload failed.";
      setUploadError(msg);
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 4000);
    }
  }, []);

  const handleFileInput = e => {
    const file = e.target.files?.[0];
    if (file) handleUploadCSV(file);
    e.target.value = ""; // allow re-upload of same file
  };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadCSV(file);
  };

  const handleClearDataset = () => {
    setCurrentCollection(null); setDatasetStats(null);
    setUploadStatus("idle"); setUploadError(null);
    setChatHistory([]); setActiveTopic(null);
    setResult(null); setInsightSummary(null); setQuery("");
  };

  // ── TOP-BAR handler — "New Topic"
  //    Sets a fresh context: new chart, thread reset, activeTopic updated
  const handleGenerate = useCallback(async (q) => {
    const text = (q || query).trim();
    if (!text) return;
    setLoading(true); setError(null); setIs502(false); setInsightSummary(null);
    // New topic → clear the conversation thread
    setChatHistory([]);
    setActiveTopic(text);
    try {
      const { data } = await axios.post("http://localhost:8000/api/generate-chart", {
        query: text,
        ...(currentCollection ? { collection_name: currentCollection } : {}),
      });
      setResult(data);
      setInsightSummary(data.insight_summary || null);
      setError(null);
      setChartKey(k => k + 1);
      // Seed the thread with the initial AI insight for this topic
      if (data.insight_summary) {
        setChatHistory([{ role:"agent", text: data.insight_summary }]);
      }
    } catch (err) {
      let msg = "Unexpected error — showing demo data.";
      let detected502 = false;
      if (err.response) {
        const { status, statusText, data: body } = err.response;
        if (status === 502) { detected502 = true; msg = "502 Bad Gateway"; }
        else {
          const detail = body?.detail || body?.message || body?.error || (typeof body==="string"?body:null);
          msg = `${status} ${statusText||"Error"}${detail?`: ${detail}`:""}`;
        }
      } else if (err.request) {
        msg = "No response from server (connection refused or network error).";
      }
      setIs502(detected502); setError(msg);
      setResult(MOCK_RESULT);
      setInsightSummary(MOCK_RESULT.insight_summary);
      setChartKey(k => k + 1);
      setChatHistory([{ role:"agent", text: MOCK_RESULT.insight_summary }]);
    } finally { setLoading(false); }
  }, [query, currentCollection]);

  // ── AGENT COMPOSER handler — "Follow-up"
  //    Always sends { query: agentInput, previous_query: activeTopic }
  //    so the agent is anchored to the current top-bar topic
  const handleAgentSend = useCallback(async () => {
    const text = agentInput.trim();
    if (!text || agentLoading) return;
    setAgentInput("");
    setAgentLoading(true);
    // Optimistically append user bubble
    setChatHistory(prev => [...prev, { role:"user", text }]);
    try {
      const { data } = await axios.post("http://localhost:8000/api/generate-chart", {
        query: text,
        previous_query: activeTopic,
        ...(currentCollection ? { collection_name: currentCollection } : {}),
      });
      // Update chart with new result from follow-up
      setResult(data);
      setInsightSummary(data.insight_summary || null);
      setChartKey(k => k + 1);
      setChatHistory(prev => [...prev, {
        role: "agent",
        text: data.insight_summary || "Analysis updated — no summary returned.",
      }]);
    } catch {
      // On error keep showing current chart, append fallback agent bubble
      setChatHistory(prev => [...prev, {
        role: "agent",
        text: MOCK_RESULT.insight_summary,
      }]);
    } finally { setAgentLoading(false); }
  }, [agentInput, activeTopic, agentLoading, currentCollection]);

  const handleKey = e => { if (e.key==="Enter") handleGenerate(); };

  // ── PDF Export — PRESERVED EXACTLY ────────────────────────────────────────
  const handlePDF = async () => {
    if (!result?.chart_data || !chartRef.current || pdfState!=="idle") return;
    setPdfState("busy");
    try {
      await generatePDF({ chartRef, chartData:result.chart_data, chartTitle:result.title, userQuery:query||"No query provided" });
      setPdfState("done");
      setTimeout(()=>setPdfState("idle"), 3500);
    } catch (e) { console.error("PDF generation failed:", e); setPdfState("idle"); }
  };

  // ── Live timestamp ─────────────────────────────────────────────────────────
  const now = new Date();
  const ts  = now.toISOString().replace("T"," ").slice(0,19) + " UTC";

  /* ─── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, ...sans, position:"relative" }}>
      <style>{GCSS}</style>

      {/* Ambient radial glows */}
      <div className="ambient" style={{
        top:-300, left:-200, width:800, height:800,
        background:"radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 65%)",
      }}/>
      <div className="ambient" style={{
        bottom:-400, right:-200, width:900, height:900,
        background:"radial-gradient(circle, rgba(148,163,184,0.04) 0%, transparent 65%)",
      }}/>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header style={{
        position:"sticky", top:0, zIndex:500,
        background:"rgba(15,23,42,0.80)",
        backdropFilter:"blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(71,85,105,0.35)",
      }}>
        <div style={{ width:"100%", padding:"0 36px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:"rgba(148,163,184,0.10)",
              border:"1.5px solid rgba(148,163,184,0.20)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2.5 }}>
                {["#94a3b8","transparent","transparent","#94a3b8"].map((c,i)=>(
                  <div key={i} style={{ width:7, height:7, background:c, borderRadius:2, opacity:c==="transparent"?0:0.8 }}/>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color:"#f1f5f9", fontWeight:700, fontSize:15.5, letterSpacing:"-.02em", lineHeight:1.1 }}>
                Nexus BI
              </div>
              <div style={{ color:T.t3, ...mono, fontSize:9, letterSpacing:".10em" }}>ENTERPRISE TERMINAL</div>
            </div>
          </div>

          {/* Nav pills */}
          <nav className="nav-tabs" style={{
            display:"flex", gap:3, padding:"4px 6px",
            background:"rgba(0,0,0,0.25)", border:"1px solid rgba(71,85,105,0.40)", borderRadius:999,
          }}>
            {TABS.map(tab => (
              <button key={tab} className={`tab${activeTab===tab?" on":""}`} onClick={()=>setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </nav>

          {/* Right side: CSV dropzone + live indicator + dataset badge */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>

            {/* Dataset active badge — click to clear */}
            {currentCollection && uploadStatus !== "uploading" && (
              <button className="dataset-badge" onClick={handleClearDataset} title="Click to clear custom dataset">
                <Database size={9}/>
                <span>{datasetStats?.filename ?? currentCollection}</span>
                <X size={9}/>
              </button>
            )}

            {/* CSV dropzone */}
            <div
              className={`dropzone${uploadStatus==="uploading"?" uploading":uploadStatus==="success"?" success":dragOver?" drag-over":""}`}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              style={{ height:36 }}
            >
              <input
                ref={fileInputRef}
                type="file" accept=".csv"
                onChange={handleFileInput}
                style={{ pointerEvents: uploadStatus==="uploading" ? "none" : "auto" }}
              />
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 size={13} color="#38bdf8" style={{ animation:"uploadSpin .8s linear infinite", flexShrink:0 }}/>
                  <span style={{ ...mono, fontSize:10.5, color:"#38bdf8", letterSpacing:".06em", whiteSpace:"nowrap" }}>
                    Vectorizing…
                  </span>
                </>
              ) : uploadStatus === "success" ? (
                <>
                  <CheckCircle2 size={13} color="#4ade80" style={{ flexShrink:0, animation:"successPop .4s cubic-bezier(.16,1,.3,1) both" }}/>
                  <span style={{ ...mono, fontSize:10.5, color:"#4ade80", letterSpacing:".05em", whiteSpace:"nowrap" }}>
                    Dataset Ready
                  </span>
                </>
              ) : uploadStatus === "error" ? (
                <>
                  <AlertCircle size={13} color="#f87171" style={{ flexShrink:0 }}/>
                  <span style={{ ...mono, fontSize:10.5, color:"#f87171", letterSpacing:".05em", whiteSpace:"nowrap" }}>
                    Upload Failed
                  </span>
                </>
              ) : (
                <>
                  <Upload size={13} color="#64748b" style={{ flexShrink:0 }}/>
                  <span style={{ ...mono, fontSize:10.5, color:"#64748b", letterSpacing:".05em", whiteSpace:"nowrap" }}>
                    Upload CSV
                  </span>
                </>
              )}
            </div>

            {/* Live indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", animation:"livePulse 2.6s ease-in-out infinite" }}/>
              <span style={{ ...mono, fontSize:10, color:T.t3, letterSpacing:".08em" }}>LIVE</span>
            </div>
            <span style={{ ...mono, fontSize:10, color:T.t3, letterSpacing:".03em" }}>{ts}</span>
            <button className="ghost mob-btn" style={{ display:"none" }} onClick={()=>setMobileOpen(v=>!v)}>
              <ChevronDown size={12} style={{ transform:mobileOpen?"rotate(180deg)":"none", transition:"transform 200ms" }}/>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`nav-tabs${mobileOpen?" mobile-open":""}`} style={{ display:"none" }}>
          {TABS.map(tab => (
            <button key={tab} className={`tab${activeTab===tab?" on":""}`}
              onClick={()=>{setActiveTab(tab);setMobileOpen(false);}}
              style={{ width:"100%", justifyContent:"flex-start" }}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* ══ MAIN ════════════════════════════════════════════════════════════════ */}
      <main style={{ width:"100%", padding:"44px 44px 100px", position:"relative", zIndex:1 }}>

        {/* ── ANALYTICS TAB ──────────────────────────────────────────────────── */}
        {activeTab==="Analytics" && (
          <>
            {/* Hero heading */}
            <div className="a-enter" style={{ marginBottom:38 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ height:1, width:24, background:"#94a3b8", opacity:.4 }}/>
                <span style={{ ...mono, fontSize:10.5, color:T.t3, letterSpacing:".15em", textTransform:"uppercase" }}>
                  Analytics
                </span>
                {currentCollection && (
                  <span style={{
                    ...mono, fontSize:9, color:"#4ade80", letterSpacing:".10em",
                    background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.22)",
                    borderRadius:999, padding:"2px 9px", textTransform:"uppercase",
                  }}>
                    Custom Dataset
                  </span>
                )}
              </div>
              <h1 style={{ fontSize:40, fontWeight:800, color:"#ffffff", letterSpacing:"-.05em", lineHeight:1.1, marginBottom:12, ...sans }}>
                Intelligence<br/>
                <span style={{ color:"#94a3b8" }}>Terminal.</span>
              </h1>
              <p style={{ color:T.t2, fontSize:15, maxWidth:540, lineHeight:1.65 }}>
                {currentCollection && datasetStats
                  ? <>Custom dataset active · <span style={{color:T.t1}}>{datasetStats.filename}</span> · {typeof datasetStats.rows === "number" ? datasetStats.rows.toLocaleString() : datasetStats.rows} rows · {Array.isArray(datasetStats.columns) ? datasetStats.columns.length : "?"} columns detected</>
                  : "Natural language → visual analysis · Vector RAG · Live BMW data"
                }
              </p>

              {/* Dynamic KPI strip — shown only when custom dataset is active */}
              {currentCollection && datasetStats && (
                <div style={{ display:"flex", gap:12, marginTop:20, flexWrap:"wrap" }}>
                  {/* Card: Status */}
                  <div className="custom-kpi" style={{ flex:"0 0 auto" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Database size={11} color="#4ade80"/>
                      </div>
                      <span style={{ ...mono, fontSize:9, color:"#4ade80", letterSpacing:".10em", textTransform:"uppercase" }}>Custom Dataset</span>
                    </div>
                    <p style={{ ...sans, fontSize:13, color:T.t0, fontWeight:600, letterSpacing:"-.01em" }}>Active</p>
                    <p style={{ ...mono, fontSize:10, color:T.t3, marginTop:3, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{datasetStats.filename}</p>
                  </div>
                  {/* Card: Rows */}
                  <div className="custom-kpi" style={{ flex:"0 0 auto" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:"rgba(56,189,248,0.10)", border:"1px solid rgba(56,189,248,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Layers size={11} color="#38bdf8"/>
                      </div>
                      <span style={{ ...mono, fontSize:9, color:"#38bdf8", letterSpacing:".10em", textTransform:"uppercase" }}>Total Rows</span>
                    </div>
                    <p style={{ ...mono, fontSize:22, color:T.t0, fontWeight:700, letterSpacing:"-.02em" }}>
                      {typeof datasetStats.rows === "number" ? datasetStats.rows.toLocaleString() : datasetStats.rows}
                    </p>
                  </div>
                  {/* Card: Columns */}
                  <div className="custom-kpi" style={{ flex:"1 1 220px", minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:"rgba(251,191,36,0.10)", border:"1px solid rgba(251,191,36,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Table2 size={11} color="#fbbf24"/>
                      </div>
                      <span style={{ ...mono, fontSize:9, color:"#fbbf24", letterSpacing:".10em", textTransform:"uppercase" }}>
                        {Array.isArray(datasetStats.columns) ? datasetStats.columns.length : "?"} Columns Detected
                      </span>
                    </div>
                    <p style={{ ...mono, fontSize:11, color:T.t2, lineHeight:1.7, wordBreak:"break-all" }}>
                      {Array.isArray(datasetStats.columns) ? datasetStats.columns.join("  ·  ") : String(datasetStats.columns)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── QUERY INPUT — "New Topic" bar ───────────────────────────────── */}
            <section className="a-enter" style={{ marginBottom:32 }}>

              {/* Active topic badge — shown when a topic is set */}
              {activeTopic && (
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10, flexWrap:"wrap" }}>
                  <div className="topic-badge">
                    <span className="tb-label">Active topic</span>
                    <span className="tb-value">"{activeTopic}"</span>
                  </div>
                  <button
                    className="new-topic-btn"
                    onClick={() => {
                      setQuery(""); setResult(null); setInsightSummary(null);
                      setError(null); setIs502(false);
                      setActiveTopic(null); setChatHistory([]);
                    }}
                  >
                    <Zap size={10}/> New Topic
                  </button>
                </div>
              )}

              <div className="cmd">
                <div style={{ padding:"0 18px", flexShrink:0, borderRight:"1px solid rgba(71,85,105,0.40)", display:"flex", alignItems:"center" }}>
                  <Search size={16} color="#64748b" style={{ opacity:.8 }}/>
                </div>
                <input
                  className="cmd-field"
                  type="text"
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={activeTopic
                    ? "Start a new topic — this will reset the conversation…"
                    : "Ask anything — avg price by year, sales by series, fuel breakdown…"
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="exec" onClick={()=>handleGenerate()} disabled={loading || !query.trim()}>
                  {loading
                    ? <><Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> Processing</>
                    : <><Sparkles size={13}/> {activeTopic ? "New Topic" : "Run Query"}</>
                  }
                </button>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:13, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ ...mono, fontSize:10, color:T.t3, letterSpacing:".10em", marginRight:4 }}>Try →</span>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="chip" onClick={()=>{setQuery(s);handleGenerate(s);}}>
                    <ArrowRight size={9} color="#64748b"/> {s}
                  </button>
                ))}
              </div>
            </section>

            <ErrBanner error={error} is502={is502}/>

            {/* ── BENTO BOX GRID ──────────────────────────────────────────────── */}
            <section className="a-enter-1">

              {/* EMPTY STATE — spans full grid, shown before any query */}
              {!result && !loading && (
                <div className="glass-card" style={{
                  padding:"64px 48px", textAlign:"center",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:18,
                }}>
                  <div style={{
                    width:64, height:64, borderRadius:20,
                    background:"rgba(148,163,184,0.08)",
                    border:"1.5px solid rgba(71,85,105,0.50)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    animation:"floatUp 3s ease-in-out infinite",
                  }}>
                    <BarChart2 size={28} color="#475569"/>
                  </div>
                  <div>
                    <p style={{...sans,fontSize:16,fontWeight:600,color:T.t0,marginBottom:8}}>No analysis yet</p>
                    <p style={{fontSize:14,color:T.t3,maxWidth:400}}>Enter a natural language query above and press Run Query to generate your bento analysis</p>
                  </div>
                </div>
              )}

              {/* LOADING SKELETON BENTO */}
              {loading && (
                <div className="bento-grid">
                  {/* Chart skeleton */}
                  <div className="glass-card bento-chart" style={{ padding:"24px", minHeight:460 }}>
                    <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                      <div className="insight-shimmer" style={{ height:22, width:60, borderRadius:999 }}/>
                      <div className="insight-shimmer" style={{ height:22, width:180 }}/>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:360, gap:16, flexDirection:"column" }}>
                      <Loader2 size={32} color="#475569" style={{animation:"spin .8s linear infinite"}}/>
                      <span style={{...mono, fontSize:12, color:"#334155", letterSpacing:".08em"}}>Processing query…</span>
                    </div>
                  </div>
                  {/* Agent Space — live during loading, shows history + typing indicator */}
                  <AgentSpace
                    chatHistory={chatHistory}
                    agentInput={agentInput}
                    setAgentInput={setAgentInput}
                    onSend={handleAgentSend}
                    agentLoading={true}
                  />
                </div>
              )}

              {/* POPULATED BENTO */}
              {result && !loading && (
                <div className="bento-grid">

                  {/* ── LEFT: CHART CARD ─── lg:col-span-2 ───────────────────── */}
                  {/* overflow:visible required for scale(1.15) not to self-clip */}
                  <div className="glass-card hover-card bento-chart" style={{ overflow:"visible" }}>
                    {/* Chart header */}
                    <div style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      flexWrap:"wrap", gap:12, padding:"20px 24px",
                      borderBottom:"1px solid rgba(71,85,105,0.30)",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
                        <TypeTag type={result.chart_type}/>
                        <span style={{
                          color:T.t0, fontWeight:700, fontSize:15, letterSpacing:"-.01em",
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", ...sans,
                        }}>
                          {result.title}
                        </span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                        <div style={{ display:"flex", gap:5 }}>
                          {["bar","line","area"].map(t=>(
                            <div key={t} style={{
                              width:7, height:7, borderRadius:"50%",
                              background:result.chart_type===t?"#94a3b8":"rgba(71,85,105,0.50)",
                              transition:"background 300ms",
                            }}/>
                          ))}
                        </div>
                        <button
                          className={`pdfbtn${pdfState==="busy"?" busy":pdfState==="done"?" done":""}`}
                          onClick={handlePDF} disabled={pdfState==="busy"}
                        >
                          {pdfState==="busy" && <Loader2 size={11} style={{animation:"spin .7s linear infinite"}}/>}
                          {pdfState==="done" && <CheckCircle2 size={11}/>}
                          {pdfState==="idle" && <FileDown size={11}/>}
                          {pdfState==="busy"?"Compiling…":pdfState==="done"?"Saved":"Export PDF"}
                        </button>
                      </div>
                    </div>

                    {/* Chart area */}
                    <div ref={chartRef} style={{ height:460, padding:"28px 10px 8px", position:"relative" }}>
                      <ChartRenderer
                        chartType={result.chart_type}
                        chartData={result.chart_data}
                        xAxisKey={result.x_axis_key}
                        yAxisKey={result.y_axis_key}
                        animKey={chartKey}
                      />
                    </div>
                  </div>

                  {/* ── RIGHT: AGENT SPACE — topic-anchored conversation ──────── */}
                  <AgentSpace
                    chatHistory={chatHistory}
                    agentInput={agentInput}
                    setAgentInput={setAgentInput}
                    onSend={handleAgentSend}
                    agentLoading={agentLoading}
                  />

                  {/* ── BOTTOM: DATA TABLE — col-span-full ─────────────────── */}
                  {/* overflow:visible required for scale(1.15) not to self-clip */}
                  <div className="glass-card hover-card bento-full" style={{ overflow:"visible" }}>
                    {/* Table header */}
                    <div style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      flexWrap:"wrap", gap:10, padding:"18px 24px",
                      borderBottom:"1px solid rgba(71,85,105,0.30)",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{padding:7, background:"rgba(148,163,184,0.08)", borderRadius:8}}>
                          <Layers size={13} color="#64748b"/>
                        </div>
                        <span style={{...sans,fontSize:14,color:T.t0,fontWeight:600}}>Raw Data Records</span>
                        <span style={{
                          ...mono, fontSize:11, color:"#94a3b8",
                          background:"rgba(148,163,184,0.08)",
                          border:"1.5px solid rgba(71,85,105,0.40)",
                          borderRadius:999, padding:"3px 11px",
                        }}>
                          {result.chart_data.length} rows
                        </span>
                      </div>
                      <button className="pdfbtn" onClick={handlePDF} disabled={pdfState!=="idle"}>
                        <FileDown size={11}/> Export PDF Briefing
                      </button>
                    </div>

                    <DataTable data={result.chart_data} xKey={result.x_axis_key} yKey={result.y_axis_key}/>
                  </div>

                  {/* ── RAW JSON — col-span-full ────────────────────────────── */}
                  <div className="bento-full">
                    <details>
                      <summary style={{
                        ...mono, fontSize:11, color:T.t3, cursor:"pointer",
                        userSelect:"none", letterSpacing:".05em", padding:"6px 0",
                        listStyle:"none", display:"flex", alignItems:"center", gap:8,
                      }}>
                        <span style={{ fontSize:9 }}>▶</span> Raw JSON Payload
                      </summary>
                      <pre style={{
                        marginTop:10,
                        background:"rgba(10,17,32,0.80)", backdropFilter:"blur(12px)",
                        border:"1px solid rgba(71,85,105,0.35)",
                        borderRadius:16, padding:24, color:"#4ade80", fontSize:12, ...mono,
                        overflowX:"auto", lineHeight:1.75,
                      }}>
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>

                </div>
              )}
            </section>
          </>
        )}

        {activeTab==="Inventory"      && <InventoryTab/>}
        {activeTab==="Fleet Overview" && !currentCollection && <FleetOverview/>}
        {activeTab==="Fleet Overview" &&  currentCollection && (
          <div className="a-enter glass-card" style={{ padding:"48px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"rgba(74,222,128,0.08)", border:"1.5px solid rgba(74,222,128,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Database size={22} color="#4ade80"/>
            </div>
            <div>
              <p style={{...sans, fontSize:15, fontWeight:600, color:T.t0, marginBottom:6}}>Custom Dataset Active</p>
              <p style={{fontSize:13, color:T.t3, maxWidth:380, lineHeight:1.65}}>
                Fleet Overview is BMW-specific. Switch to the <strong style={{color:T.t1}}>Analytics</strong> tab to query your custom dataset — <span style={{color:"#4ade80",...mono, fontSize:12}}>{datasetStats?.filename}</span>.
              </p>
            </div>
            <button className="ghost" onClick={()=>setActiveTab("Analytics")} style={{ marginTop:4 }}>
              <ArrowRight size={12}/> Go to Analytics
            </button>
          </div>
        )}

      </main>

      {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, height:30,
        background:"rgba(10,17,32,0.92)", backdropFilter:"blur(16px)",
        borderTop:"1px solid rgba(71,85,105,0.25)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 36px", zIndex:400,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          <span style={{...mono,fontSize:9.5,color:T.t3,letterSpacing:".08em"}}>BMW AI INSIGHT ENGINE</span>
          <span style={{color:"rgba(71,85,105,0.5)"}}>·</span>
          <span style={{...mono,fontSize:9.5,color:T.t3,letterSpacing:".06em"}}>ENTERPRISE INTELLIGENCE TERMINAL</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          {currentCollection && (
            <span style={{...mono,fontSize:9.5,color:"#4ade80",letterSpacing:".04em"}}>
              ⬡ {datasetStats?.filename ?? currentCollection}
            </span>
          )}
          {result && (
            <span style={{...mono,fontSize:9.5,color:"#64748b",letterSpacing:".04em"}}>
              ✓ {result.chart_data.length} data points
            </span>
          )}
          {insightSummary && (
            <span style={{...mono,fontSize:9.5,color:"#38bdf8",letterSpacing:".04em"}}>
              ✦ insight ready
            </span>
          )}
          <span style={{...mono,fontSize:9.5,color:T.t3,letterSpacing:".06em"}}>
            {activeTab.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}