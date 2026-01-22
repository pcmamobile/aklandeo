/* ===========================
   AMEND WINDOW (amend.js)
   - ACCOMPLISHMENT tab:
     Shows ONLY the LAST month columns (Actual + PCMA) and lists rows that are missing.
   =========================== */
(function () {
  "use strict";

  // ---- CONFIG ----
const SHEET_ID = "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
const RANGE_WIDE = "A1:ZZZ";
const SHEET_ACCOMPLISHMENT = "PCMA"; // existing ACCOMPLISHMENT data source
const SHEET_APP = "APP";             // NEW: PCMA tab data source
const SHEET_DATE = "DATE";           // NEW: ACCEPTANCE tab data source
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

  function getApiKey() {
    // Do NOT hardcode your API key in this file.
    // Put it in window.GOOGLE_API_KEY (recommended via config.js).
    return (window.GOOGLE_API_KEY || window.GOOGLE_API_KEY_AMEND || "").toString().trim();
  }

function sheetA1(sheetName) {
  return `${sheetName}!${RANGE_WIDE}`;
}

  // ---- DOM ----
  const el = {
    btnOpen: null,
    overlay: null,
    closeBtn: null,
    tabButtons: [],
    panels: [],
    accStatus: null,
    accSubtitle: null,
    accTable: null,
    accReload: null,
    peFilter: null,
	pcmaStatus: null,
pcmaSubtitle: null,
pcmaTable: null,
pcmaReload: null,
pcmaPeFilter: null,
    acceptanceStatus: null,
    acceptanceSubtitle: null,
    acceptanceTable: null,
    acceptanceReload: null,
    acceptancePeFilter: null,
	printBtn: null,
topBar: null,
  };

  function q(id) { return document.getElementById(id); }

  function initDomRefs() {
    el.btnOpen = q("openAmend");
    el.overlay = q("amendOverlay");
    el.closeBtn = q("amCloseBtn");
    el.accStatus = q("amAccStatus");
    el.accSubtitle = q("amAccSubtitle");
    el.accTable = q("amAccTable");
    el.accReload = q("amAccReload");
	  el.pcmaStatus = q("amPcmaStatus");
  el.pcmaSubtitle = q("amPcmaSubtitle");
  el.pcmaTable = q("amPcmaTable");
  el.pcmaReload = q("amPcmaReload");
  el.acceptanceStatus = q("amAcceptanceStatus");
  el.acceptanceSubtitle = q("amAcceptanceSubtitle");
  el.acceptanceTable = q("amAcceptanceTable");
  el.acceptanceReload = q("amAcceptanceReload");
  el.topBar = document.querySelector(".am-top");
el.printBtn = q("amPrintBtn");

    el.tabButtons = Array.from(document.querySelectorAll(".am-tab[data-am-tab]"));
    el.panels = Array.from(document.querySelectorAll(".am-panel[data-am-panel]"));
  }

  // ---- Overlay open/close ----
  function openAmend() {
    if (!el.overlay) return;
    el.overlay.hidden = false;
    document.body.classList.add("no-scroll");

    // Default: show ACCOMPLISHMENT panel
    activateTab("accomplishment");

    // Load data (only when opened)
    loadAccomplishment().catch((err) => {
      setAccError(err && err.message ? err.message : String(err));
    });
  }

  function closeAmend() {
    if (!el.overlay) return;
    el.overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  // Expose for other scripts if needed
  window.openAmend = openAmend;
  window.closeAmend = closeAmend;

  // ---- Tabs ----
  function activateTab(key) {
    el.tabButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.amTab === key));
    el.panels.forEach((p) => p.classList.toggle("is-active", p.dataset.amPanel === key));
  }

function wireTabs() {
  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.amTab;
      activateTab(key);

      if (key === "accomplishment") {
        loadAccomplishment().catch((err) => {
          setAccError(err && err.message ? err.message : String(err));
        });
      }

      if (key === "pcma") {
        loadPcmaTab().catch((err) => {
          setPcmaError(err && err.message ? err.message : String(err));
        });
      }

      if (key === "acceptance") {
        loadAcceptanceTab().catch((err) => {
          setAcceptanceError(err && err.message ? err.message : String(err));
        });
      }
    });
  });
}

  // ---- Helpers: Sheet parsing ----
  const MONTHS = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

// amend.js — REPLACE normalize() with this
function normalize(s) {
  return (s ?? "")
    .toString()
    .replace(/\u00A0/g, " ")   // NBSP
    .replace(/\s+/g, " ")      // collapse newlines/tabs/multiple spaces
    .trim();
}


  function normUpper(s) {
    return normalize(s).toUpperCase();
  }

  function isEmptyCell(v) {
    const s = normalize(v);
    if (!s) return true;
    if (s === "-" || s === "—") return true;
    return false;
  }

  function findHeaderIndex(headers, candidates) {
    const up = headers.map(normUpper);
    for (const c of candidates) {
      const idx = up.indexOf(c.toUpperCase());
      if (idx !== -1) return idx;
    }
    // fallback: partial match
    for (let i = 0; i < up.length; i++) {
      const cell = up[i];
      if (!cell) continue;
      for (const c of candidates) {
        if (cell.includes(c.toUpperCase())) return i;
      }
    }
    return -1;
  }

  function parseMonthFromHeader(cell) {
    // Matches: "2025 November" or "2025 November PCMA"
    const s = normalize(cell);
    const m = s.match(/(20\d{2})\s+([A-Za-z]+)/);
    if (!m) return null;
    const year = Number(m[1]);
    const monthName = (m[2] || "").toLowerCase();
    const month = MONTHS[monthName];
    if (!month) return null;
    return { year, month, key: year * 100 + month, label: `${year} ${m[2]}` };
  }


// Also supports 2-digit year remark headers like: "25 Nov Remarks"
const MONTHS_SHORT = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function monthNumberFromName(name) {
  const raw = normalize(name).toLowerCase();
  if (!raw) return null;
  if (MONTHS[raw]) return MONTHS[raw];
  const abbr = raw.slice(0, 3);
  return MONTHS_SHORT[abbr] || null;
}

function parseMonthFromAnyHeader(cell) {
  // Examples:
  // - "2025 November", "2025 November PCMA", "2025 Nov"
  // - "25 Nov Remarks"
  const s = normalize(cell);

  // 4-digit year first
  let m = s.match(/\b(20\d{2})\s+([A-Za-z]{3,})\b/);
  if (m) {
    const year = Number(m[1]);
    const month = monthNumberFromName(m[2]);
    if (!month) return null;
    return { year, month, key: year * 100 + month };
  }

  // 2-digit year (assume 20xx)
  m = s.match(/\b(\d{2})\s+([A-Za-z]{3})\b/);
  if (m) {
    const year = 2000 + Number(m[1]);
    const month = monthNumberFromName(m[2]);
    if (!month) return null;
    return { year, month, key: year * 100 + month };
  }

  return null;
}

