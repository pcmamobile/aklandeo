// search.js
(function () {
  // create global namespace
  const PCMA = (window.PCMA = window.PCMA || {});

  // CONFIG
  PCMA.config = {
    SHEET_ID: "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8",
    RANGE: "APP",
    API_KEY: "AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8",
    LOGO_FALLBACK:
      "https://lh3.googleusercontent.com/d/1VanVX82ANGfKA8jcGZL8cVDQh4EuN8-r=s800?authuser=0",
  };

  // ELEMENTS
  const el = {
    grid: document.getElementById("grid"),
    resultInfo: document.getElementById("resultInfo"),
    filtersBox: document.getElementById("filters"),
    toggleFiltersBtn: document.getElementById("toggleFilters"),

    filterCombo: document.getElementById("filterCombo"),
    filterYear: document.getElementById("filterYear"),
    filterStatus: document.getElementById("filterStatus"),
    filterContractor: document.getElementById("filterContractor"),
    filterEngineer: document.getElementById("filterEngineer"),
    applyFilterBtn: document.getElementById("applyFilter"),
    clearFilterBtn: document.getElementById("clearFilter"),
    moreFiltersBox: document.getElementById("moreFilters"),
    toggleMoreFiltersBtn: document.getElementById("toggleMoreFilters"),
  };

// Global Projector Mode button (beside Filter)
(function(){
  const btn = document.getElementById("presentGlobal");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // Prefer the last clicked row; fall back to the first visible row
    const list = PCMA.state.lastRenderedRows || [];
    const row = PCMA.state.lastRowForProjector || list[0];

    if (!row) {
      alert("No project selected yet. Click a project first or apply a filter.");
      return;
    }
    if (PCMA.openPresentation) PCMA.openPresentation(row);
  });
})();


  // STATE
  PCMA.state = {
    headers: [],
    records: [],
    lastRenderedRows: [],
  };

  // small helpers we want everywhere
  PCMA.helpers = {
    isValidUrl(u) {
      try {
        const x = new URL(u);
        return x.protocol === "http:" || x.protocol === "https:";
      } catch {
        return false;
      }
    },
    toPct(val, fallback = 0) {
      if (val == null) return fallback;
      const m = String(val).replace(",", ".").match(/-?\d+(\.\d+)?/);
      return m ? parseFloat(m[0]) : fallback;
    },
    parseMoney(v) {
      if (v == null) return null;
      const s = String(v).replace(/[^0-9.\-]/g, "");
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    },
    fmtPHP(n) {
      try {
        return (
          "₱ " +
          Number(n).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } catch {
        return "₱ " + n;
      }
    },
  };

  // expose elements too
  PCMA.el = el;

  // ==== DATA LOAD ====
  async function loadData() {
    const { SHEET_ID, RANGE, API_KEY } = PCMA.config;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.values || !data.values.length) throw new Error("No data");

      // find header row
      const keyHints = ["contract id", "project name", "location", "status"];
      let headerRowIndex = 0;
      for (let i = 0; i < data.values.length; i++) {
        const row = (data.values[i] || []).map((c) =>
          String(c || "").trim().toLowerCase()
        );
        const hit = keyHints.some((h) => row.some((cell) => cell.includes(h)));
        if (hit) {
          headerRowIndex = i;
          break;
        }
      }

      PCMA.state.headers = (data.values[headerRowIndex] || []).map((h) =>
        (h || "").trim().toLowerCase().replace(/[:]+/g, "")
      );
      PCMA.state.records = data.values.slice(headerRowIndex + 1);

      populateFilterOptions();
      restoreFilterState();

      const all = PCMA.state.records.filter((r) => r && r.join("").trim());
      renderGrid(all);
      el.grid.classList.remove("hidden");
      el.resultInfo.textContent = `${all.length} results`;
      el.resultInfo.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      el.grid.classList.remove("hidden");
      el.grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#b91c1c;">Failed to load data.</div>';
    }
  }

  // ==== FILTERS ====
  function populateFilterOptions() {
    const { headers, records } = PCMA.state;
    const years = new Set(),
      contractors = new Set(),
      engineers = new Set(),
      statuses = new Set();
    const colYear = headers.findIndex((h) => h.includes("year"));
    const colContractor = headers.findIndex((h) => h.includes("contractor"));
    const colEngineer = headers.findIndex((h) => h.includes("project engineer"));
    const colStatus = headers.findIndex((h) => h.includes("status"));
    records.forEach((r) => {
      if (colYear >= 0 && r[colYear]) years.add(r[colYear]);
      if (colContractor >= 0 && r[colContractor]) contractors.add(r[colContractor]);
      if (colEngineer >= 0 && r[colEngineer]) engineers.add(r[colEngineer]);
      if (colStatus >= 0 && r[colStatus]) statuses.add(String(r[colStatus]).trim());
    });

    el.filterYear.innerHTML =
      '<option value="">All</option>' +
      [...years].sort().map((y) => `<option value="${y}">${y}</option>`).join("");
    el.filterContractor.innerHTML =
      '<option value="">All</option>' +
      [...contractors].sort().map((c) => `<option value="${c}">${c}</option>`).join("");
    el.filterEngineer.innerHTML =
      '<option value="">All</option>' +
      [...engineers].sort().map((e) => `<option value="${e}">${e}</option>`).join("");
    el.filterStatus.innerHTML =
      '<option value="">All</option>' +
      [...statuses].sort().map((s) => `<option value="${s}">${s}</option>`).join("");
  }

  function saveFilterState() {
    const s = {
      combo: el.filterCombo.value || "",
      year: el.filterYear.value || "",
      status: el.filterStatus.value || "",
      contractor: el.filterContractor.value || "",
      engineer: el.filterEngineer.value || "",
      more: !el.moreFiltersBox.classList.contains("hidden"),
    };
    localStorage.setItem("pcma_filters", JSON.stringify(s));
  }

  function restoreFilterState() {
    try {
      const raw = localStorage.getItem("pcma_filters");
      if (!raw) return;
      const s = JSON.parse(raw);
      el.filterCombo.value = s.combo || "";
      el.filterYear.value = s.year || "";
      el.filterStatus.value = s.status || "";
      el.filterContractor.value = s.contractor || "";
      el.filterEngineer.value = s.engineer || "";
      if (s.more) el.moreFiltersBox.classList.remove("hidden");
    } catch {}
  }

  function filterData(text, year, engineer, contractor, status) {
    const { headers, records } = PCMA.state;
    const q = (text || "").toLowerCase().trim();
    const idx = {
      cid: headers.findIndex((h) => h.includes("contract id")),
      project: headers.findIndex((h) => h.includes("project name")),
      location: headers.findIndex((h) => h.includes("location")),
      pe: headers.findIndex((h) => h.includes("project engineer")),
      pi: headers.findIndex((h) => h.includes("project inspector")),
      re: headers.findIndex((h) => h.includes("resident engineer")),
      qe: headers.findIndex((h) => h.includes("quantity engineer")),
      me: headers.findIndex((h) => h.includes("materials engineer")),
      contractor: headers.findIndex((h) => h.includes("contractor")),
      status: headers.findIndex((h) => h.includes("status")),
      year: headers.findIndex((h) => h.includes("year")),
    };

    return records.filter((r) => {
      if (!r || !r.join("").trim()) return false;
      let textOK = true;
      if (q) {
        textOK = [
          idx.cid,
          idx.project,
          idx.location,
          idx.pe,
          idx.pi,
          idx.re,
          idx.qe,
          idx.me,
          idx.contractor,
          idx.status,
          idx.year,
        ].some((ci) => ci >= 0 && String(r[ci] || "").toLowerCase().includes(q));
      }
      if (!textOK) return false;
      if (year) {
        if (!(idx.year >= 0) || String(r[idx.year] || "").toLowerCase() !== year)
          return false;
      }
      if (engineer) {
        if (!(idx.pe >= 0) || String(r[idx.pe] || "").toLowerCase() !== engineer)
          return false;
      }
      if (contractor) {
        if (
          !(idx.contractor >= 0) ||
          String(r[idx.contractor] || "").toLowerCase() !== contractor
        )
          return false;
      }
      if (status) {
        if (!(idx.status >= 0) || String(r[idx.status] || "").toLowerCase() !== status)
          return false;
      }
      return true;
    });
  }
  PCMA.filterData = filterData;

  // ==== GRID RENDER ====
  function renderGrid(rows) {
    const { headers } = PCMA.state;
    PCMA.state.lastRenderedRows = rows.slice();
    el.grid.innerHTML = "";

    const colContractID = headers.findIndex((h) => h.includes("contract id"));
    const colProjectName = headers.findIndex((h) => h.includes("project name"));
    const colStatus = headers.findIndex((h) => h.includes("status"));
    const colEngineer = headers.findIndex((h) => h.includes("project engineer"));
    const colLocation = headers.findIndex((h) => h.includes("location"));
    const colImage1 = headers.findIndex((h) => h.includes("image 1"));
    const q = (el.filterCombo.value || "").trim().toLowerCase();

    if (!rows.length) {
      el.grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#777;">No data found.</div>';
      return;
    }

    rows.forEach((r, idx) => {
      if (!r || !r.join("").trim()) return;

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.rowIndex = String(idx);

      const img = document.createElement("img");
      const link = colImage1 >= 0 && r[colImage1] ? String(r[colImage1]).trim() : "";
      img.src = link || PCMA.config.LOGO_FALLBACK;
      img.className = "card-thumb";
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = () => {
        img.src = PCMA.config.LOGO_FALLBACK;
      };
      card.appendChild(img);

      const content = document.createElement("div");
      content.className = "card-content";

      // top line
      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "baseline";

      const cidVal =
        colContractID >= 0 && r[colContractID] ? String(r[colContractID]) : "";
      const engVal = colEngineer >= 0 && r[colEngineer] ? String(r[colEngineer]) : "";

      let cidHtml = cidVal;
      if (q && cidVal.toLowerCase().includes(q)) {
        cidHtml = cidVal.replace(new RegExp(q, "ig"), (m) => `<mark>${m}</mark>`);
      }
      top.innerHTML = `<span class="contract-id">${cidHtml}</span><span class="engineer-name">${engVal}</span>`;
      content.appendChild(top);

      const projVal =
        colProjectName >= 0 && r[colProjectName] ? String(r[colProjectName]) : "";
      let projHtml = projVal;
      if (q && projVal.toLowerCase().includes(q)) {
        projHtml = projVal.replace(new RegExp(q, "ig"), (m) => `<mark>${m}</mark>`);
      }
      const projDiv = document.createElement("div");
      projDiv.innerHTML = projHtml;
      projDiv.style.marginTop = "2px";
      content.appendChild(projDiv);

      if (colLocation >= 0 && r[colLocation]) {
        const locVal = String(r[colLocation]);
        let locHtml = locVal;
        if (q && locVal.toLowerCase().includes(q)) {
          locHtml = locVal.replace(new RegExp(q, "ig"), (m) => `<mark>${m}</mark>`);
        }
        const locDiv = document.createElement("div");
        locDiv.innerHTML = locHtml;
        locDiv.style.opacity = 0.85;
        content.appendChild(locDiv);
      }

      const statusDiv = document.createElement("div");
      const statusText =
        (colStatus >= 0 && r[colStatus] ? String(r[colStatus]) : "").trim();
      const tt = statusText.toLowerCase();
      let bg = "#777";
      if (tt === "completed (pcma)" || tt === "pcma") bg = "#2563eb";
      else if (tt === "completed") bg = "#16a34a";
      else if (tt === "on-going") bg = "#f97316";
      else if (tt === "100%") bg = "#14b8a6";
      statusDiv.innerHTML = `<span class="status" style="background:${bg}">${statusText}</span>`;
      content.appendChild(statusDiv);

      card.appendChild(content);


// click -> open modal (modal.js will supply this)
card.addEventListener("click", () => {
  /* NEW: remember the row for Projector Mode */
  PCMA.state.lastRowForProjector = PCMA.state.lastRenderedRows[idx];

  if (window.PCMA && typeof window.PCMA.openDetailFromList === "function") {
    window.PCMA.openDetailFromList(idx);
  } else {
    console.warn("modal.js not loaded yet");
  }
});



      el.grid.appendChild(card);
    });
  }
  PCMA.renderGrid = renderGrid;

  // ==== EVENTS ====
  el.filterCombo.addEventListener("input", () => {
    const rows = filterData(el.filterCombo.value, "", "", "", "");
    el.grid.classList.remove("hidden");
    renderGrid(rows);
    el.resultInfo.textContent = `${rows.length} result${rows.length !== 1 ? "s" : ""}`;
    el.resultInfo.classList.remove("hidden");
    saveFilterState();
  });

  el.applyFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const combo = el.filterCombo.value || "";
    const y = (el.filterYear.value || "").toLowerCase();
    const s = (el.filterStatus.value || "").toLowerCase();
    const c = (el.filterContractor.value || "").toLowerCase();
    const pe = (el.filterEngineer.value || "").toLowerCase();
    const filtered = filterData(combo, y, pe, c, s);
    renderGrid(filtered);
    el.resultInfo.textContent = `${filtered.length} result${
      filtered.length !== 1 ? "s" : ""
    }`;
    el.resultInfo.classList.remove("hidden");
    el.moreFiltersBox.classList.add("hidden");
    const st = JSON.parse(localStorage.getItem("pcma_filters") || "{}");
    st.more = false;
    localStorage.setItem("pcma_filters", JSON.stringify(st));
    saveFilterState();
  });

  el.clearFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    el.filterCombo.value = "";
    el.filterYear.value = "";
    el.filterStatus.value = "";
    el.filterContractor.value = "";
    el.filterEngineer.value = "";
    const all = PCMA.state.records.filter((r) => r && r.join("").trim());
    renderGrid(all);
    el.resultInfo.textContent = `${all.length} results`;
    el.resultInfo.classList.remove("hidden");
    el.moreFiltersBox.classList.add("hidden");
    const st = JSON.parse(localStorage.getItem("pcma_filters") || "{}");
    st.more = false;
    localStorage.setItem("pcma_filters", JSON.stringify(st));
    saveFilterState();
  });

  el.toggleMoreFiltersBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    el.moreFiltersBox.classList.toggle("hidden");
    saveFilterState();
  });

  el.toggleFiltersBtn.addEventListener("click", () => {
    if (window.innerWidth <= 768) return;
    const isHidden = el.filtersBox.style.display === "none";
    el.filtersBox.style.display = isHidden ? "flex" : "none";
    el.toggleFiltersBtn.textContent = isHidden ? "Hide Search" : "Show Search";
  });

  // INIT
  loadData();
})();

