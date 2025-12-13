/* ===========================
   AMEND WINDOW (amend.js)
   - ACCOMPLISHMENT tab:
     Shows ONLY the LAST month columns (Actual + PCMA) and lists rows that are missing.
   =========================== */
(function () {
  "use strict";

  // ---- CONFIG ----
  const SHEET_ID = "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
  const RANGE_NAME = "PCMA"; // sheet/tab name
  const RANGE_A1 = `${RANGE_NAME}!A1:ZZZ`; // wide enough for month columns
  const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

  function getApiKey() {
    // Do NOT hardcode your API key in this file.
    // Put it in window.GOOGLE_API_KEY (recommended via config.js).
    return (window.GOOGLE_API_KEY || window.GOOGLE_API_KEY_AMEND || "").toString().trim();
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
      btn.addEventListener("click", () => activateTab(btn.dataset.amTab));
    });
  }

  // ---- Helpers: Sheet parsing ----
  const MONTHS = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  function normalize(s) {
    return (s ?? "").toString().trim();
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
    peFilter: "", // selected PE ("" = All)
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
  async function fetchRangeValues() {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("Missing API key. Set window.GOOGLE_API_KEY before loading amend.js.");
    }

    const url =
      `${SHEETS_API}/${encodeURIComponent(SHEET_ID)}/values/` +
      `${encodeURIComponent(RANGE_A1)}?majorDimension=ROWS&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }

    if (!res.ok) {
      const msg = (json && json.error && json.error.message) ? json.error.message : text;
      throw new Error(`Failed to load PCMA. ${msg}`);
    }

    const values = (json && json.values) ? json.values : [];
    if (!Array.isArray(values) || values.length < 3) {
      throw new Error("PCMA sheet returned no data or missing the 3rd-row header.");
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

    const values = await fetchRangeValues();

    // 3rd row is header
    const headerRow = values[2] || [];
    const headers = headerRow.map(normalize);

    const idxPE = findHeaderIndex(headers, ["PE", "PROJECT ENGINEER", "PROJECT ENGINEER (PE)"]);
    const idxCID = findHeaderIndex(headers, ["CONTRACT ID", "CID", "CONTRACTID", "CONTRACT"]);

    if (idxPE === -1) throw new Error('Header "PE" not found in PCMA (3rd row).');
    if (idxCID === -1) throw new Error('Header "Contract ID" not found in PCMA (3rd row).');

    const monthPair = pickLatestMonthPair(headers);
    if (!monthPair) throw new Error("No month columns found (e.g., '2025 November' and '2025 November PCMA').");

    const monthLabel = monthPair.monthLabel;
    const actualIdx = monthPair.actualIdx;
    const pcmaIdx = monthPair.pcmaIdx;

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

      // If ACCOMP is 100% => actualOk should be true
      // We treat "ACCOMP." column if available; otherwise we fall back to actual cell presence.
      const idxAccomp = findHeaderIndex(headers, ["ACCOMP.", "ACCOMP", "ACCOMPLISHMENT"]);
      let accompPct = null;
      if (idxAccomp !== -1) accompPct = parseAccompPercent(row[idxAccomp]);

      const actualOk = (accompPct !== null && accompPct >= 100) ? true : !isEmptyCell(actualVal);
      const pcmaOk = !isEmptyCell(pcmaVal);

      // If both checked, hide it (do not include)
      if (actualOk && pcmaOk) continue;

      rowsForDisplay.push({ pe, cid, actualOk, pcmaOk });
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

  function renderAccomplishmentTable(monthLabel, rows) {
    if (!el.accTable) return;
    el.accTable.innerHTML = "";
    el.accTable.dataset.monthLabel = monthLabel;
    el.accTable.dataset.totalCount = String(rows.length);

const thead = document.createElement("thead");
    const tr1 = document.createElement("tr");
    const tr2 = document.createElement("tr");

    const thPe = document.createElement("th");
    thPe.rowSpan = 2;

    // PE dropdown (filter)
    const peHead = document.createElement("div");
    peHead.className = "am-pe-head";

    const peLabel = document.createElement("div");
    peLabel.textContent = "PE";

    const peSelect = document.createElement("select");
    peSelect.className = "am-pe-filter";
    peSelect.id = "amPeFilter";

    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All";
    peSelect.appendChild(optAll);

    // Options: unique PEs from rows (ascending)
    const uniqPE = Array.from(new Set(rows.map((r) => r.pe))).sort((a, b) => {
      const ap = a.toLowerCase();
      const bp = b.toLowerCase();
      if (ap < bp) return -1;
      if (ap > bp) return 1;
      return 0;
    });

    uniqPE.forEach((pe) => {
      const opt = document.createElement("option");
      opt.value = pe;
      opt.textContent = pe;
      peSelect.appendChild(opt);
    });

    // Preserve previous selection (if still available)
    if (state.peFilter && uniqPE.includes(state.peFilter)) peSelect.value = state.peFilter;
    else { state.peFilter = ""; peSelect.value = ""; }

    peSelect.addEventListener("change", () => {
      state.peFilter = peSelect.value;
      applyPeFilter();
    });

    peHead.appendChild(peLabel);
    peHead.appendChild(peSelect);
    thPe.appendChild(peHead);

    el.peFilter = peSelect;

    const thCid = document.createElement("th");
    thCid.textContent = "Contract ID";
    thCid.rowSpan = 2;

    const thMonth = document.createElement("th");
    thMonth.textContent = monthLabel;
    thMonth.colSpan = 2;
    thMonth.className = "am-td-center";

    const thActual = document.createElement("th");
    thActual.textContent = "ACTUAL";
    thActual.className = "am-td-center";

    const thPcma = document.createElement("th");
    thPcma.textContent = "PCMA";
    thPcma.className = "am-td-center";

    tr1.appendChild(thPe);
    tr1.appendChild(thCid);
    tr1.appendChild(thMonth);

    tr2.appendChild(thActual);
    tr2.appendChild(thPcma);

    thead.appendChild(tr1);
    thead.appendChild(tr2);

    const tbody = document.createElement("tbody");

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
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
    window.openProjectDocs(r.cid); // keeps Amend open
  } else {
    alert('ProjectDocs is not loaded. Make sure "ProjectDocs.js" is included before "amend.js".');
  }
});

tdCid.appendChild(cidBtn);



        const tdA = document.createElement("td");
        tdA.className = "am-td-center";
        tdA.appendChild(createCheck(r.actualOk));

        const tdP = document.createElement("td");
        tdP.className = "am-td-center";
        tdP.appendChild(createCheck(r.pcmaOk));

        tr.appendChild(tdPe);
        tr.appendChild(tdCid);
        tr.appendChild(tdA);
        tr.appendChild(tdP);

        tbody.appendChild(tr);
      }
    }

    // If the user filters by PE and nothing matches, show a helper row
    if (rows.length) {
      const trNo = document.createElement("tr");
      trNo.id = "amNoPeResults";
      trNo.hidden = true;

      const tdNo = document.createElement("td");
      tdNo.colSpan = 4;
      tdNo.className = "am-muted";
      tdNo.textContent = "No items for the selected PE.";
      trNo.appendChild(tdNo);

      tbody.appendChild(trNo);
    }

    el.accTable.appendChild(thead);
    el.accTable.appendChild(tbody);

    // Freeze header rows correctly + apply current PE filter
    requestAnimationFrame(() => {
      applyStickyHeaderOffsets(el.accTable);
      applyPeFilter();
    });
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

  function wireReload() {
    if (!el.accReload) return;
    el.accReload.addEventListener("click", () => {
      loadAccomplishment().catch((err) => setAccError(err && err.message ? err.message : String(err)));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDomRefs();
    wireTabs();
    wireOverlayClose();
    wireOpenButton();
    wireReload();

    window.addEventListener("resize", () => {
      if (el.accTable) applyStickyHeaderOffsets(el.accTable);
    });
  });
})();