function pickRemarksIndexForMonth(headers, monthKey) {
  // Prefer remark headers that match the same month key
  for (let i = 0; i < headers.length; i++) {
    const cell = normalize(headers[i]);
    if (!cell) continue;
    if (!isRemarksHeader(cell)) continue;

    const m = parseMonthFromAnyHeader(cell) || parseMonthFromHeader(cell);
    if (m && m.key === monthKey) return i;
  }

  // Fallback: any "REMARKS" (non-month-specific)
  const idxGeneric = findHeaderIndex(headers, ["REMARKS", "REMARK"]);
  if (idxGeneric !== -1) return idxGeneric;

  return -1;
}




  function isPcmaHeader(cell) {
    return /\bPCMA\b/i.test(normalize(cell));
  }

  function isRemarksHeader(cell) {
    return /\bREMARK/i.test(normalize(cell));
  }

  function parseAccompPercent(v) {
    // Accept: "100%", "100", 100, "1" (as 1.0), "0.75" etc.
    const s = normalize(v).replace(/,/g, "");
    if (!s) return null;
    const pct = s.includes("%");
    const num = Number(s.replace("%", ""));
    if (!Number.isFinite(num)) return null;
    if (pct) return num;
    // If value looks like 0.1, treat as fraction
    if (num <= 1) return num * 100;
    return num; // already percent
  }

  // ---- UI helpers ----
  function setAccStatus(msg) {
    if (!el.accStatus) return;
    el.accStatus.classList.remove("is-error");
    el.accStatus.textContent = msg;
  }

  function setAccError(msg) {
    if (!el.accStatus) return;
    el.accStatus.classList.add("is-error");
    el.accStatus.textContent = `ACCOMPLISHMENT: ${msg}`;
  }

  function clearTable() {
    if (el.accTable) el.accTable.innerHTML = "";
  }

  function createCheck(ok) {
    const div = document.createElement("div");
    div.className = `am-check ${ok ? "ok" : "bad"}`;
    div.textContent = ok ? "✓" : "✕";
    return div;
  }

  function applyStickyHeaderOffsets(table) {
    try {
      const thead = table.querySelector("thead");
      if (!thead) return;
      const rows = thead.querySelectorAll("tr");
      if (rows.length < 2) return;
      const r1 = rows[0];
      const r2 = rows[1];
      const h1 = r1.getBoundingClientRect().height;
      // Row 1 sticks at top:0 via CSS
      r2.querySelectorAll("th").forEach((th) => (th.style.top = `${Math.ceil(h1)}px`));
    } catch (_) {
      // ignore
    }
  }

  // ---- State ----
const state = {
  peFilter: "",       // ACCOMPLISHMENT tab PE filter
  pcmaPeFilter: "",   // PCMA tab PE filter
};

  function applyPeFilter() {
    if (!el.accTable) return;

    const tbody = el.accTable.querySelector("tbody");
    if (!tbody) return;

    const filter = (state.peFilter || "").toString().trim();
    let total = 0;
    let visible = 0;

    Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
      const pe = (tr.dataset.pe || "").toString().trim();
      if (!pe) return; // ignore helper rows
      total++;
      const show = !filter || pe === filter;
      tr.hidden = !show;
      if (show) visible++;
    });

    const noPeRow = tbody.querySelector("#amNoPeResults");
    if (noPeRow) {
      noPeRow.hidden = !(filter && total > 0 && visible === 0);
    }

    const monthLabel = (el.accTable.dataset.monthLabel || "").toString().trim();
    if (monthLabel) {
      const suffix = filter ? ` (PE: ${filter})` : "";
      setAccStatus(`ACCOMPLISHMENT: Showing ${visible} project(s) needing update for ${monthLabel}${suffix}.`);
    }
  }

  // ---- Data fetch ----
