<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PCMA Mobile V3.1</title>

<link rel="icon" type="image/png" sizes="32x32" href="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png">
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#2563eb" />

<style>
  body{font-family:"Segoe UI",Arial,sans-serif;margin:0;background:#f4f6f8;color:#111;}

  header{
    background:linear-gradient(135deg,#2563eb,#1e40af);
    color:white;padding:12px 16px;border-bottom:3px solid #1e3a8a;
    position:sticky;top:0;z-index:20;
  }
  .header-container{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:1100px;margin:0 auto;}
  .brand{display:flex;align-items:center;gap:12px;}
  .header-logo{height:70px;width:auto;border-radius:10px;box-shadow:0 3px 6px rgba(0,0,0,0.25);} 
  .header-title{margin:0;font-size:1.8rem;font-weight:700;letter-spacing:.5px;}
  .filter-toggle-btn{
    background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.6);color:#fff;
    font-weight:800;padding:8px 12px;border-radius:10px;cursor:pointer;transition:background .15s ease,transform .05s ease;
  }
  .filter-toggle-btn:hover{background:rgba(255,255,255,.28);} 
  .filter-toggle-btn:active{transform:scale(.98);} 

  /* Filters (fade/collapse) */
  #filters{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:12px;margin:12px auto;padding:14px;background:#fff;border-radius:12px;
    box-shadow:0 2px 6px rgba(0,0,0,0.06);border:1px solid #e5e7eb;max-width:1100px;overflow:hidden;
    transition:opacity .25s ease, max-height .25s ease, margin .25s ease, padding .25s ease, border-width .25s ease;
    opacity:1;max-height:1000px;
  }
  #filters.filters-hidden{opacity:0;max-height:0;margin:0 auto;padding:0 14px;border-width:0;pointer-events:none;}

  /* Labels & fields */
  #filters label{display:flex;flex-direction:column;gap:6px;font-size:.9rem;color:#0f172a;font-weight:700;}
  #filters input,#filters select{
    font-size:1rem;padding:10px 12px;border-radius:10px;border:2px solid #cbd5e1;background:#f8fafc;
    outline:none;transition:border-color .15s ease,box-shadow .15s ease;
  }
  #filters input:focus,#filters select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15);} 
  #applyFilter{
    background:#2563eb;color:#fff;padding:14px 20px;font-size:1rem;border-radius:10px;width:100%;
    align-self:end;border:none;cursor:pointer;font-weight:800;letter-spacing:.2px;
  }
  #applyFilter:hover{background:#1e40af;} 
  #applyFilter.busy{opacity:.7;cursor:wait;}
  #clearFilter{background:#e5e7eb;color:#111;padding:14px 20px;font-size:1rem;border:none;border-radius:10px;font-weight:800;}
  #clearFilter:hover{background:#d1d5db;}

  /* Input with icon */
  .input-icon-wrap{position:relative;display:block;}
  .input-icon-wrap input{padding-left:12px;padding-right:42px;width:100%;}
  .input-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:20px;height:20px;opacity:.75;pointer-events:none;}

  /* Make filters mobile-friendly: ensure Apply button is visible */
  @media (max-width: 600px){
    #filters{max-height:70vh;overflow:auto;padding-bottom:72px;}
    #applyFilter{position:sticky;bottom:0;box-shadow:0 -2px 8px rgba(0,0,0,.08);} 
  }

  main{max-width:1100px;margin:10px auto;padding:5px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;}
  #resultInfo{max-width:1100px;margin:4px auto 10px auto;padding:0 6px;color:#334155;font-weight:800;}

  /* Cards */
  .card{background:#fff;border-radius:12px;box-shadow:0 3px 8px rgba(0,0,0,.1);cursor:pointer;transition:transform .15s,box-shadow .15s;overflow:hidden;display:flex;align-items:center;gap:12px;padding:10px;}
  .card:hover{transform:scale(1.01);box-shadow:0 6px 12px rgba(0,0,0,.15);} 
  .card-thumb{width:80px;height:80px;object-fit:cover;border-radius:10px;background:#eee;flex:0 0 auto;}
  .card-content{padding:4px 2px;flex:1;}
  .status{font-weight:700;margin-top:4px;padding:2px 10px;border-radius:999px;display:inline-block;color:#fff;}
  .contract-id{font-size:1.2rem;font-weight:900;color:#8b0000;letter-spacing:.2px;}
  .engineer-name{color:#2563eb;font-weight:700;}
  mark{background:#fef08a;padding:0 .15em;border-radius:.2em;}

  /* Modal */
  #modalBg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);justify-content:center;align-items:center;z-index:200;}
  #modalBg.show{display:flex;}
  #modalBox{background:#fff;border-radius:16px;padding:0;max-width:90%;max-height:90%;overflow-y:auto;display:flex;flex-direction:column;gap:0;} /* keep original for context; will be overridden below */

  /* Sticky orange modal header with only value + Close */
  .modal-top{
    position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:8px;
    background:#f97316;color:#fff;padding:10px 14px;border-bottom:1px solid rgba(0,0,0,.08);box-shadow:0 2px 4px rgba(0,0,0,.08);
  }
  .modal-top-left{display:flex;align-items:center;gap:10px;}
  .modal-top-logo{width:28px;height:28px;border-radius:6px;object-fit:cover;}
  .modal-top-cid{font-weight:900;color:#fff;}
  .modal-close-btn{background:#fff;border:none;color:#f97316;font-weight:900;padding:6px 12px;border-radius:8px;cursor:pointer;line-height:1;}
  .modal-close-btn:hover{background:#ffe8d7;}

  /* Modal body */
  #modalContent{display:flex;flex-direction:column;gap:6px;padding:14px;}
  #modalButtons{padding:0 14px 14px;}
  #modalImages{padding:0 14px 12px 14px;}
  .detail-row{display:flex;justify-content:space-between;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #eee;}
  .detail-label{font-size:.85rem;color:#475569;font-weight:700;}
  .detail-value{font-weight:800;color:#111;margin-left:8px;padding:2px 10px;border-radius:999px;background:#f3f4f6;}
  .detail-value.status-badge{color:#fff;background:#2563eb;}

  /* Role chips */
  .detail-value.project-engineer{background:#bfdbfe;color:#1e3a8a;}
  .detail-value.project-inspector{background:#c7d2fe;color:#3730a3;}
  .detail-value.resident-engineer{background:#bbf7d0;color:#166534;}
  .detail-value.quantity-engineer{background:#fbcfe8;color:#831843;}
  .detail-value.materials-engineer{background:#fed7aa;color:#78350f;}

  /* Time Lapsed bar */
  .progress-wrap{margin-top:12px;}
  .progress-label{font-weight:800;color:#0f172a;margin-bottom:6px;font-size:1.05rem;text-align:center;}
  .progress-bar{width:100%;background:#e5e7eb;border-radius:12px;height:28px;overflow:hidden;position:relative;}
  .progress-fill{height:100%;border-radius:12px;text-align:center;line-height:28px;font-weight:800;color:#fff;font-size:1rem;width:0%;transition:width 900ms ease-out;white-space:nowrap;padding:0 8px;}

  /* Mini bars */
  .mini-bars{display:flex;flex-direction:column;gap:6px;margin-top:10px;}
  .mini-row{display:flex;align-items:center;gap:10px;}
  .mini-label{width:82px;text-align:left;font-weight:900;color:#0f172a;letter-spacing:.2px;}
  .mini-bar{flex:1;height:18px;background:#e5e7eb;border-radius:999px;overflow:hidden;}
  .mini-fill{height:100%;width:0%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:800;color:#fff;transition:width 650ms ease-out;white-space:nowrap;padding:0 6px;}

  /* Modal action buttons */
  #modalButtons button{width:100%;padding:14px;margin:4px 0;border-radius:8px;font-size:1rem;border:none;cursor:pointer;font-weight:700;}
  #uploadBtn{background:#007bff;color:#fff;} 
  #uploadBtn:hover{background:#0069d9;}
  #googleDriveBtn{background:#16a34a;color:#fff;} 
  #googleDriveBtn:hover{background:#15803d;}

  /* Centered loading overlay (transparent + glowing star explosion) */
  .center-overlay{position:fixed;inset:0;background:rgba(15,23,42,.10);display:none;align-items:center;justify-content:center;z-index:150;}
  .center-overlay.show{display:flex;}
  .center-box{position:relative;width:160px;height:160px;background:transparent;border-radius:16px;display:flex;align-items:center;justify-content:center;padding:18px;}
  .progress-svg{width:120px;height:120px;transform:rotate(-90deg);} 
  .progress-bg{stroke:#e5e7eb;stroke-width:10;fill:none;}
  .progress-circle{stroke:#2563eb;stroke-width:10;fill:none;stroke-linecap:round;transition:stroke-dashoffset .06s linear;}
  .center-label{position:absolute;font-weight:900;color:#0f172a;font-size:1.2rem;}

  .particle-star{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(0deg) scale(1);opacity:1;pointer-events:none;animation:star-pop 900ms ease-out forwards;filter: drop-shadow(0 0 6px var(--glow)) drop-shadow(0 0 14px var(--glow));}
  @keyframes star-pop{to{transform:translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot,720deg)) scale(.85);opacity:0;}}

  .hidden{display:none!important;}

  @media(max-width:600px){.header-title{font-size:1.4rem}.header-logo{height:60px}}

  /* Keep search icon on the right and inputs aligned */
  #filters .input-icon-wrap input{padding-left:12px;padding-right:42px;}
  #filters .input-icon{left:auto;right:12px;}
  /* Make the combo filter visually shorter to align with others */
  #filters .filter-combo{justify-self:start;}
  #filters .filter-combo .input-icon-wrap{max-width:380px;width:100%;}

  /* Bigger, responsive modal that fits phones & tablets */
  #modalBox{width:min(980px,96svw);max-height:calc(100svh - 24px);overflow:auto;} /* fit within viewport on desktop */
  #modalImages img.modal-img{width:100%;height:auto;max-height:70svh;object-fit:contain;}

  /* Stack detail rows on very small screens */
  @media (max-width: 480px){
    .detail-row{flex-direction:column;align-items:flex-start;gap:4px;}
  }

  @media (max-width: 768px){
    #modalBox{width:100svw;height:100svh;max-height:100svh;border-radius:0;} /* fullscreen on mobile/tablet */
    #modalContent,#modalButtons,#modalImages{padding:12px;}
    .modal-top{padding-top:calc(env(safe-area-inset-top,0) + 10px);} 
    #modalImages img.modal-img{max-height:64svh;}
  }

  /* Prevent background scroll when modal is open */
  body.no-scroll{overflow:hidden;touch-action:none;}

  /* --- Modal should always fit within the screen --- */
  #modalBox{width:min(980px,100vw);height:min(92svh,92vh);overflow:hidden;display:flex;flex-direction:column;}
  #modalBody{flex:1 1 auto;overflow:auto;}
  @media (max-width:768px){
    #modalBox{width:100vw;height:100svh;border-radius:0;} /* true fullscreen on phones/tablets */
  }
  /* --- Ensure modal fills the screen with no side gaps --- */
  /* Remove legacy 90% caps that caused gutters */
  #modalBox{max-width:none !important;max-height:none !important;box-sizing:border-box;}

  /* Images in modal should never overflow */
  #modalImages img.modal-img{display:block;width:100%;max-width:100%;height:auto;}

  /* On phones/tablets: stretch the overlay and modal to the full viewport */
  @media (max-width:768px){
    #modalBg{align-items:stretch;justify-content:stretch;}
    #modalBox{width:100svw !important;height:100svh !important;max-width:100svw !important;max-height:100svh !important;border-radius:0;margin:0;}
  }

  /* Two-column key stats grid under Contractor */
  .pair-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
  .pair-box{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;background:#e0f2fe;border:1px solid #bfdbfe;border-radius:10px;padding:10px;min-height:40px;}
.pair-label{display:block;font-size:.8rem;color:#475569;font-weight:700;margin-bottom:4px;}
.pair-value{display:block;font-weight:900;color:#0f172a;}
.pair-value.neg{color:#dc2626;}
  .pair-label{font-size:.8rem;color:#475569;font-weight:700;}
  .pair-value{font-weight:900;color:#0f172a;}
  .pair-value.neg{color:#dc2626;}
  .pair-box.span-2{grid-column:1/-1;}

  /* Centered detail rows for specific fields */
  .center-row{justify-content:center !important;flex-direction:column !important;align-items:center !important;text-align:center;}
  .center-row .detail-label{width:100%;text-align:center;}
  .center-row .detail-value{margin-left:0;}

  /* Compact role rows (PE/PI/RE/QE/ME) */
  .detail-row.compact{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;padding:4px 6px;}
  .detail-row.compact .detail-label{min-width:48px;text-align:center;background:#e2e8f0;border-radius:999px;padding:2px 8px;margin-right:8px;font-weight:900;}
  .detail-row.compact .detail-value{background:transparent;padding:0;}

  /* Compact role rows (PE/PI/RE/QE/ME) – override */
  .detail-row.compact{display:flex;flex-direction:row;align-items:center;gap:8px;padding:4px 6px;}
  .detail-row.compact .detail-label{min-width:36px;text-align:center;background:#e2e8f0;border-radius:999px;padding:2px 8px;margin-right:0;font-weight:900;line-height:1.1;}
  .detail-row.compact .detail-value{background:transparent;padding:0;margin-left:0;font-weight:800;line-height:1.2;}

  /* === Tweaks requested === */
  /* 1) Shorter two-column boxes */
  .pair-box{padding:6px 8px;min-height:32px;}
  .pair-label{margin-bottom:2px;font-size:.78rem;}
  .pair-value{font-size:.95rem;line-height:1.2;}

  /* 2) PE/PI/RE/QE/ME: value beside label + highlighted pill */
  .detail-row.compact{display:flex;flex-direction:row;align-items:center;gap:8px;padding:4px 6px;}
  .detail-row.compact .detail-value{background:#f3f4f6;padding:2px 10px;border-radius:999px;margin-left:6px;font-weight:800;}

  /* Role-specific colorful pills for values */
  .role-pe .detail-value{background:#bfdbfe;color:#1e3a8a;}
  .role-pi .detail-value{background:#e9d5ff;color:#6b21a8;}
  .role-re .detail-value{background:#bbf7d0;color:#166534;}
  .role-qe .detail-value{background:#fed7aa;color:#78350f;}
  .role-me .detail-value{background:#fbcfe8;color:#831843;}

  /* ==== FORCE COMPACT ROLE ROW LAYOUT (PE/PI/RE/QE/ME) ==== */
  .detail-row.compact{display:flex;flex-direction:row;align-items:center;justify-content:flex-start !important;gap:6px;padding:3px 6px;flex-wrap:nowrap;}
  .detail-row.compact .detail-label{min-width:auto;text-align:center;background:#e2e8f0;border-radius:999px;padding:2px 8px;margin:0;font-weight:900;line-height:1.1;}
  .detail-row.compact .detail-value{display:inline-block;background:#f3f4f6;padding:2px 8px;border-radius:999px;margin:0;font-weight:800;line-height:1.2;}
  /* Colorful pills per role */
  .role-pe .detail-value{background:#bfdbfe !important;color:#1e3a8a;}
  .role-pi .detail-value{background:#e9d5ff !important;color:#6b21a8;}
  .role-re .detail-value{background:#bbf7d0 !important;color:#166534;}
  .role-qe .detail-value{background:#fed7aa !important;color:#78350f;}
  .role-me .detail-value{background:#fbcfe8 !important;color:#831843;}

  /* Light orange highlight for key rows */
  .detail-row.emph-orange{background:#ffedd5;border-radius:10px;padding:8px;border-bottom:none;}
  .detail-row.emph-orange .detail-label{color:#7c2d12;}
  .detail-row.emph-orange .detail-value{background:transparent;}

</style>
</head>

<body>
<header>
  <div class="header-container">
    <div class="brand">
      <img src="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png" alt="PCMA Logo" class="header-logo" decoding="async"/>
      <h2 class="header-title">PCMA Mobile V3.1</h2>
    </div>
    <button id="toggleFilters" class="filter-toggle-btn" title="Show/Hide Filters">Hide Filters</button>
  </div>
</header>

<main>
  <div id="filters">
    <!-- Combined search with icon -->
    <label class="filter-combo">CID / PROJECT / LOCATION
      <span class="input-icon-wrap">
        <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <input type="text" id="filterCombo" placeholder="Type any: CID / project / location" />
      </span>
    </label>

    <label>YEAR <select id="filterYear"><option value="">All</option></select></label>
    <label>STATUS <select id="filterStatus"><option value="">All</option></select></label>
    <label>CONTRACTOR <select id="filterContractor"><option value="">All</option></select></label>
    <label>PROJECT ENGINEER <select id="filterEngineer"><option value="">All</option></select></label>
    <button id="applyFilter">Apply Filter</button>
    <button id="clearFilter" type="button" title="Reset filters">Clear</button>
  </div>

  <div id="resultInfo" class="hidden"></div>
  <div id="grid" class="grid hidden"></div>
  <div id="loader" class="hidden"></div>
</main>

<!-- Modal -->
<div id="modalBg" role="dialog" aria-modal="true" aria-labelledby="modalCID">
  <div id="modalBox">
    <div class="modal-top">
      <div class="modal-top-left">
        <img class="modal-top-logo" src="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png" alt="PCMA" />
        <div id="modalCID" class="modal-top-cid">—</div>
      </div>
      <button id="closeModalTop" class="modal-close-btn" aria-label="Close modal">Close</button>
    </div>
    <div id="modalBody">
    <div id="modalContent"></div>
    <div id="modalButtons"></div>
    <div id="modalImages"></div>
    </div>
  </div>
</div>

<!-- Centered loading overlay -->
<div id="centerOverlay" class="center-overlay" aria-live="polite">
  <div class="center-box">
    <svg class="progress-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="progress-bg" cx="60" cy="60" r="54"></circle>
      <circle id="progressCircle" class="progress-circle" cx="60" cy="60" r="54"></circle>
    </svg>
    <div id="centerLabel" class="center-label">0%</div>
  </div>
</div>

<script>
/* ===== CONFIG ===== */
const SHEET_ID="1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8"; // keep safe; public key exposes sheet to read
const RANGE="APP";
const API_KEY="AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8";
const LOGO_FALLBACK="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png";

/* ===== ELEMENTS ===== */
const grid=document.getElementById('grid');
const loader=document.getElementById('loader');
const resultInfo=document.getElementById('resultInfo');
const filtersBox=document.getElementById('filters');
const toggleFiltersBtn=document.getElementById('toggleFilters');

const filterCombo=document.getElementById('filterCombo');
const filterYear=document.getElementById('filterYear');
const filterStatus=document.getElementById('filterStatus');
const filterContractor=document.getElementById('filterContractor');
const filterEngineer=document.getElementById('filterEngineer');
const applyFilterBtn=document.getElementById('applyFilter');
const clearFilterBtn=document.getElementById('clearFilter');

const modalBg=document.getElementById('modalBg');
const modalContent=document.getElementById('modalContent');
const modalButtons=document.getElementById('modalButtons');
const modalImages=document.getElementById('modalImages');
const closeModalTop=document.getElementById('closeModalTop');
const modalCID=document.getElementById('modalCID');

/* Center progress overlay elements */
const centerOverlay=document.getElementById('centerOverlay');
const centerBox=document.querySelector('.center-box');
const progressCircle=document.getElementById('progressCircle');
const centerLabel=document.getElementById('centerLabel');

/* ===== STATE ===== */
let headers=[],records=[]; let lastRenderedRows=[];

/* ===== HELPERS ===== */
function toPct(val,fallback=0){
  if(val==null) return fallback;
  const m=String(val).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m?parseFloat(m[0]):fallback;
}
function animateMiniBar(fillEl,value,duration=800,formatFn=null){
  const sign=value<0?-1:1; const endAbs=Math.min(Math.abs(value),100);
  const startTime=performance.now();
  function step(now){
    const t=Math.min(1,(now-startTime)/duration);
    const cur=endAbs*t; fillEl.style.width=cur+'%';
    const display=sign*cur; fillEl.textContent=formatFn?formatFn(display):`${display.toFixed(2)}%`;
    if(t<1) requestAnimationFrame(step);
    else { fillEl.style.width=endAbs+'%'; fillEl.textContent=formatFn?formatFn(sign*endAbs):`${(sign*endAbs).toFixed(2)}%`; }
  }
  requestAnimationFrame(step);
}
function colorForSlippage(num){
  if(num>0) return {bg:'#10b981',text:'#fff',sad:false};
  if(num<=0 && num>-5) return {bg:'#fecaca',text:'#7f1d1d',sad:false};
  if(num<=-5 && num>-10) return {bg:'#f87171',text:'#fff',sad:false};
  if(num<=-10) return {bg:'#dc2626',text:'#fff',sad:true};
  return {bg:'#6b7280',text:'#fff',sad:false};
}

// tiny escape for highlighting
function esc(s){return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function highlight(text,query){
  const t=String(text||''); if(!query) return esc(t);
  const q=query.toLowerCase(); const i=t.toLowerCase().indexOf(q);
  if(i===-1) return esc(t);
  return esc(t.slice(0,i))+"<mark>"+esc(t.slice(i,i+q.length))+"</mark>"+esc(t.slice(i+q.length));
}

// Money & column helpers for the Contractor grid
function parseMoney(v){ if(v==null) return null; const s=String(v).replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:null; }
function fmtPHP(n){ try{ return '₱ ' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:2, maximumFractionDigits:2}); }catch{ return '₱ ' + n; } }
function findCol(){ const keys=[...arguments].map(k=>String(k).toLowerCase()); return headers.findIndex(h=> keys.some(k=> h.includes(k))); }

/* Glowing star explosion */
function explodeStars(n=28){
  const colors=['#ffd700','#f97316','#60a5fa','#22c55e','#ef4444','#a855f7'];
  for(let i=0;i<n;i++){
    const star=document.createElement('div');
    star.className='particle-star';
    star.textContent='★';
    const angle=(Math.PI*2)*(i/n)+(Math.random()*0.3-0.15);
    const radius=90+Math.random()*40;
    const dx=Math.cos(angle)*radius+'px';
    const dy=Math.sin(angle)*radius+'px';
    const rot=(360+Math.random()*540)+'deg';
    const col=colors[i%colors.length];
    star.style.setProperty('--dx',dx);star.style.setProperty('--dy',dy);star.style.setProperty('--rot',rot);star.style.setProperty('--glow',col);
    star.style.fontSize=(14+Math.random()*16)+'px';
    star.style.color=col;
    centerBox.appendChild(star);
    setTimeout(()=>star.remove(),950);
  }
}

/* 1s center progress with star burst at the end */
function startCenterProgress(duration=1000){
  return new Promise((resolve)=>{
    centerOverlay.classList.add('show');

    const r = parseFloat(progressCircle.getAttribute('r')) || 54;
    const C = 2 * Math.PI * r;
    progressCircle.style.strokeDasharray = C;
    progressCircle.style.strokeDashoffset = C;

    const start = performance.now();
    function tick(now){
      const t = Math.min(1, (now - start) / duration);
      const pct = Math.round(t * 100);
      centerLabel.textContent = pct + '%';
      progressCircle.style.strokeDashoffset = C * (1 - t);
      if(t < 1){
        requestAnimationFrame(tick);
      }else{
        // pop the stars then hide overlay after animation
        explodeStars();
        setTimeout(()=>{
          centerOverlay.classList.remove('show');
          progressCircle.style.strokeDashoffset = C;
          centerLabel.textContent = '0%';
          resolve();
        }, 900);
      }
    }
    requestAnimationFrame(tick);
  });
}

/* ===== DATA (Auto-detect header row) ===== */
async function loadData(){
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  try{
    const res=await fetch(url);
    const data=await res.json();
    if(!data.values || !data.values.length) throw new Error('No data returned');

    // Find the first row that looks like the header (contains key columns)
    const keyHints = ['contract id','project name','location','status'];
    let headerRowIndex = 0;
    for(let i=0;i<data.values.length;i++){
      const row = (data.values[i]||[]).map(c=>String(c||'').trim().toLowerCase());
      const hit = keyHints.some(h => row.some(cell => cell.includes(h)));
      if(hit){ headerRowIndex = i; break; }
    }

    headers = (data.values[headerRowIndex]||[]).map(h=>(h||'').trim().toLowerCase().replace(/[:]+/g,''));
    records = data.values.slice(headerRowIndex+1);

    populateFilterOptions();
    restoreFilterState(); // restore previous filter selections if any
  }catch(e){
    console.error(e);
    grid.classList.remove('hidden');
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#b91c1c;">
      Failed to load data. Please check API key / Sheet ID / Range.
    </div>`;
  }
}

/* ===== FILTERS ===== */
function populateFilterOptions(){
  const years=new Set(),contractors=new Set(),engineers=new Set(),statuses=new Set();
  const colYear=headers.findIndex(h=>h.includes('year'));
  const colContractor=headers.findIndex(h=>h.includes('contractor'));
  const colEngineer=headers.findIndex(h=>h.includes('project engineer'));
  const colStatus=headers.findIndex(h=>h.includes('status'));
  records.forEach(r=>{
    if(colYear>=0&&r[colYear])years.add(r[colYear]);
    if(colContractor>=0&&r[colContractor])contractors.add(r[colContractor]);
    if(colEngineer>=0&&r[colEngineer])engineers.add(r[colEngineer]);
    if(colStatus>=0&&r[colStatus])statuses.add(String(r[colStatus]).trim());
  });
  filterYear.innerHTML='<option value="">All</option>'+[...years].sort().map(y=>`<option value="${y}">${y}</option>`).join('');
  filterContractor.innerHTML='<option value="">All</option>'+[...contractors].sort().map(c=>`<option value="${c}">${c}</option>`).join('');
  filterEngineer.innerHTML='<option value="">All</option>'+[...engineers].sort().map(e=>`<option value="${e}">${e}</option>`).join('');
  filterStatus.innerHTML='<option value="">All</option>'+[...statuses].sort().map(s=>`<option value="${s}">${s}</option>`).join('');
}

function toggleFilters(force){
  const willHide=force===undefined?!filtersBox.classList.contains('filters-hidden'):force;
  if(willHide){
    filtersBox.classList.add('filters-hidden');
    toggleFiltersBtn.textContent='Show Filters';
    toggleFiltersBtn.title='Show Filters';
  }else{
    filtersBox.classList.remove('filters-hidden');
    toggleFiltersBtn.textContent='Hide Filters';
    toggleFiltersBtn.title='Hide Filters';
  }
}

function saveFilterState(){
  const state={
    combo:filterCombo.value||'',
    year:filterYear.value||'',
    status:filterStatus.value||'',
    contractor:filterContractor.value||'',
    engineer:filterEngineer.value||''
  };
  localStorage.setItem('pcma_filters', JSON.stringify(state));
}
function restoreFilterState(){
  try{
    const raw=localStorage.getItem('pcma_filters'); if(!raw) return;
    const s=JSON.parse(raw);
    filterCombo.value=s.combo||''; filterYear.value=s.year||''; filterStatus.value=s.status||''; filterContractor.value=s.contractor||''; filterEngineer.value=s.engineer||'';
  }catch{ /* ignore */ }
}
function clearFilters(){
  filterCombo.value=''; filterYear.value=''; filterStatus.value=''; filterContractor.value=''; filterEngineer.value='';
  localStorage.removeItem('pcma_filters');
  resultInfo.classList.add('hidden');
  grid.classList.add('hidden');
}

async function applyFilters(){
  toggleFilters(true);                // hide filters on apply
  applyFilterBtn.disabled=true; applyFilterBtn.classList.add('busy');

  // Read filters
  const combo=(filterCombo.value||'').toLowerCase().trim();
  const y=(filterYear.value||'').toLowerCase();
  const s=(filterStatus.value||'').toLowerCase();
  const c=(filterContractor.value||'').toLowerCase();
  const e=(filterEngineer.value||'').toLowerCase();

  // Column indexes (handle subtle header names)
  const ccid = headers.findIndex(h=>h.includes('contract id'));
  const cp   = headers.findIndex(h=>h.includes('project name'));
  const cl   = headers.findIndex(h=>h.includes('location'));
  const cy   = headers.findIndex(h=>h.includes('year'));
  const cs   = headers.findIndex(h=>h.includes('status'));
  const cc   = headers.findIndex(h=>h.includes('contractor'));
  const ce   = headers.findIndex(h=>h.includes('project engineer'));

  const filtered=records.filter(r=>{
    // Combined text match (any of the three columns)
    const matchCombo = !combo || (
      (ccid>=0 && String(r[ccid]||'').toLowerCase().includes(combo)) ||
      (cp  >=0 && String(r[cp]  ||'').toLowerCase().includes(combo)) ||
      (cl  >=0 && String(r[cl]  ||'').toLowerCase().includes(combo))
    );
    const matchYear = (!y || (cy>=0 && String(r[cy]||'').toLowerCase()===y));
    const matchStat = (!s || (cs>=0 && String(r[cs]||'').toLowerCase()===s));
    const matchCont = (!c || (cc>=0 && String(r[cc]||'').toLowerCase()===c));
    const matchEng  = (!e || (ce>=0 && String(r[ce]||'').toLowerCase()===e));
    return matchCombo && matchYear && matchStat && matchCont && matchEng;
  });

  // 1s center progress with stars
  await startCenterProgress(1000);

  grid.classList.remove('hidden');
  renderGrid(filtered.length?filtered:[]);
  resultInfo.textContent = `${filtered.length} result${filtered.length!==1?'s':''}`;
  resultInfo.classList.remove('hidden');

  saveFilterState();
  applyFilterBtn.disabled=false; applyFilterBtn.classList.remove('busy');
}

/* Enter to apply for the combined search */
filterCombo.addEventListener('keydown',e=>{ if(e.key==='Enter') applyFilters(); });
[filterYear,filterStatus,filterContractor,filterEngineer].forEach(sel=>sel.addEventListener('change',()=>saveFilterState()));
toggleFiltersBtn.addEventListener('click',()=>toggleFilters());
applyFilterBtn.addEventListener('click',applyFilters);
clearFilterBtn.addEventListener('click',clearFilters);

/* ===== GRID ===== */
function renderGrid(rows){
  lastRenderedRows = rows.slice();
  grid.innerHTML="";
  const colContractID=headers.findIndex(h=>h.includes('contract id'));
  const colProjectName=headers.findIndex(h=>h.includes('project name'));
  const colStatus=headers.findIndex(h=>h.includes('status'));
  const colEngineer=headers.findIndex(h=>h.includes('project engineer'));
  const colLocation=headers.findIndex(h=>h.includes('location'));
  const colImage1=headers.findIndex(h=>h.includes('image 1'));

  if(rows.length===0){
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:20px;color:#777;">No data found.</div>`;
    return;
  }

  rows.forEach((r,idx)=>{
    if(!r || !r.join('').trim()) return;

    const card=document.createElement('div'); 
    card.className='card';
    card.dataset.rowIndex = String(idx);

    const img=document.createElement('img');
    const link=(colImage1>=0 && r[colImage1])?String(r[colImage1]).trim():'';
    img.src=link||LOGO_FALLBACK; img.className='card-thumb'; img.loading='lazy'; img.decoding='async';
    img.onerror=()=>{img.src=LOGO_FALLBACK;};
    card.appendChild(img);

    const content=document.createElement('div'); content.className='card-content';

    const headerRow=document.createElement('div');
    headerRow.style.display='flex'; headerRow.style.justifyContent='space-between'; headerRow.style.alignItems='baseline';
    const comboQ=(filterCombo.value||'').trim().toLowerCase();
    const cidHtml = highlight((colContractID>=0 && r[colContractID])?r[colContractID]:'' , comboQ);
    const engHtml = esc((colEngineer>=0 && r[colEngineer])?r[colEngineer]:'');
    headerRow.innerHTML = `<span class="contract-id">${cidHtml}</span><span class="engineer-name">${engHtml}</span>`;
    content.appendChild(headerRow);

    const nameDiv=document.createElement('div');
    nameDiv.style.marginTop='4px';
    const projText=(colProjectName>=0 && r[colProjectName])?r[colProjectName]:'';
    nameDiv.innerHTML=`<b>Project:</b> ${highlight(projText, comboQ)}`;
    content.appendChild(nameDiv);

    if(colLocation>=0 && r[colLocation]){
      const locDiv=document.createElement('div');
      locDiv.style.marginTop='2px';
      locDiv.innerHTML=`<b>Location:</b> ${highlight(r[colLocation], comboQ)}`;
      content.appendChild(locDiv);
    }

    const statusDiv=document.createElement('div');
    const statusText=((colStatus>=0 && r[colStatus])?String(r[colStatus]):'').trim();
    const t=statusText.toLowerCase(); let bg='#777';
    if(t==='completed (pcma)'||t==='pcma') bg='#2563eb';
    else if(t==='completed') bg='#16a34a';
    else if(t==='on-going') bg='#f97316';
    else if(t==='100%') bg='#14b8a6';
    statusDiv.innerHTML=`<span class="status" style="background:${bg}">${esc(statusText)}</span>`;
    content.appendChild(statusDiv);

    card.appendChild(content);

    // Primary click handler
    card.onclick=()=>showDetail(r);

    grid.appendChild(card);
  });
}

/* Delegated click fallback */
grid.addEventListener('click', (e)=>{
  const card = e.target.closest('.card');
  if(!card) return;
  const idx = Number(card.dataset.rowIndex);
  if(!Number.isNaN(idx) && lastRenderedRows[idx]) showDetail(lastRenderedRows[idx]);
});

/* ===== MODAL ===== */
function showDetail(row){
  document.body.classList.add('no-scroll');
  modalBg.classList.add('show');
  try{
    modalContent.innerHTML=''; modalButtons.innerHTML=''; modalImages.innerHTML='';

    const cidIdx=headers.findIndex(h=>h.includes('contract id'));
    modalCID.textContent=(cidIdx>=0?row[cidIdx]:'')||'—';

    const colUpload=headers.findIndex(h=>h.includes('upload pictures'));
    const colFolder=headers.findIndex(h=>h.includes('folder'));
    const colStatus=headers.findIndex(h=>h.includes('status'));
    const colSched=headers.findIndex(h=>h.includes('sched'));
    const colActual=headers.findIndex(h=>h.includes('actual'));
    const colSlip=headers.findIndex(h=>h.includes('slip')); // matches "slip" or "slippage"
    const colDelay=headers.findIndex(h=>h.includes('delay'));
    let colProg=headers.findIndex(h=>h.includes('progress')); if(colProg<0) colProg=18;

    function statusColor(v){
      const t=(v||'').toLowerCase();
      if(t==='completed (pcma)'||t==='pcma') return '#2563eb';
      if(t==='completed') return '#16a34a';
      if(t==='on-going') return '#f97316';
      if(t==='100%') return '#14b8a6';
      return '#6b7280';
    }

    /* Build details; hide YEAR / SCHEDULE / ACTUAL / SLIPPAGE / DELAY / PROGRESS / CONTRACT ID */
    headers.forEach((h,i)=>{
      const raw=(h||'').trim(); const L=raw.replace(/[:]/g,'').toUpperCase(); const V=row[i]||''; if(!V) return;
      if(L.startsWith('IMAGE')||L.includes('FOLDER')||L.includes('UPLOAD PICTURES')) return;
      const HIDE_KEYS=['SCHEDULE','ACTUAL','SLIPPAGE','DELAY','PROGRESS','YEAR','CONTRACT ID','ABC','CONTRACT AMOUNT','VARIANCE','CALENDAR DAYS','(CD)','CD','NOTICE TO PROCEED','NTP','EXPIRY DATE','ORIGINAL EXPIRY DATE','REVISED EXPIRY DATE','REV. EXPIRY DATE','REV EXPIRY DATE','DATE OF COMPLETION','COMPLETION DATE','CERTIFICATE OF COMPLETION','CERTIFICATE OF ACCEPTANCE','COC','COA'];
      if(HIDE_KEYS.some(k=>L.includes(k))) return;

      const d=document.createElement('div'); d.className='detail-row';
      const SHORT_MAP={
        'PROJECT ENGINEER':'PE',
        'PROJECT INSPECTOR':'PI',
        'RESIDENT ENGINEER':'RE',
        'QUANTITY ENGINEER':'QE',
        'MATERIALS ENGINEER':'ME'
      };
      const ROLE_CLASS_MAP={
        'PROJECT ENGINEER':'role-pe',
        'PROJECT INSPECTOR':'role-pi',
        'RESIDENT ENGINEER':'role-re',
        'QUANTITY ENGINEER':'role-qe',
        'MATERIALS ENGINEER':'role-me'
      };
      let displayLabel=L;
      if(SHORT_MAP[L]){
        displayLabel=SHORT_MAP[L];
        d.classList.add('compact');
        d.classList.add(ROLE_CLASS_MAP[L]);
      }
      const CENTER_SET=new Set(['PROJECT NAME','LOCATION','CONTRACTOR','REMARKS','LAST BILLING']);
      if(CENTER_SET.has(L)) d.classList.add('center-row');
      let chipClass='';
      if(L.includes('PROJECT ENGINEER'))chipClass='project-engineer';
      else if(L.includes('PROJECT INSPECTOR'))chipClass='project-inspector';
      else if(L.includes('RESIDENT ENGINEER'))chipClass='resident-engineer';
      else if(L.includes('QUANTITY ENGINEER'))chipClass='quantity-engineer';
      else if(L.includes('MATERIALS ENGINEER'))chipClass='materials-engineer';

      if(L==='STATUS'){
        const sv=(colStatus>=0?row[colStatus]:V)||'';
        d.innerHTML=`<span class="detail-label">${L}:</span><span class="detail-value status-badge" style="background:${statusColor(sv)}">${esc(sv)}</span>`;
      }else{
        d.innerHTML=`<span class=\"detail-label\">${displayLabel}:<\/span><span class=\"detail-value ${chipClass}\">${esc(V)}<\/span>`;
      }
      modalContent.appendChild(d);

      // Two-column key stats grid below Contractor
      if(L==='CONTRACTOR'){
        const abcIdx = findCol('abc','approved budget for the contract');
        const amtIdx = findCol('contract amount','amount');
        const revAmtIdx = findCol('revised contract amount','rev. contract amount','rev contract amount');
        const cdIdx = findCol('cd','calendar days');
        const revCdIdx = findCol('rev cd','revised cd','revised calendar days');
        const ntpIdx = findCol('notice to proceed','ntp');
        const expIdx = findCol('original expiry date','expiry date');
        const revExpIdx = findCol('revised expiry date','rev expiry date','rev. expiry date');
        const docIdx = findCol('date of completion','completion date','doc');
        const cocIdx = findCol('certificate of completion','cert of completion','coc');
        const coaIdx = findCol('certificate of acceptance','cert of acceptance','coa');

        const abcV = abcIdx>-1?row[abcIdx]:'';
        const amtV = amtIdx>-1?row[amtIdx]:'';
        const revAmtV = revAmtIdx>-1?row[revAmtIdx]:'';
        const cdV = cdIdx>-1?row[cdIdx]:'';
        const revCdV = revCdIdx>-1?row[revCdIdx]:'';
        const ntpV = ntpIdx>-1?row[ntpIdx]:'';
        const expV = expIdx>-1?row[expIdx]:'';
        const revExpV = revExpIdx>-1?row[revExpIdx]:'';
        const docV = docIdx>-1?row[docIdx]:'';
        const cocV = cocIdx>-1?row[cocIdx]:'';
        const coaV = coaIdx>-1?row[coaIdx]:'';

        const A = parseMoney(amtV), R = parseMoney(revAmtV), B = parseMoney(abcV);
        let varianceText = '—', varianceNeg = false;
        if(R!=null && A!=null){ const diff = R-A; varianceText = fmtPHP(diff); varianceNeg = diff<0; }
        else if(A!=null && B!=null){ const diff2 = A-B; varianceText = fmtPHP(diff2); varianceNeg = diff2<0; }

        const abcText = (parseMoney(abcV)!=null)? fmtPHP(parseMoney(abcV)) : (abcV||'—');
        const amtText = (parseMoney(amtV)!=null)? fmtPHP(parseMoney(amtV)) : (amtV||'—');
        const revAmtText = (parseMoney(revAmtV)!=null)? fmtPHP(parseMoney(revAmtV)) : (revAmtV||'—');
        const cdText = (parseMoney(cdV)!=null)? `${Math.round(parseMoney(cdV))} days` : (cdV||'—');
        const revCdText = (parseMoney(revCdV)!=null)? `${Math.round(parseMoney(revCdV))} days` : (revCdV||'—');
        const ntpText = ntpV||'—';
        const expText = expV||'—';
        const revExpText = revExpV||'—';
        const docText = docV||'—';
        const cocText = cocV||'—';
        const coaText = coaV||'—';

        const grid=document.createElement('div'); grid.className='pair-grid';
        function addBox(label,value,span2=false,neg=false){
          const box=document.createElement('div'); box.className='pair-box' + (span2?' span-2':'');
          const l=document.createElement('span'); l.className='pair-label'; l.textContent=label;
          const v=document.createElement('span'); v.className='pair-value'; if(neg) v.classList.add('neg'); v.textContent=value||'—';
          box.appendChild(l); box.appendChild(v); grid.appendChild(box);
        }
        // Row 1
        addBox('ABC', abcText);
        addBox('Contract Amount', amtText);
        // Row 2
        addBox('Rev. Contract Amount', revAmtText);
        { const __vIdx = findCol('variance'); const __vRaw = __vIdx>-1?row[__vIdx]:'—'; const __vNeg = (parseMoney(__vRaw)??0) < 0; addBox('Variance', __vRaw||'—', false, __vNeg); }
        // Row 3
        addBox('CD', cdText);
        addBox('Rev. CD', revCdText);
        // Row 4
        addBox('NTP', ntpText);
        addBox('Expiry Date', expText);
        // Row 5 (single spanning)
        addBox('Rev. Expiry Date', revExpText);
        addBox('Date of Completion', docText);
        // Row 6
        addBox('Certificate of Completion', cocText);
        addBox('Certificate of Acceptance', coaText);

        modalContent.appendChild(grid);
      }

      if(L==='STATUS'){
        /* Mini bars */
        const schedNum=toPct((colSched>=0&&row[colSched])?row[colSched]:'0%',0);
        const actualNum=toPct((colActual>=0&&row[colActual])?row[colActual]:'0%',0);
        const slipNum=toPct((colSlip>=0&&row[colSlip])?row[colSlip]:'0%',0);

        const mini=document.createElement('div'); mini.className='mini-bars';

        function makeMini(label,num,baseColor,isSlippage=false){
          const r=document.createElement('div'); r.className='mini-row';
          const lab=document.createElement('div'); lab.className='mini-label'; lab.textContent=label;
          const bar=document.createElement('div'); bar.className='mini-bar';
          const fill=document.createElement('div'); fill.className='mini-fill';
          if(isSlippage){
            const cfg=colorForSlippage(num);
            fill.style.background=cfg.bg; fill.style.color=cfg.text;
            bar.appendChild(fill); r.appendChild(lab); r.appendChild(bar); mini.appendChild(r);
            animateMiniBar(fill,num,800,(v)=>`${v.toFixed(2)}%${(cfg.sad && v<=-10)?' ☹️':''}`);
          }else{
            fill.style.background=baseColor; bar.appendChild(fill); r.appendChild(lab); r.appendChild(bar); mini.appendChild(r);
            animateMiniBar(fill,num,800,(v)=>`${v.toFixed(2)}%`);
          }
        }
        makeMini('SCHED',schedNum,'#3b82f6',false);
        makeMini('ACTUAL',actualNum,'#10b981',false);
        makeMini('SLIPPAGE',slipNum,null,true);
        modalContent.appendChild(mini);

        /* Time Lapsed big bar (with Delay in text) */
        const progRaw=(colProg>=0&&row[colProg])?String(row[colProg]).trim():'0%';
        const delayRaw=(colDelay>=0&&row[colDelay])?String(row[colDelay]).trim():'';
        let pctNum=Math.max(0,toPct(progRaw,0)); // may exceed 100

        const wrap=document.createElement('div'); wrap.className='progress-wrap';
        const label=document.createElement('div'); label.className='progress-label'; label.textContent='Time Lapsed';
        const bar=document.createElement('div'); bar.className='progress-bar';
        const fill=document.createElement('div'); fill.className='progress-fill'; fill.textContent='0%';
        bar.appendChild(fill); wrap.appendChild(label); wrap.appendChild(bar); modalContent.appendChild(wrap);

        function colorFor(v){ if(v>100) return '#dc2626'; if(v>=100) return '#16a34a'; if(v>80) return '#f97316'; return '#60a5fa'; }
        fill.style.background=colorFor(pctNum);

        requestAnimationFrame(()=>{
          const startTime=performance.now(),duration=900,start=0,end=pctNum;
          function step(now){
            const t=Math.min(1,(now-startTime)/duration);
            const curr=start+(end-start)*t, width=Math.min(curr,100);
            fill.style.width=width+'%';
            fill.textContent=`${Math.round(curr)}%${delayRaw?' ('+esc(delayRaw)+')':''}`;
            if(t<1) requestAnimationFrame(step);
            else { fill.style.width=Math.min(end,100)+'%'; fill.style.background=colorFor(end); fill.textContent=`${Math.round(end)}%${delayRaw?' ('+esc(delayRaw)+')':''}`; }
          }
          requestAnimationFrame(step);
        });
      }
    });

    /* Buttons */
    // Post-processing: highlight key rows with light orange
    (function(){
      const orangeSet=new Set(['PROJECT NAME','LOCATION','CONTRACTOR','LAST BILLING','REMARKS']);
      const rows=[...modalContent.querySelectorAll('.detail-row')];
      rows.forEach(row=>{
        const labelEl=row.querySelector('.detail-label');
        if(!labelEl) return;
        const raw=(labelEl.textContent||'').replace(':','').trim().toUpperCase();
        if(orangeSet.has(raw)){
          row.classList.add('emph-orange');
          row.classList.add('center-row'); // keep them centered as requested earlier
        }
      });
    })();

    if(colUpload>=0 && row[colUpload]){
      const b=document.createElement('button');
      b.id='uploadBtn'; b.textContent='Upload Picture';
      b.onclick=e=>{ e.stopPropagation(); window.open(row[colUpload],'_blank'); };
      modalButtons.appendChild(b);
    }
    if(colFolder>=0 && row[colFolder]){
      const b=document.createElement('button');
      b.id='googleDriveBtn'; b.textContent='Google Drive';
      b.onclick=e=>{ e.stopPropagation(); window.open(row[colFolder],'_blank'); };
      modalButtons.appendChild(b);
    }

    /* Images */
    let found=false;
    for(let i=1;i<=10;i++){
      const ci=headers.findIndex(h=>h.includes(`image ${i}`));
      if(ci>=0 && row[ci]){
        const im=document.createElement('img');
        im.src=row[ci]; im.onerror=()=>{im.src=LOGO_FALLBACK;};
        im.className='modal-img';
        im.loading='lazy'; im.decoding='async';
        im.style.borderRadius='10px'; im.style.objectFit='contain'; im.style.margin='6px 0';
        modalImages.appendChild(im); found=true;
      }
    }
    if(!found){
      const box=document.createElement('div'); box.style.textAlign='center'; box.style.marginTop='15px';
      const logo=document.createElement('img'); logo.src=LOGO_FALLBACK; logo.style.width='160px'; logo.style.opacity='.9'; logo.style.borderRadius='8px';
      const cap=document.createElement('p'); cap.textContent='No images available'; cap.style.color='#2563eb'; cap.style.fontWeight='700'; cap.style.marginTop='8px';
      box.appendChild(logo); box.appendChild(cap); modalImages.appendChild(box);
    }
  
    // Post-processing: compact role rows (PE/PI/RE/QE/ME)
    (function(){
      const roleMap={
        'PROJECT ENGINEER':'PE',
        'PROJECT INSPECTOR':'PI',
        'RESIDENT ENGINEER':'RE',
        'QUANTITY ENGINEER':'QE',
        'MATERIALS ENGINEER':'ME'
      };
      const roleClassMap={
        'PROJECT ENGINEER':'role-pe',
        'PROJECT INSPECTOR':'role-pi',
        'RESIDENT ENGINEER':'role-re',
        'QUANTITY ENGINEER':'role-qe',
        'MATERIALS ENGINEER':'role-me'
      };
      const rows=[...modalContent.querySelectorAll('.detail-row')];
      rows.forEach(row=>{
        const labelEl=row.querySelector('.detail-label');
        const valEl=row.querySelector('.detail-value');
        if(!labelEl||!valEl) return;
        const raw=(labelEl.textContent||'').replace(':','').trim().toUpperCase();
        if(roleMap[raw]){
          // Short label
          labelEl.textContent=roleMap[raw] + ':';
          // Classes
          row.classList.add('compact');
          const cls=roleClassMap[raw]; if(cls) row.classList.add(cls);
          // Enforce left-aligned inline styles in case older CSS wins
          row.style.justifyContent='flex-start';
          row.style.flexWrap='nowrap';
          // Keep value right after label
          valEl.style.marginLeft='6px';
          // Ensure pill
          valEl.style.borderRadius='999px';
          valEl.style.padding='2px 8px';
        }
      });
    })();

  }catch(err){
    console.error('Modal render error:', err);
    modalContent.innerHTML = `<div style="padding:16px;color:#b91c1c;font-weight:700;">Error loading details.</div>`;
  }
}

/* ===== EVENTS ===== */
function closeModal(){ modalBg.classList.remove('show'); document.body.classList.remove('no-scroll'); }
closeModalTop.addEventListener('click',closeModal);
modalBg.addEventListener('click',e=>{ if(e.target===modalBg) closeModal(); });
// Close with ESC key
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && modalBg.classList.contains('show')) closeModal(); });

/* ===== INIT ===== */
loadData();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(console.error); }
</script>
</body>
</html>
