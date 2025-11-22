// StatusPE.js - Status per PE overlay logic

document.addEventListener("DOMContentLoaded", () => {
  // shared state from main app
  const PCMA = (window.PCMA = window.PCMA || {});
  const S = (PCMA.state = PCMA.state || {});

  // DOM elements
  const openBtn = document.getElementById("openPeStatus");
  const overlay = document.getElementById("peStatusOverlay");
  const closeBtn = document.getElementById("peClose");

  const peSelect = document.getElementById("peSelect");
  const yearSelect = document.getElementById("peYear");
  const generateBtn = document.getElementById("peGenerate");

  const colOngoing = document.getElementById("peColOngoing");
  const colCompleted = document.getElementById("peColCompleted");
  const colNYS = document.getElementById("peColNYS");
  const colTerminated = document.getElementById("peColTerminated");

  // summary counters
  const totalAllEl = document.getElementById("peTotalAll");
  const totalOngoingEl = document.getElementById("peTotalOngoing");
  const totalCompletedEl = document.getElementById("peTotalCompleted");
  const totalNYSEl = document.getElementById("peTotalNYS");
  const totalTerminatedEl = document.getElementById("peTotalTerminated");

  // work-in-progress bar
  const progressFillEl = document.getElementById("peProgressFill");
  const progressTextEl = document.getElementById("peProgressText");

  // insert header selected span if missing
  let headerSelected = document.getElementById("peHeaderSelectedValue");
  if (!headerSelected && overlay) {
    const topBar = overlay.querySelector(".pe-top");
    if (topBar) {
      headerSelected = document.createElement("span");
      headerSelected.id = "peHeaderSelectedValue";
      topBar.insertBefore(headerSelected, closeBtn || null);
    }
  }

  if (!openBtn || !overlay || !closeBtn) {
    console.warn("StatusPE: required elements not found");
    return;
  }

  // helpers

  function findColumn(...names) {
    const headers = (S.headers || []).map((h) => String(h || "").toLowerCase());
    for (const name of names) {
      const target = String(name || "").toLowerCase();
      const idx = headers.findIndex((h) => h.includes(target));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  function waitForData(callback) {
    const hasData = () =>
      Array.isArray(S.headers) &&
      S.headers.length &&
      Array.isArray(S.records) &&
      S.records.length;

    if (hasData()) {
      callback();
      return;
    }

    const start = Date.now();
    const timer = setInterval(() => {
      if (hasData()) {
        clearInterval(timer);
        callback();
      } else if (Date.now() - start > 15000) {
        clearInterval(timer);
        alert("Data not loaded yet. Please try again in a moment.");
      }
    }, 300);
  }

  function updateHeaderSelectedDisplay(peValue, yearValue) {
    if (!headerSelected) return;
    const peLabel = peValue || "All PE";
    const yearLabel = yearValue || "All Years";
    headerSelected.textContent = `${peLabel} | ${yearLabel}`;
  }

  // clickable contract item that opens modal
  function createContractItem(contractId, rowIndex, rowsRef) {
    const el = document.createElement("div");
    el.className = "pe-item";
    el.textContent = contractId;

    el.addEventListener("click", () => {
      if (!window.PCMA || typeof window.PCMA.openDetailFromList !== "function") {
        console.warn("StatusPE: modal.js not ready");
        return;
      }

      const previousList = PCMA.state.lastRenderedRows;
      try {
        // provide overlay's rows to modal navigation
        PCMA.state.lastRenderedRows = Array.isArray(rowsRef) ? rowsRef.slice() : [];
        window.PCMA.openDetailFromList(rowIndex);
      } finally {
        PCMA.state.lastRenderedRows = previousList;
      }
    });

    return el;
  }

  function classifyStatus(status) {
    const s = String(status || "").trim().toLowerCase();

    if (s === "on-going" || s === "ongoing") return "ongoing";

    if (
      s === "completed" ||
      s === "completed (pcma)" ||
      s === "pcma" ||
      s === "100%"
    ) {
      return "completed";
    }

    if (s === "nys" || s === "not yet started" || s.includes("not yet start")) {
      return "nys";
    }

    if (s.includes("terminated")) return "terminated";

    return null;
  }

  const sortByContract = (a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

  // dropdowns

  function populateDropdowns() {
    if (!peSelect || !yearSelect) return;

    if (peSelect.options.length > 1) peSelect.length = 1;
    if (yearSelect.options.length > 1) yearSelect.length = 1;

    const peIdx = findColumn("project engineer", "pe");
    const yearIdx = findColumn("year");

    const peValues = new Set();
    const yearValues = new Set();

    (S.records || []).forEach((row) => {
      if (peIdx >= 0 && row[peIdx]) {
        peValues.add(String(row[peIdx]).trim());
      }
      if (yearIdx >= 0 && row[yearIdx]) {
        yearValues.add(String(row[yearIdx]).trim());
      }
    });

    Array.from(peValues)
      .sort()
      .forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        peSelect.appendChild(opt);
      });

    Array.from(yearValues)
      .sort((a, b) => Number(b) - Number(a) || a.localeCompare(b))
      .forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        yearSelect.appendChild(opt);
      });
  }

  // --- SUMMARY COUNTERS + PROGRESS BAR ------------------------------

  function updateSummaryCounts(buckets) {
    const totalAll =
      buckets.ongoing.length +
      buckets.completed.length +
      buckets.nys.length +
      buckets.terminated.length;

    if (totalAllEl) totalAllEl.textContent = String(totalAll);
    if (totalOngoingEl)
      totalOngoingEl.textContent = String(buckets.ongoing.length);
    if (totalCompletedEl)
      totalCompletedEl.textContent = String(buckets.completed.length);
    if (totalNYSEl) totalNYSEl.textContent = String(buckets.nys.length);
    if (totalTerminatedEl)
      totalTerminatedEl.textContent = String(buckets.terminated.length);

    // NEW: update work-in-progress bar: Completed / Total (%)
    const completed = buckets.completed.length;
    const pct =
      totalAll > 0 ? Math.round((completed / totalAll) * 100) : 0;
    const clampedPct = Math.max(0, Math.min(100, pct));

    if (progressFillEl) {
      progressFillEl.style.width = clampedPct + "%";
    }
    if (progressTextEl) {
      progressTextEl.textContent = `${clampedPct}% Completed`;
    }
  }

  function showEmptyIfNeeded(bucket, container) {
    if (!container) return;
    if (bucket.length === 0) {
      const msg = document.createElement("div");
      msg.className = "pe-empty";
      msg.textContent = "No projects";
      container.appendChild(msg);
    }
  }

  // main render

  function render() {
    if (!colOngoing || !colCompleted || !colTerminated) return;

    colOngoing.innerHTML = "";
    colCompleted.innerHTML = "";
    if (colNYS) colNYS.innerHTML = "";
    colTerminated.innerHTML = "";

    const peIdx = findColumn("project engineer", "pe");
    const yearIdx = findColumn("year");
    const statusIdx = findColumn("status");
    const contractIdx = findColumn(
      "contract id",
      "contract no",
      "contract number",
      "contract"
    );

    if ([peIdx, yearIdx, statusIdx, contractIdx].some((i) => i < 0)) {
      const msg =
        "Required columns not found (need Project Engineer, Year, Contract ID, Status).";
      [colOngoing, colCompleted, colTerminated].forEach((col) => {
        if (!col) return;
        const d = document.createElement("div");
        d.className = "pe-empty";
        d.textContent = msg;
        col.appendChild(d);
      });
      console.warn("StatusPE:", msg, { headers: S.headers });
      return;
    }

    const selectedPE = peSelect ? peSelect.value : "";
    const selectedYear = yearSelect ? yearSelect.value : "";

    updateHeaderSelectedDisplay(selectedPE, selectedYear);

    const rows = (S.records || []).filter((row) => {
      const peValue = String(row[peIdx] ?? "").trim();
      const yearValue = String(row[yearIdx] ?? "").trim();
      const matchPE = !selectedPE || peValue === selectedPE;
      const matchYear = !selectedYear || yearValue === selectedYear;
      return matchPE && matchYear;
    });

    const buckets = {
      ongoing: [],
      completed: [],
      nys: [],
      terminated: [],
    };

    rows.forEach((row, index) => {
      const contractId = String(row[contractIdx] ?? "").trim();
      if (!contractId) return;
      const bucketName = classifyStatus(row[statusIdx]);
      if (!bucketName) return;
      buckets[bucketName].push({ contractId, index });
    });

    buckets.ongoing
      .sort((a, b) => sortByContract(a.contractId, b.contractId))
      .forEach((item) => {
        colOngoing.appendChild(
          createContractItem(item.contractId, item.index, rows)
        );
      });

    buckets.completed
      .sort((a, b) => sortByContract(a.contractId, b.contractId))
      .forEach((item) => {
        colCompleted.appendChild(
          createContractItem(item.contractId, item.index, rows)
        );
      });

    if (colNYS) {
      buckets.nys
        .sort((a, b) => sortByContract(a.contractId, b.contractId))
        .forEach((item) => {
          colNYS.appendChild(
            createContractItem(item.contractId, item.index, rows)
          );
        });
    }

    buckets.terminated
      .sort((a, b) => sortByContract(a.contractId, b.contractId))
      .forEach((item) => {
        colTerminated.appendChild(
          createContractItem(item.contractId, item.index, rows)
        );
      });

    // update tiles + progress bar
    updateSummaryCounts(buckets);

    showEmptyIfNeeded(buckets.ongoing, colOngoing);
    showEmptyIfNeeded(buckets.completed, colCompleted);
    if (colNYS) showEmptyIfNeeded(buckets.nys, colNYS);
    showEmptyIfNeeded(buckets.terminated, colTerminated);
  }

  // open / close overlay

  function openOverlay() {
    overlay.hidden = false;
    document.body.classList.add("no-scroll");

    waitForData(() => {
      if (peSelect && peSelect.options.length <= 1) {
        populateDropdowns();
      }
      render();
    });
  }

  function closeOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  openBtn.addEventListener("click", openOverlay);
  closeBtn.addEventListener("click", closeOverlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeOverlay();
  });

  if (generateBtn) {
    generateBtn.addEventListener("click", render);
  }
  if (peSelect) {
    peSelect.addEventListener("change", () => {
      if (!overlay.hidden) render();
    });
  }
  if (yearSelect) {
    yearSelect.addEventListener("change", () => {
      if (!overlay.hidden) render();
    });
  }
});