async function fetchSheetValues(sheetName, friendlyName, minRows = 3) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing API key. Set window.GOOGLE_API_KEY before loading amend.js.");
  }

  const rangeA1 = sheetA1(sheetName);
  const url =
    `${SHEETS_API}/${encodeURIComponent(SHEET_ID)}/values/` +
    `${encodeURIComponent(rangeA1)}?majorDimension=ROWS&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    const msg = (json && json.error && json.error.message) ? json.error.message : text;
    throw new Error(`Failed to load ${friendlyName || sheetName}. ${msg}`);
  }

  const values = (json && json.values) ? json.values : [];
  if (!Array.isArray(values) || values.length < minRows) {
    throw new Error(`${friendlyName || sheetName} sheet returned no data or missing the required header row.`);
  }
  return values;
}


  function pickLatestMonthPair(headers) {
    // Headers are in row 3 (index 2)
    // Find month headers and pair with the matching "PCMA" month header.
    const pairs = [];

    for (let i = 0; i < headers.length; i++) {
      const cell = normalize(headers[i]);
      if (!cell) continue;

      const m = parseMonthFromHeader(cell);
      if (!m) continue;

      // Exclude remarks headers
      if (isRemarksHeader(cell)) continue;

      // Identify PCMA header vs Actual header
      const pcma = isPcmaHeader(cell);

      pairs.push({
        idx: i,
        key: m.key,
        label: m.label,
        isPcma: pcma,
        raw: cell,
      });
    }

    if (!pairs.length) return null;

    // Latest month key
    const latestKey = Math.max(...pairs.map((p) => p.key));
    const latest = pairs.filter((p) => p.key === latestKey);

    const actualCol = latest.find((p) => !p.isPcma);
    const pcmaCol = latest.find((p) => p.isPcma);

    if (!actualCol || !pcmaCol) {
      // If only one of them exists, we still proceed with what we have
      return {
        monthKey: latestKey,
        monthLabel: latest[0].label,
        actualIdx: actualCol ? actualCol.idx : -1,
        pcmaIdx: pcmaCol ? pcmaCol.idx : -1,
      };
    }

    return {
      monthKey: latestKey,
      monthLabel: actualCol.label,
      actualIdx: actualCol.idx,
      pcmaIdx: pcmaCol.idx,
    };
  }

  async function loadAccomplishment() {
    clearTable();
    setAccStatus("ACCOMPLISHMENT: Loading PCMA…");

const values = await fetchSheetValues(SHEET_ACCOMPLISHMENT, "PCMA");

    // 3rd row is header
    const headerRow = values[2] || [];
    const headers = headerRow.map(normalize);

    const idxPE = findHeaderIndex(headers, [
  "PROJECT ENGINEER",
  "PE",
  "PROJECT ENGINEER (PE)",
  "PROJECT ENGINEER NAME",
  "PROJ. ENGINEER",
]);
    const idxCID = findHeaderIndex(headers, ["CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);

    if (idxPE === -1) throw new Error('Header "PE" not found in PCMA (3rd row).');
    if (idxCID === -1) throw new Error('Header "Contract ID" not found in PCMA (3rd row).');

    const monthPair = pickLatestMonthPair(headers);
    if (!monthPair) throw new Error("No month columns found (e.g., '2025 November' and '2025 November PCMA').");

    const monthLabel = monthPair.monthLabel;
    const actualIdx = monthPair.actualIdx;
    const pcmaIdx = monthPair.pcmaIdx;
	const remarksIdx = pickRemarksIndexForMonth(headers, monthPair.monthKey);
	const idxAccomp = findHeaderIndex(headers, ["ACCOMP.", "ACCOMP", "ACCOMPLISHMENT"]);

    const dataRows = values.slice(3); // rows after header

    // Build list of rows that are missing for the latest month
    const rowsForDisplay = [];

    for (const row of dataRows) {
      const pe = normalize(row[idxPE]);
      const cid = normalize(row[idxCID]);

      // Hide if PE empty
      if (!pe) continue;
      if (!cid) continue;

      const actualVal = actualIdx >= 0 ? row[actualIdx] : "";
      const pcmaVal = pcmaIdx >= 0 ? row[pcmaIdx] : "";
	  const remarksVal = remarksIdx >= 0 ? row[remarksIdx] : "";

      // If ACCOMP is 100% => actualOk should be true
      // We treat "ACCOMP." column if available; otherwise we fall back to actual cell presence.
      const idxAccomp = findHeaderIndex(headers, ["ACCOMP.", "ACCOMP", "ACCOMPLISHMENT"]);
      let accompPct = null;
      if (idxAccomp !== -1) accompPct = parseAccompPercent(row[idxAccomp]);

	  const pcmaPct = parseAccompPercent(pcmaVal);
      const actualOk = (accompPct !== null && accompPct >= 100) ? true : !isEmptyCell(actualVal);
      const pcmaOk = !isEmptyCell(pcmaVal);

const remarksAuto = (remarksIdx >= 0) && (pcmaPct !== null && pcmaPct >= 100) && isEmptyCell(remarksVal);
const remarksOk   =
  (remarksIdx === -1) ? true :
  (pcmaPct !== null && pcmaPct >= 100) ? true :
  !isEmptyCell(remarksVal);

      // If both checked, hide it (do not include)
      if (actualOk && pcmaOk && remarksOk) continue;

rowsForDisplay.push({
  pe,
  cid,
  actualOk,
  pcmaOk,
  remarksOk,
  remarksText: normalize(remarksVal),
  remarksAuto,
});
    }

    // Ascend all PE (then CID)
    rowsForDisplay.sort((a, b) => {
      const ap = a.pe.toLowerCase();
      const bp = b.pe.toLowerCase();
      if (ap < bp) return -1;
      if (ap > bp) return 1;
      const ac = a.cid.toLowerCase();
      const bc = b.cid.toLowerCase();
      if (ac < bc) return -1;
      if (ac > bc) return 1;
      return 0;
    });

    renderAccomplishmentTable(monthLabel, rowsForDisplay);
    setAccStatus(`ACCOMPLISHMENT: Showing ${rowsForDisplay.length} project(s) needing update for ${monthLabel}.`);
  }

// amend.js — REPLACE your entire renderAccomplishmentTable(...) with this

function renderAccomplishmentTable(monthLabel, rows) {
  if (!el.accTable) return;
  el.accTable.innerHTML = "";
  el.accTable.dataset.monthLabel = monthLabel;
  el.accTable.dataset.totalCount = String(rows.length);

  const thead = document.createElement("thead");
  const trH = document.createElement("tr");

  // Column 1: PE dropdown (filter)
  const thPe = document.createElement("th");

  const peHead = document.createElement("div");
  peHead.className = "am-pe-head";

  const peSelect = document.createElement("select");
  peSelect.className = "am-pe-filter";
  peSelect.id = "amPeFilter";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All";
  peSelect.appendChild(optAll);

  // Options: unique PEs from rows (ascending)
  const uniqPE = Array.from(new Set(rows.map((r) => r.pe))).sort((a, b) => {
    const aa = (a || "").toString();
    const bb = (b || "").toString();
    return aa.localeCompare(bb);
  });

  for (const pe of uniqPE) {
    const opt = document.createElement("option");
    opt.value = pe;
    opt.textContent = pe;
    peSelect.appendChild(opt);
  }

  if (state.peFilter && uniqPE.includes(state.peFilter)) peSelect.value = state.peFilter;
  else {
    state.peFilter = "";
    peSelect.value = "";
  }

  peSelect.addEventListener("change", () => {
    state.peFilter = peSelect.value;
    applyPeFilter();
  });

  peHead.appendChild(peSelect);
  thPe.appendChild(peHead);
  el.peFilter = peSelect;

  // Column 2: Contract ID
  const thCid = document.createElement("th");
  thCid.textContent = "ID";

  // Column 3: ACTUAL
  const thActual = document.createElement("th");
  thActual.textContent = "ACT";
  thActual.className = "am-td-center";

  // Column 4: PCMA
  const thPcma = document.createElement("th");
  thPcma.textContent = "PCMA";
  thPcma.className = "am-td-center";

  // Column 5: REMARKS
  const thRemarks = document.createElement("th");
  thRemarks.textContent = "REMARKS";

  trH.appendChild(thPe);
  trH.appendChild(thCid);
  trH.appendChild(thActual);
  trH.appendChild(thPcma);
  trH.appendChild(thRemarks);

  thead.appendChild(trH);

  const tbody = document.createElement("tbody");

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "am-muted";
    td.textContent = "No items to amend for the latest month.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.dataset.pe = r.pe;

      const tdPe = document.createElement("td");
      tdPe.textContent = r.pe;

      const tdCid = document.createElement("td");

      // Contract ID clickable -> open ProjectDocs (do NOT close Amend)
      const cidBtn = document.createElement("button");
      cidBtn.type = "button";
      cidBtn.className = "am-cid-link";
      cidBtn.textContent = r.cid;
      cidBtn.title = "Open Project Documentation";
      cidBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof window.openProjectDocs === "function") {
          window.openProjectDocs(r.cid);
          return;
        }

        if (typeof window.openProjectDocsOverlay === "function") {
          window.openProjectDocsOverlay(r.cid);
          return;
        }

        try {
          const url = `${location.origin}${location.pathname}?contractId=${encodeURIComponent(r.cid)}&pd=1`;
          window.open(url, "_blank");
        } catch (_) {}
      });

      tdCid.appendChild(cidBtn);

      const tdActual = document.createElement("td");
      tdActual.className = "am-td-center";
      tdActual.appendChild(createCheck(r.actualOk));

      const tdPcma = document.createElement("td");
      tdPcma.className = "am-td-center";
      tdPcma.appendChild(createCheck(r.pcmaOk));

      const tdRemarks = document.createElement("td");

      const remarkWrap = document.createElement("div");
      remarkWrap.className = "am-remark-cell";
      remarkWrap.appendChild(createCheck(r.remarksOk));

      const remarkText = document.createElement("span");
      remarkText.className = "am-remark-text";

      const t = normalize(r.remarksText);
      if (t) {
        remarkText.textContent = t;
        remarkText.title = t; // hover to see full text
      } else if (r.remarksAuto) {
        remarkText.textContent = "";
        remarkText.classList.add("is-auto");
      } else {
        remarkText.textContent = "";
        remarkText.classList.add("is-auto");
      }

      remarkWrap.appendChild(remarkText);
      tdRemarks.appendChild(remarkWrap);

      tr.appendChild(tdPe);
      tr.appendChild(tdCid);
      tr.appendChild(tdActual);
      tr.appendChild(tdPcma);
      tr.appendChild(tdRemarks);

      tbody.appendChild(tr);
    }

    // No items message row (after filtering)
    const trNo = document.createElement("tr");
    trNo.id = "amNoPeResults";
    trNo.hidden = true;

    const tdNo = document.createElement("td");
    tdNo.colSpan = 5;
    tdNo.className = "am-muted";
    tdNo.textContent = "No items match the selected PE filter.";

    trNo.appendChild(tdNo);
    tbody.appendChild(trNo);
  }

  el.accTable.appendChild(thead);
  el.accTable.appendChild(tbody);

  requestAnimationFrame(() => {
    applyStickyHeaderOffsets(el.accTable);
    applyPeFilter();
  });
}



/* =========================
   ADD: PCMA TAB (APP sheet)
   ========================= */
function ensurePcmaPanelMarkup() {
  const panel = document.querySelector('.am-panel[data-am-panel="pcma"]');
  if (!panel) return;

  // Remove the old PCMA rows/text (status/content/reload row)
  panel.innerHTML = "";

  // Table only
  const wrap = document.createElement("div");
  wrap.className = "am-table-wrap";

  const table = document.createElement("table");
  table.className = "am-table";
  table.id = "amPcmaTable";

  wrap.appendChild(table);
  panel.appendChild(wrap);
}

function setPcmaStatus(msg) {
  if (!el.pcmaStatus) return;
  el.pcmaStatus.classList.remove("is-error");
  el.pcmaStatus.textContent = msg;
}

function setPcmaError(msg) {
  if (el.pcmaStatus) {
    el.pcmaStatus.classList.add("is-error");
    el.pcmaStatus.textContent = `PCMA: ${msg}`;
    return;
  }
  alert(`PCMA: ${msg}`);
}

function clearPcmaTable() {
  if (el.pcmaTable) el.pcmaTable.innerHTML = "";
}

function applyPcmaPeFilter() {
  if (!el.pcmaTable) return;

  const tbody = el.pcmaTable.querySelector("tbody");
  if (!tbody) return;

  const filter = (state.pcmaPeFilter || "").toString().trim();
  let total = 0;
  let visible = 0;

  Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
    const pe = (tr.dataset.pe || "").toString().trim();
    if (!pe) return;
    total++;
    const show = !filter || pe === filter;
    tr.hidden = !show;
    if (show) visible++;
  });

  const noPeRow = tbody.querySelector("#amPcmaNoPeResults");
  if (noPeRow) {
    noPeRow.hidden = !(filter && total > 0 && visible === 0);
  }

  const suffix = filter ? ` (PE: ${filter})` : "";
  setPcmaStatus(`PCMA: Showing ${visible} project(s) needing update${suffix}.`);
}

async function loadPcmaTab() {
  ensurePcmaPanelMarkup();
  initDomRefs();

  clearPcmaTable();
  setPcmaStatus("PCMA: Loading APP…");

  // header is 2nd row, so require at least 2 rows
  const values = await fetchSheetValues(SHEET_APP, "APP", 2);

  const headerRowIndex = 1;      // ✅ 2nd row (0-based)
  const dataStartIndex = 2;      // data starts after header

  const headerRow = values[headerRowIndex] || [];
  const headers = headerRow.map(normalize);

  const idxPE = findHeaderIndex(headers, [
    "PROJECT ENGINEER",
    "PE",
    "PROJECT ENGINEER (PE)",
    "PROJECT ENGINEER NAME",
    "PROJ. ENGINEER",
  ]);
  const idxID = findHeaderIndex(headers, ["ID", "CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);
  const idxPCMA = findHeaderIndex(headers, ["PCMA"]);

  if (idxPE === -1) throw new Error('PCMA: Header "PROJECT ENGINEER" not found in APP (2nd row).');
  if (idxID === -1) throw new Error('PCMA: Header "ID/Contract ID" not found in APP (2nd row).');
  if (idxPCMA === -1) throw new Error('PCMA: Header "PCMA" not found in APP (2nd row).');

  const dataRows = values.slice(dataStartIndex);
  const rowsForDisplay = [];

  for (const row of dataRows) {
    const pe = normalize(row[idxPE]);
    const id = normalize(row[idxID]);
    if (!pe || !id) continue;

    const pcmaValRaw = normalize(row[idxPCMA]);
    const pcmaValUp = pcmaValRaw.toUpperCase();

    // Hide if Completed (PCMA) or On-going
    if (pcmaValUp === "COMPLETED (PCMA)") continue;
    if (pcmaValUp === "ON-GOING" || pcmaValUp === "ON-GOING (PCMA)" || pcmaValUp === "ONGOING") continue;

    const remarks = pcmaValRaw ? pcmaValRaw : "Comply";

    rowsForDisplay.push({
      pe,
      id,
      pcmaOk: false,   // show ✕ for items needing update
      remarks,
    });
  }

  rowsForDisplay.sort((a, b) => {
    const ap = a.pe.toLowerCase();
    const bp = b.pe.toLowerCase();
    if (ap < bp) return -1;
    if (ap > bp) return 1;
    const ai = a.id.toLowerCase();
    const bi = b.id.toLowerCase();
    return ai.localeCompare(bi);
  });

  renderPcmaTable(rowsForDisplay);
  setPcmaStatus(`PCMA: Showing ${rowsForDisplay.length} project(s) needing update.`);
}

function renderPcmaTable(rows) {
  if (!el.pcmaTable) return;

  el.pcmaTable.innerHTML = "";
  el.pcmaTable.dataset.totalCount = String(rows.length);

  const thead = document.createElement("thead");
  const trH = document.createElement("tr");

  // PE dropdown
  const thPe = document.createElement("th");
  const peHead = document.createElement("div");
  peHead.className = "am-pe-head";

  const peSelect = document.createElement("select");
  peSelect.className = "am-pe-filter";
  peSelect.id = "amPcmaPeFilter";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All";
  peSelect.appendChild(optAll);

  const uniqPE = Array.from(new Set(rows.map((r) => r.pe))).sort((a, b) => a.localeCompare(b));
  for (const pe of uniqPE) {
    const opt = document.createElement("option");
    opt.value = pe;
    opt.textContent = pe;
    peSelect.appendChild(opt);
  }

  if (state.pcmaPeFilter && uniqPE.includes(state.pcmaPeFilter)) peSelect.value = state.pcmaPeFilter;
  else state.pcmaPeFilter = "";

  peSelect.addEventListener("change", () => {
    state.pcmaPeFilter = peSelect.value;
    applyPcmaPeFilter();
  });

  peHead.appendChild(peSelect);
  thPe.appendChild(peHead);
  el.pcmaPeFilter = peSelect;

  // ID
  const thId = document.createElement("th");
  thId.textContent = "ID";

  // PCMA
  const thPcma = document.createElement("th");
  thPcma.textContent = "PCMA";
  thPcma.className = "am-td-center";

  // REMARKS
  const thRem = document.createElement("th");
  thRem.textContent = "REMARKS";

  trH.appendChild(thPe);
  trH.appendChild(thId);
  trH.appendChild(thPcma);
  trH.appendChild(thRem);
  thead.appendChild(trH);

  const tbody = document.createElement("tbody");

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.className = "am-muted";
    td.textContent = "No items to amend.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.dataset.pe = r.pe;

      const tdPe = document.createElement("td");
      tdPe.textContent = r.pe;

      const tdId = document.createElement("td");
      const idBtn = document.createElement("button");
      idBtn.type = "button";
      idBtn.className = "am-cid-link";
      idBtn.textContent = r.id;
      idBtn.title = "Open Project Documentation";
      idBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof window.openProjectDocs === "function") return window.openProjectDocs(r.id);
        if (typeof window.openProjectDocsOverlay === "function") return window.openProjectDocsOverlay(r.id);

        try {
          const url = `${location.origin}${location.pathname}?contractId=${encodeURIComponent(r.id)}&pd=1`;
          window.open(url, "_blank");
        } catch (_) {}
      });
      tdId.appendChild(idBtn);

      const tdPcma = document.createElement("td");
      tdPcma.className = "am-td-center";
      tdPcma.appendChild(createCheck(r.pcmaOk)); // ✕ by default (needs update)

      const tdRem = document.createElement("td");
      const rem = document.createElement("span");
      rem.className = "am-remark-text";
      rem.textContent = normalize(r.remarks);
      rem.title = normalize(r.remarks);
      tdRem.appendChild(rem);

      tr.appendChild(tdPe);
      tr.appendChild(tdId);
      tr.appendChild(tdPcma);
      tr.appendChild(tdRem);
      tbody.appendChild(tr);
    }

    const trNo = document.createElement("tr");
    trNo.id = "amPcmaNoPeResults";
    trNo.hidden = true;

    const tdNo = document.createElement("td");
    tdNo.colSpan = 4;
    tdNo.className = "am-muted";
    tdNo.textContent = "No items match the selected PE filter.";
    trNo.appendChild(tdNo);
    tbody.appendChild(trNo);
  }

  el.pcmaTable.appendChild(thead);
  el.pcmaTable.appendChild(tbody);

  requestAnimationFrame(() => {
    applyPcmaPeFilter();
  });
}






/* =========================
   ADD: ACCEPTANCE TAB (DATE sheet)
   - Columns: PE | ID | PR | CA | DUE
   - Header: row 3 (index 2)
   ========================= */

function ensureAcceptancePanelMarkup() {
  const panel = document.querySelector('.am-panel[data-am-panel="acceptance"]');
  if (!panel) return;

  // Replace existing ACCEPTANCE content with a single table (same behavior as PCMA tab)
  panel.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "am-table-wrap";

  const table = document.createElement("table");
  table.className = "am-table";
  table.id = "amAcceptanceTable";

  wrap.appendChild(table);
  panel.appendChild(wrap);
}

function setAcceptanceStatus(msg) {
  if (!el.acceptanceStatus) return;
  el.acceptanceStatus.classList.remove("is-error");
  el.acceptanceStatus.textContent = msg;
}

function setAcceptanceError(msg) {
  if (el.acceptanceStatus) {
    el.acceptanceStatus.classList.add("is-error");
    el.acceptanceStatus.textContent = `ACCEPTANCE: ${msg}`;
    return;
  }
  alert(`ACCEPTANCE: ${msg}`);
}

function clearAcceptanceTable() {
  if (el.acceptanceTable) el.acceptanceTable.innerHTML = "";
}

function applyAcceptancePeFilter() {
  if (!el.acceptanceTable) return;

  const tbody = el.acceptanceTable.querySelector("tbody");
  if (!tbody) return;

  const filter = (state.acceptancePeFilter || "").toString().trim();
  let total = 0;
  let visible = 0;

  Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
    const pe = (tr.dataset.pe || "").toString().trim();
    if (!pe) return;
    total++;
    const show = !filter || pe === filter;
    tr.hidden = !show;
    if (show) visible++;
  });

  const noPeRow = tbody.querySelector("#amAcceptanceNoPeResults");
  if (noPeRow) {
    noPeRow.hidden = !(filter && total > 0 && visible === 0);
  }

  const suffix = filter ? ` (PE: ${filter})` : "";
  setAcceptanceStatus(`ACCEPTANCE: Showing ${visible} project(s) needing update${suffix}.`);
}

function parseSheetDate(v) {
  // Accepts date strings (e.g., "Jan 1, 2025") or numeric serials
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;

  const s = normalize(v);
  if (!s) return null;

  // Numeric serial (Google Sheets date serial)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 1000 && n < 100000) {
      const base = Date.UTC(1899, 11, 30); // Sheets serial day 0
      return new Date(base + n * 24 * 60 * 60 * 1000);
    }
  }

  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t);

  return null;
}

function monthsRemainingUntil(dueDate, nowDate) {
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) return null;
  const now = (nowDate instanceof Date && !Number.isNaN(nowDate.getTime())) ? nowDate : new Date();

  const diffMs = dueDate.getTime() - now.getTime();
  if (!Number.isFinite(diffMs)) return null;
  if (diffMs <= 0) return 0;

  const days = diffMs / (24 * 60 * 60 * 1000);
  // Month-like display: 1–3 months window; use ceil so "2.1 months" shows as "3 mo"
  return Math.ceil(days / 30);
}

function formatDueMo(mo) {
  if (mo === null) return "—";
  const n = Number(mo);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "0 mo";
  return `${n} mo`;
}

// ---- ACCEPTANCE DUE formatting: months+days (30-day month approximation) ----
function daysDiffCalendar(targetDate, baseDate) {
  if (!(targetDate instanceof Date) || Number.isNaN(targetDate.getTime())) return null;

  const base = (baseDate instanceof Date && !Number.isNaN(baseDate.getTime())) ? baseDate : new Date();

  // Compare using local-midnight dates to avoid partial-day jitter.
  const a = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const b = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const msDay = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / msDay); // signed integer days
}

function formatDueMd(daysDiff) {
  if (daysDiff === null) return "—";
  const n = Number(daysDiff);
  if (!Number.isFinite(n)) return "—";

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(n));

  if (abs === 0) return "0d";

  const m = Math.floor(abs / 30);
  const d = abs % 30;

  let out = "";
  if (m > 0) out += `${m}m`;
  if (d > 0) out += `${d}d`;
  if (!out) out = "0d";

  return sign + out;
}


async function loadAcceptanceTab() {
  ensureAcceptancePanelMarkup();
  initDomRefs();

  clearAcceptanceTable();
  setAcceptanceStatus("ACCEPTANCE: Loading DATE…");

  const values = await fetchSheetValues(SHEET_DATE, "DATE", 3);

  const headerRowIndex = 2;  // ✅ 3rd row (0-based)
  const dataStartIndex = 3;

  const headerRow = values[headerRowIndex] || [];
  const headers = headerRow.map(normalize);

  const idxPE = findHeaderIndex(headers, [
    "PROJECT ENGINEER",
    "PE",
    "PROJECT ENGINEER (PE)",
    "PROJECT ENGINEER NAME",
    "PROJ. ENGINEER",
  ]);

  const idxID = findHeaderIndex(headers, ["ID", "CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);

  const idxPR = findHeaderIndex(headers, [
    "Punchlist Report (After 1Y Defects Liability Period)",
    "PUNCHLIST REPORT (AFTER 1Y DEFECTS LIABILITY PERIOD)",
    "Punchlist Report (After One-Year Defects Liability Period)",
    "PUNCHLIST REPORT (AFTER ONE-YEAR DEFECTS LIABILITY PERIOD)",
    "PUNCHLIST REPORT",
    "PUNCHLIST",
  ]);

  const idxCA = findHeaderIndex(headers, ["Date of CA", "DATE OF CA", "CA DATE"]);

  const idxCompletion = findHeaderIndex(headers, ["Date of Completion", "DATE OF COMPLETION", "COMPLETION DATE"]);

  if (idxPE === -1) throw new Error('Header "PROJECT ENGINEER" not found in DATE (3rd row).');
  if (idxID === -1) throw new Error('Header "ID/Contract ID" not found in DATE (3rd row).');
  if (idxPR === -1) throw new Error('Header "Punchlist Report (After 1Y/One-Year Defects Liability Period)" not found in DATE (3rd row).');
  if (idxCA === -1) throw new Error('Header "Date of CA" not found in DATE (3rd row).');
  if (idxCompletion === -1) throw new Error('Header "Date of Completion" not found in DATE (3rd row).');

  const now = new Date();
  const dataRows = values.slice(dataStartIndex);
  const rowsForDisplay = [];

  for (const row of dataRows) {
    const pe = normalize(row[idxPE]);
    const id = normalize(row[idxID]);
    if (!pe || !id) continue;

    const prOk = !isEmptyCell(row[idxPR]);
    const caOk = !isEmptyCell(row[idxCA]);

    // If CA has a value (✓), hide it (exclude from Acceptance tab)
    if (caOk) continue;

    // DUE: (Date of Completion + 1 year) relative to TODAY(), shown as XmYd (e.g., 2m5d)
    const compDate = parseSheetDate(row[idxCompletion]);

    // ✅ If no Date of Completion value, do not show in ACCEPTANCE
    if (!compDate) continue;

    const dueDate = new Date(compDate.getTime());
    dueDate.setFullYear(dueDate.getFullYear() + 1);

    const dueDays = daysDiffCalendar(dueDate, now);

    // ✅ Hide if more than 3 months away (only applies when still not due yet)
    if (dueDays !== null && dueDays > 90) continue;

    const dueText = formatDueMd(dueDays);
    const dueOverdue = (dueDays !== null && dueDays < 0);

    rowsForDisplay.push({
      pe,
      id,
      prOk,
      caOk: false, // CA ✓ rows are hidden earlier
      dueDays,
      dueText,
      dueOverdue,
    });
  }

  rowsForDisplay.sort((a, b) => {
    const ap = a.pe.toLowerCase();
    const bp = b.pe.toLowerCase();
    if (ap < bp) return -1;
    if (ap > bp) return 1;
    const ai = a.id.toLowerCase();
    const bi = b.id.toLowerCase();
    return ai.localeCompare(bi);
  });

  renderAcceptanceTable(rowsForDisplay);
  setAcceptanceStatus(`ACCEPTANCE: Showing ${rowsForDisplay.length} project(s) needing update.`);
}

function renderAcceptanceTable(rows) {
  if (!el.acceptanceTable) return;

  el.acceptanceTable.innerHTML = "";
  el.acceptanceTable.dataset.totalCount = String(rows.length);

  const thead = document.createElement("thead");
  const trH = document.createElement("tr");

  // PE dropdown
  const thPe = document.createElement("th");
  const peHead = document.createElement("div");
  peHead.className = "am-pe-head";

  const peSelect = document.createElement("select");
  peSelect.className = "am-pe-filter";
  peSelect.id = "amAcceptancePeFilter";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All";
  peSelect.appendChild(optAll);

  const uniqPE = Array.from(new Set(rows.map((r) => r.pe))).sort((a, b) => a.localeCompare(b));
  for (const pe of uniqPE) {
    const opt = document.createElement("option");
    opt.value = pe;
    opt.textContent = pe;
    peSelect.appendChild(opt);
  }

  if (state.acceptancePeFilter && uniqPE.includes(state.acceptancePeFilter)) peSelect.value = state.acceptancePeFilter;
  else state.acceptancePeFilter = "";

  peSelect.addEventListener("change", () => {
    state.acceptancePeFilter = peSelect.value;
    applyAcceptancePeFilter();
  });

  peHead.appendChild(peSelect);
  thPe.appendChild(peHead);
  el.acceptancePeFilter = peSelect;

  // ID
  const thId = document.createElement("th");
  thId.textContent = "ID";

  // PR
  const thPr = document.createElement("th");
  thPr.textContent = "PR";
  thPr.className = "am-td-center";

  // CA
  const thCa = document.createElement("th");
  thCa.textContent = "CA";
  thCa.className = "am-td-center";

  // DUE
  const thDue = document.createElement("th");
  thDue.textContent = "DUE";
  thDue.className = "am-td-center";

  trH.appendChild(thPe);
  trH.appendChild(thId);
  trH.appendChild(thPr);
  trH.appendChild(thCa);
  trH.appendChild(thDue);
  thead.appendChild(trH);

  const tbody = document.createElement("tbody");

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "am-muted";
    td.textContent = "No items to amend.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.dataset.pe = r.pe;

      const tdPe = document.createElement("td");
      tdPe.textContent = r.pe;

      const tdId = document.createElement("td");
      const idBtn = document.createElement("button");
      idBtn.type = "button";
      idBtn.className = "am-cid-link";
      idBtn.textContent = r.id;
      idBtn.title = "Open Project Documentation";
      idBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof window.openProjectDocs === "function") return window.openProjectDocs(r.id);
        if (typeof window.openProjectDocsOverlay === "function") return window.openProjectDocsOverlay(r.id);

        try {
          const url = `${location.origin}${location.pathname}?contractId=${encodeURIComponent(r.id)}&pd=1`;
          window.open(url, "_blank");
        } catch (_) {}
      });
      tdId.appendChild(idBtn);

      const tdPr = document.createElement("td");
      tdPr.className = "am-td-center";
      tdPr.appendChild(createCheck(!!r.prOk));

      const tdCa = document.createElement("td");
      tdCa.className = "am-td-center";
      tdCa.appendChild(createCheck(!!r.caOk)); // will be ✕ (CA missing)

      const tdDue = document.createElement("td");
      tdDue.className = "am-td-center";

      const dueSpan = document.createElement("span");
      const dueNum = (typeof r.dueDays === "number" && Number.isFinite(r.dueDays)) ? r.dueDays : null;
      dueSpan.className = "am-due-val" + (dueNum === null ? "" : (dueNum < 0 ? " due-neg" : " due-pos"));
      dueSpan.textContent = normalize(r.dueText);

      tdDue.appendChild(dueSpan);

      tr.appendChild(tdPe);
      tr.appendChild(tdId);
      tr.appendChild(tdPr);
      tr.appendChild(tdCa);
      tr.appendChild(tdDue);
      tbody.appendChild(tr);
    }

    const trNo = document.createElement("tr");
    trNo.id = "amAcceptanceNoPeResults";
    trNo.hidden = true;

    const tdNo = document.createElement("td");
    tdNo.colSpan = 5;
    tdNo.className = "am-muted";
    tdNo.textContent = "No items match the selected PE filter.";
    trNo.appendChild(tdNo);
    tbody.appendChild(trNo);
  }

  el.acceptanceTable.appendChild(thead);
  el.acceptanceTable.appendChild(tbody);

  requestAnimationFrame(() => {
    applyAcceptancePeFilter();
  });
}



function escapeHtml(s) {
  return (s ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Collect ONLY visible rows from ACCOMPLISHMENT table (PE filter already applied)
function collectVisibleAccRows() {
  if (!el.accTable) return [];
  const tbody = el.accTable.querySelector("tbody");
  if (!tbody) return [];

  const out = [];
  const trs = Array.from(tbody.querySelectorAll("tr"))
    .filter(tr => (tr.dataset && tr.dataset.pe) && !tr.hidden);

  for (const tr of trs) {
    const tds = tr.children;

    const pe = normalize(tds[0]?.textContent);
    const cid =
      normalize(tr.querySelector(".am-cid-link")?.textContent) ||
      normalize(tds[1]?.textContent);

    if (!pe || !cid) continue;
    out.push({ pe, cid });
  }
  return out;
}

// Build ContractID -> { act, pcma, remarks } from PCMA sheet using LATEST month columns
async function buildLatestMonthValueMapFromPcmaSheet() {
  const values = await fetchSheetValues(SHEET_ACCOMPLISHMENT, "PCMA"); // PCMA sheet
  const headerRow = values[2] || [];        // 3rd row header
  const headers = headerRow.map(normalize);

  const idxCID = findHeaderIndex(headers, ["CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);
  if (idxCID === -1) throw new Error('PCMA: Header "Contract ID" not found (3rd row).');

  const monthPair = pickLatestMonthPair(headers);
  if (!monthPair) throw new Error("PCMA: No month columns found (e.g., '2025 November' and '2025 November PCMA').");

  const actualIdx  = monthPair.actualIdx;
  const pcmaIdx    = monthPair.pcmaIdx;
  const remarksIdx = pickRemarksIndexForMonth(headers, monthPair.monthKey);

  const map = new Map();

  for (const row of values.slice(3)) {
    const cid = normalize(row[idxCID]);
    if (!cid) continue;

    map.set(cid, {
      act: normalize(actualIdx >= 0 ? row[actualIdx] : ""),
      pcma: normalize(pcmaIdx >= 0 ? row[pcmaIdx] : ""),
      remarks: normalize(remarksIdx >= 0 ? row[remarksIdx] : ""),
    });
  }

  return { map, monthLabel: monthPair.monthLabel };
}

// Build ContractID -> Project Name map from APP (prefer header "Project Name", fallback column E)
async function buildProjectNameMapFromApp() {
  const values = await fetchSheetValues(SHEET_APP, "APP", 2); // APP header is 2nd row
  const headerRow = values[1] || [];
  const headers = headerRow.map(normalize);

  const idxID = findHeaderIndex(headers, ["ID", "CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);
  if (idxID === -1) throw new Error('APP: Header "ID/Contract ID" not found (2nd row).');

  let idxProjectName = findHeaderIndex(headers, ["PROJECT NAME"]);
  if (idxProjectName === -1) idxProjectName = 4; // Column E fallback

  const map = new Map();
  for (const row of values.slice(2)) {
    const id = normalize(row[idxID]);
    if (!id) continue;
    if (!map.has(id)) map.set(id, normalize(row[idxProjectName]));
  }
  return map;
}

function makePrintHtml(rows, meta) {
  const title = "AMEND – ACCOMPLISHMENT (VISIBLE ROWS)";
  const generatedAt = meta?.generatedAt || "";
  const peFilter = meta?.peFilter ? `PE Filter: ${escapeHtml(meta.peFilter)}` : "PE Filter: All";
  const monthLabel = meta?.monthLabel ? ` | Month: ${escapeHtml(meta.monthLabel)}` : "";
  const total = rows.length;

  const bodyRows = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.pe)}</td>
      <td>${escapeHtml(r.cid)}</td>
      <td>${escapeHtml(r.projectName || "")}</td>
      <td class="c">${escapeHtml(r.act || "-")}</td>
      <td class="c">${escapeHtml(r.pcma || "-")}</td>
      <td>${escapeHtml(r.remarks || "-")}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color:#000; }
    h1 { margin:0 0 4mm 0; font-size:14pt; }
    .meta { margin:0 0 3mm 0; font-size:9pt; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #000; padding:3px 4px; vertical-align:top; }
    th { background:#f2f2f2; text-align:center; font-weight:700; }
    td.c { text-align:center; width:18mm; }
    td:nth-child(1), td:nth-child(2) { white-space:nowrap; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${escapeHtml(generatedAt)} | ${peFilter}${monthLabel} | Total: ${total}</div>

  <table>
    <thead>
      <tr>
        <th>PROJECT ENGINEER</th>
        <th>CONTRACT ID</th>
        <th>PROJECT NAME</th>
        <th>ACT</th>
        <th>PCMA</th>
        <th>REMARKS</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>`;
}

