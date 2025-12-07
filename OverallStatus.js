// OverallStatus.js
// Overall Status window: CY 2025 / 2024 / 2023 + fund breakdown (GAA, DA, DAR, DepEd, Maintenance)

document.addEventListener("DOMContentLoaded", () => {
  const PCMA = (window.PCMA = window.PCMA || {});
  const S = (PCMA.state = PCMA.state || {});

  const openBtn = document.getElementById("openOverallStatus");
  const overlay = document.getElementById("overallStatusOverlay");
  const closeBtn = document.getElementById("osClose");

  if (!openBtn || !overlay || !closeBtn) return;

const YEARS = ["2025", "2024", "2023"];
const FUNDS = ["GAA", "DA", "DAR", "DepEd", "Maintenance", "SpecialFund"];


  /* ---------- helpers ---------- */

  function findColumn(...names) {
    if (!Array.isArray(S.headers)) return -1;
    const lower = S.headers.map((h) => String(h || "").trim().toLowerCase());
    const targets = names
      .filter(Boolean)
      .map((n) => String(n).trim().toLowerCase());

    for (let i = 0; i < lower.length; i++) {
      if (targets.includes(lower[i])) return i;
    }
    return -1;
  }

  function classifyStatus(status) {
    const s = String(status || "").trim().toLowerCase();
    if (!s) return null;

    // ON-GOING
    if (s === "on-going" || s === "ongoing" || s.includes("on-going")) {
      return "ongoing";
    }

    // COMPLETED
    if (
      s === "completed" ||
      s === "completed (pcma)" ||
      s === "pcma" ||
      s === "100%" ||
      s.startsWith("completed")
    ) {
      return "completed";
    }

    // NYS
    if (
      s === "nys" ||
      s.includes("not yet started") ||
      s.includes("not yet start")
    ) {
      return "nys";
    }

    // TERMINATED
    if (s.includes("terminated")) {
      return "terminated";
    }

    return null;
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
        console.warn("OverallStatus: data not loaded within timeout");
      }
    }, 300);
  }

  /* ---------- PIE ANIMATION ---------- */

  function animatePie(pie, label, data, delayMs = 0) {
    const duration = 1200; // ms
    const startAt = performance.now() + delayMs;

    // Restart CSS pop animation
    pie.classList.remove("os-animate-in");
    // force reflow
    void pie.offsetWidth;
    pie.classList.add("os-animate-in");

    function frame(now) {
      const elapsed = now - startAt;
      if (elapsed < 0) {
        requestAnimationFrame(frame);
        return;
      }

      let t = elapsed / duration;
      if (t > 1) t = 1;

      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);

      const pO = data.ongoingPerc * ease;
      const pC = data.completedPerc * ease;
      const pN = data.nysPerc * ease;
      const pT = data.terminatedPerc * ease;

      const stop1 = pO;
      const stop2 = stop1 + pC;
      const stop3 = stop2 + pN;
      const stop4 = 100;

      // full pie (no donut), same colors as containers:
      // ON-GOING (#8FC7A2), COMPLETED (#0FB857), NYS (#C75028), TERMINATED (#ED3C00)
      pie.style.background = `
        conic-gradient(
          #8FC7A2 0 ${stop1}%,
          #0FB857 ${stop1}% ${stop2}%,
          #C75028 ${stop2}% ${stop3}%,
          #ED3C00 ${stop3}% ${stop4}%
        )
      `;

      // Center label: COMPLETED / TOTAL %
      if (label) {
        const currentPercent = Math.round(data.completedPercent * ease);
        label.textContent = `${currentPercent}%`;
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  /* ---------- MAIN COMPUTATION ---------- */

  function computeAndRenderOverall() {
    const yearIdx = findColumn("year");
    const statusIdx = findColumn("status of project", "status");
    const fundIdx = findColumn("fund");

    if (yearIdx < 0 || statusIdx < 0) {
      console.warn("OverallStatus: missing Year/Status columns");
      return;
    }

    function emptyStats() {
      return {
        total: 0,
        ongoing: 0,
        completed: 0,
        nys: 0,
        terminated: 0,
      };
    }

    const stats = {};

    // prepare keys for each year and each year+fund
    YEARS.forEach((year) => {
      stats[year] = emptyStats();
      FUNDS.forEach((fund) => {
        stats[year + fund] = emptyStats();
      });
    });



    const records = Array.isArray(S.records) ? S.records : [];

    records.forEach((row) => {
      if (!row) return;

      const yearRaw = row[yearIdx];
      const yearStr = String(yearRaw == null ? "" : yearRaw).trim();
      if (!yearStr) return;

      let yearKey = null;
      for (const y of YEARS) {
        if (yearStr === y || yearStr.endsWith(y)) {
          yearKey = y;
          break;
        }
      }
      if (!yearKey) return;

      const statusKey = classifyStatus(row[statusIdx]);
      const yearBucket = stats[yearKey];
      if (!yearBucket) return;

      yearBucket.total += 1;
      if (statusKey && yearBucket[statusKey] != null) {
        yearBucket[statusKey] += 1;
      }

      // FUND breakdown per year (2025, 2024, 2023)
      if (fundIdx >= 0) {
        const fundRaw = row[fundIdx];
        const fundStr = String(fundRaw || "").trim().toLowerCase();
        if (!fundStr) return;

        let fundKey = null;
        if (fundStr.includes("special")) {
          fundKey = "SpecialFund";
        } else if (fundStr.includes("maint")) {
          fundKey = "Maintenance";
        } else if (fundStr.includes("deped")) {
          fundKey = "DepEd";
        } else if (fundStr.includes("dar")) {
          fundKey = "DAR";
        } else if (fundStr.includes("gaa")) {
          fundKey = "GAA";
        } else if (fundStr.includes("da")) {
          fundKey = "DA";
        }

        if (fundKey) {
          const combinedKey = yearKey + fundKey;
          const fundBucket = stats[combinedKey];
          if (fundBucket) {
            fundBucket.total += 1;
            if (statusKey && fundBucket[statusKey] != null) {
              fundBucket[statusKey] += 1;
            }
          }
        }
      }
    });


    YEARS.forEach((year) => {
      const agg = {
        total: 0,
        ongoing: 0,
        completed: 0,
        nys: 0,
        terminated: 0,
      };

      FUNDS.forEach((fund) => {
        const fundStats = stats[year + fund];
        if (!fundStats) return;

        agg.total += fundStats.total;
        agg.ongoing += fundStats.ongoing;
        agg.completed += fundStats.completed;
        agg.nys += fundStats.nys;
        agg.terminated += fundStats.terminated;
      });

      // override the main year bucket with the sum of all funds
      stats[year] = agg;
    });


    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };

    // write year rows
    YEARS.forEach((year) => {
      const s = stats[year];
      if (!s) return;
      const prefix = "os" + year;

      setText(prefix + "Total", s.total);
      setText(prefix + "Ongoing", s.ongoing);
      setText(prefix + "Completed", s.completed);
      setText(prefix + "NYS", s.nys);
      setText(prefix + "Terminated", s.terminated);
    });

// write fund rows (including % column)
YEARS.forEach((year) => {
  FUNDS.forEach((fund) => {
    const key = year + fund;
    const s = stats[key];
    if (!s) return;
    const prefix = "os" + year + fund;

    setText(prefix + "Total", s.total);
    setText(prefix + "Ongoing", s.ongoing);
    setText(prefix + "Completed", s.completed);
    setText(prefix + "NYS", s.nys);
    setText(prefix + "Terminated", s.terminated);

    // NEW: percentage = (Completed + NYS + Terminated) / Total
    let percentText = "0%";
    if (s.total > 0) {
      const numerator = s.completed + s.nys + s.terminated;
      const pct = (numerator / s.total) * 100;
      percentText = Math.round(pct) + "%";   // or pct.toFixed(1) + "%";
    }
    setText(prefix + "Percent", percentText);
  });
});



    // hide/show fund rows & groups based on data
    updateAllFundVisibility(stats);

    // animate pies for each main year row
    updatePieCharts(stats);
  }

  /* ---------- FUND VISIBILITY (per year) ---------- */


function updateAllFundVisibility(stats) {
  YEARS.forEach((year) => {
    const groupId = "osFunds" + year + "Group";
    const toggleId = "osToggleFunds" + year;
    const groupEl = document.getElementById(groupId);
    const toggleBtn = document.getElementById(toggleId);

    if (!toggleBtn) return; // button must exist

    // Make sure SPECIAL FUND row is inside the group so it hides/unhides together
    const specialRowId = "osFundRow" + year + "SpecialFund";
    const specialRowEl = document.getElementById(specialRowId);
    if (groupEl && specialRowEl && !groupEl.contains(specialRowEl)) {
      groupEl.appendChild(specialRowEl);
    }

    let visibleCount = 0;

    // Decide which fund rows actually have data
    FUNDS.forEach((fund) => {
      const rowId = "osFundRow" + year + fund; // e.g. osFundRow2025GAA, osFundRow2025SpecialFund
      const rowEl = document.getElementById(rowId);
      const s = stats[year + fund];
      if (!rowEl || !s) return;

      if (s.total > 0) {
        rowEl.style.display = ""; // this row has data
        visibleCount++;
      } else {
        rowEl.style.display = "none";
      }
    });

    if (!groupEl) {
      // If there is no group container, just hide the button when nothing to show
      if (visibleCount === 0) {
        toggleBtn.style.display = "none";
      } else {
        toggleBtn.style.display = "";
        toggleBtn.textContent = "Show FUND Rows";
      }
      return;
    }

    if (visibleCount === 0) {
      // No fund rows with data → hide group & button
      groupEl.style.display = "none";
      toggleBtn.style.display = "none";
    } else {
      // There are fund rows with data:
      //  - start with ALL fund rows hidden (group hidden)
      //  - show the toggle button so user can Show/Hide
      groupEl.style.display = "none";       // hide fund rows at first
      toggleBtn.style.display = "";         // show the toggle button
      toggleBtn.textContent = "Show FUND Rows";
    }
  });
}



  /* ---------- PIE UPDATE ---------- */

  function updatePieCharts(stats) {
    YEARS.forEach((year, index) => {
      const s = stats[year];
      if (!s) return;

      const pie = document.querySelector(`.os-pie[data-row="${year}"]`);
      const label = document.getElementById("osPieLabel" + year);

      if (!pie || !label) return;

      const sum = s.ongoing + s.completed + s.nys + s.terminated;
      let completedPercent = 0;
      if (s.total > 0) {
        completedPercent = Math.round((s.completed / s.total) * 100);
      }

      if (!sum) {
        pie.style.background = "conic-gradient(#4b5563 0 100%)";
        label.textContent = "0%";
        return;
      }

      const data = {
        ongoingPerc: (s.ongoing / sum) * 100,
        completedPerc: (s.completed / sum) * 100,
        nysPerc: (s.nys / sum) * 100,
        terminatedPerc: (s.terminated / sum) * 100,
        completedPercent,
      };

      const delay = index * 150;
      animatePie(pie, label, data, delay);
    });
  }

  /* ---------- TOGGLES (Hide / Show FUND rows per year) ---------- */

  function setupFundToggle(year) {
    const groupId = "osFunds" + year + "Group";
    const toggleId = "osToggleFunds" + year;
    const groupEl = document.getElementById(groupId);
    const toggleBtn = document.getElementById(toggleId);

    if (!groupEl || !toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
      const isHidden =
        groupEl.style.display === "none" ||
        window.getComputedStyle(groupEl).display === "none";

      if (isHidden) {
        groupEl.style.display = "";
        toggleBtn.textContent = "Hide FUND Rows";
      } else {
        groupEl.style.display = "none";
        toggleBtn.textContent = "Show FUND Rows";
      }
    });
  }

  YEARS.forEach(setupFundToggle);

  /* ---------- open / close ---------- */

  function openOverlay() {
    overlay.hidden = false;
    document.body.classList.add("no-scroll"); // same class used by Status PE
    waitForData(computeAndRenderOverall);
  }

  function closeOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  openBtn.addEventListener("click", openOverlay);
  closeBtn.addEventListener("click", closeOverlay);

  // click outside content closes
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) {
      closeOverlay();
    }
  });

  // ESC to close
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && !overlay.hidden) {
      closeOverlay();
    }
  });
});