async function printA4LandscapeFromVisible() {
  // Require ACCOMPLISHMENT tab
  const active = getActiveTabKey();
  if (active !== "accomplishment") {
    alert('Go to the "ACCOMPLISHMENT" tab first, then click Print A4.');
    return;
  }

  // Ensure latest filter state applied
  try { applyPeFilter(); } catch (_) {}

  const visible = collectVisibleAccRows();
  if (!visible.length) {
    alert("No visible rows to print.");
    return;
  }

  // Open popup first (avoid popup blocker)
  const w = window.open("", "_blank", "width=1200,height=800");
  if (!w) {
    alert("Pop-up blocked. Please allow pop-ups for this site to print.");
    return;
  }
  w.document.write("<!doctype html><html><head><title>Preparing…</title></head><body>Preparing print layout…</body></html>");
  w.document.close();

  // Build maps
  let pcmaMap = new Map();
  let monthLabel = "";
  try {
    const r = await buildLatestMonthValueMapFromPcmaSheet();
    pcmaMap = r.map;
    monthLabel = r.monthLabel || "";
  } catch (e) {
    console.warn(e);
  }

  let nameMap = new Map();
  try {
    nameMap = await buildProjectNameMapFromApp();
  } catch (e) {
    console.warn(e);
  }

  const rows = visible.map(v => {
    const m = pcmaMap.get(v.cid) || {};
    return {
      pe: v.pe,
      cid: v.cid,
      projectName: nameMap.get(v.cid) || "",
      act: m.act || "",
      pcma: m.pcma || "",
      remarks: m.remarks || "",
    };
  });

  const now = new Date();
  const generatedAt = now.toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  const html = makePrintHtml(rows, {
    generatedAt,
    peFilter: state.peFilter || "",
    monthLabel,
  });

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();

  w.onload = () => { try { w.print(); } catch (_) {} };
  setTimeout(() => { try { w.print(); } catch (_) {} }, 500);
}

// Auto-add Print button beside Close in the AMEND header
function ensurePrintButton() {
  if (!el.topBar) return;

  const existing = document.getElementById("amPrintBtn");
  if (existing) return;

  const btn = document.createElement("button");
  btn.id = "amPrintBtn";
  btn.type = "button";
  btn.className = "am-btn";
  btn.textContent = "Print A4";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    printA4LandscapeFromVisible();
  });

  if (el.closeBtn && el.closeBtn.parentElement) {
    el.closeBtn.parentElement.insertBefore(btn, el.closeBtn);
  } else {
    el.topBar.appendChild(btn);
  }

  el.printBtn = btn;
}








  // ---- Wiring ----
  function wireOverlayClose() {
    if (el.closeBtn) el.closeBtn.addEventListener("click", closeAmend);

    // Click outside the box closes
    if (el.overlay) {
      el.overlay.addEventListener("click", (e) => {
        if (e.target === el.overlay) closeAmend();
      });
    }

    // Escape closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.overlay && !el.overlay.hidden) closeAmend();
    });
  }

  function wireOpenButton() {
    if (!el.btnOpen) return;
    el.btnOpen.addEventListener("click", openAmend);
  }

function getActiveTabKey() {
    const b = document.querySelector('.am-tab.is-active[data-am-tab]');
    if (b && b.dataset && b.dataset.amTab) return b.dataset.amTab;

    const p = document.querySelector('.am-panel.is-active[data-am-panel]');
    if (p && p.dataset && p.dataset.amPanel) return p.dataset.amPanel;

    return "accomplishment";
  }

  function callExternalLoader(key) {
    const cap = (key || "").charAt(0).toUpperCase() + (key || "").slice(1);
    const candidates = [
      `load${cap}Tab`,
      `load${cap}`,
      `amendLoad${cap}`,
      `reload${cap}`,
      `reload${cap}Tab`,
    ];
    for (const name of candidates) {
      const fn = window[name];
      if (typeof fn === "function") return Promise.resolve(fn());
    }
    return null;
  }

  function reloadForTab(key) {
    // Let other scripts (Billing/Document/Acceptance) hook into the same Reload button
    try {
      document.dispatchEvent(new CustomEvent("amend:reload", { detail: { tab: key } }));
    } catch (_) {}

    if (key === "accomplishment") {
      return loadAccomplishment().catch((err) =>
        setAccError(err && err.message ? err.message : String(err))
      );
    }

    if (key === "pcma") {
      return loadPcmaTab().catch((err) =>
        setPcmaError(err && err.message ? err.message : String(err))
      );
    }

    if (key === "acceptance") {
      return loadAcceptanceTab().catch((err) =>
        setAcceptanceError(err && err.message ? err.message : String(err))
      );
    }

    const ext = callExternalLoader(key);
    if (ext) {
      return ext.catch((err) => alert((err && err.message) ? err.message : String(err)));
    }

    // Fallback: refresh the two implemented data tabs so Reload always does something
    if (el.accTable) loadAccomplishment().catch(() => {});
    if (el.pcmaTable) loadPcmaTab().catch(() => {});
  }

  function wireReload() {
    const buttons = Array.from(
      document.querySelectorAll('[data-am-reload], button[id$="Reload"], a[id$="Reload"]')
    );
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const key = (btn.dataset && btn.dataset.amReload) ? btn.dataset.amReload : getActiveTabKey();
        reloadForTab(key);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDomRefs();
	ensurePrintButton();
    wireTabs();
    wireOverlayClose();
    wireOpenButton();
    wireReload(); // works for all 5 tabs now (any button ending with "Reload" or with data-am-reload)

    window.addEventListener("resize", () => {
      if (el.accTable) applyStickyHeaderOffsets(el.accTable);
      if (el.pcmaTable) applyStickyHeaderOffsets(el.pcmaTable);
      if (el.acceptanceTable) applyStickyHeaderOffsets(el.acceptanceTable);
    });
  });
})();
