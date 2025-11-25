// ProjectDocs.js
// Uses: projectDocsOverlay / pdCloseBtn / projectDocsBody from index.html
// and Chart.js (already loaded before this file).

(function () {
  "use strict";

  const SHEET_ID = "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
  const API_KEY =
    "AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8";

  let scurveChart = null;

  // ---------- Generic helpers ----------

  function normalizeHeader(text) {
    return (text || "")
      .toString()
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function findExactColumn(headerRow, target) {
    const t = normalizeHeader(target);
    return headerRow.findIndex((h) => normalizeHeader(h) === t);
  }

  function findContractRow(values, contractId) {
    if (!values || values.length < 3 || !contractId) {
      return { header: null, row: null, rowIndex: -1 };
    }

    const header = (values[2] || []).map((v) =>
      (v || "").toString().trim()
    );
    const contractIdx = header.findIndex((h) =>
      h.toLowerCase().includes("contract id")
    );
    if (contractIdx === -1) {
      return { header, row: null, rowIndex: -1 };
    }

    const wantedId = contractId.toString().trim().toLowerCase();
    let row = null;
    let rowIndex = -1;

    for (let i = 3; i < values.length; i++) {
      const r = values[i] || [];
      const cell = (r[contractIdx] || "").toString().trim().toLowerCase();
      if (cell && cell === wantedId) {
        row = r;
        rowIndex = i;
        break;
      }
    }

    return { header, row, rowIndex };
  }

  async function fetchValues(range) {
    const url =
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(SHEET_ID) +
      "/values/" +
      encodeURIComponent(range) +
      "?key=" +
      encodeURIComponent(API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch range " + range);
    }
    const json = await res.json();
    return json.values || [];
  }

  // For BILLING we need text color to detect red = Paid
  async function fetchBillingSheet() {
    const url =
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(SHEET_ID) +
      "?ranges=" +
      encodeURIComponent("BILLING") +
      "&fields=" +
      encodeURIComponent(
        "sheets(data(rowData(values(formattedValue,effectiveFormat.textFormat.foregroundColor))))"
      ) +
      "&key=" +
      encodeURIComponent(API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch BILLING(sheet)");
    }
    const json = await res.json();

    const sheet = json.sheets && json.sheets[0];
    const data = sheet && sheet.data && sheet.data[0];
    const rowData = data && data.rowData ? data.rowData : [];

    const values = [];
    const colorGrid = [];

    rowData.forEach((row) => {
      const cells = row.values || [];
      const rowValues = [];
      const rowColors = [];
      cells.forEach((cell) => {
        const v =
          cell &&
          Object.prototype.hasOwnProperty.call(
            cell,
            "formattedValue"
          )
            ? cell.formattedValue
            : "";
        rowValues.push(v != null ? String(v) : "");
        const color =
          cell &&
          cell.effectiveFormat &&
          cell.effectiveFormat.textFormat &&
          cell.effectiveFormat.textFormat.foregroundColor;
        rowColors.push(color || null);
      });
      values.push(rowValues);
      colorGrid.push(rowColors);
    });

    return { values, colorGrid };
  }

  // ---------- PCMA (Planned) ----------

  function buildPcmaRows(values, contractId) {
    const { header, row } = findContractRow(values, contractId);
    if (!header || !row) return [];

    const monthColumns = []; // { year, month, percCol, remarksCol }

    header.forEach((title, colIndex) => {
      const match = /^(\d{4})\s+([A-Za-z]+)$/.exec(title);
      if (match) {
        const year = match[1];
        const monthName = match[2];
        const shortMonth = monthName.slice(0, 3).toLowerCase();

        let remarksIndex = -1;
        for (let j = 0; j < header.length; j++) {
          const h = (header[j] || "").toString().toLowerCase();
          if (h.includes(shortMonth) && h.includes("remarks")) {
            remarksIndex = j;
            break;
          }
        }

        monthColumns.push({
          year: year,
          month: monthName,
          percCol: colIndex,
          remarksCol: remarksIndex,
        });
      }
    });

    const rows = [];
    let reached100 = false;

    monthColumns.forEach((m) => {
      if (reached100) return;

      const rawPerc = (row[m.percCol] || "").toString().trim();
      const rawRemarks =
        m.remarksCol >= 0 ? (row[m.remarksCol] || "").toString().trim() : "";

      // Hide if no value at all
      if (!rawPerc && !rawRemarks) return;

      let numericPerc = null;
      if (rawPerc) {
        const numMatch = rawPerc.match(/-?\d+(\.\d+)?/);
        if (numMatch) numericPerc = parseFloat(numMatch[0]);
      }

      rows.push({
        year: m.year,
        month: m.month,
        percentage: numericPerc,
        remarks: rawRemarks,
      });

      // If 100%, stop showing next months
      if (numericPerc === 100) {
        reached100 = true;
      }
    });

    return rows;
  }

  // ---------- VO ----------

  function buildVoRows(values, contractId) {
    const { header, row } = findContractRow(values, contractId);
    if (!header || !row) return [];

    const rows = [];

    for (let i = 1; i <= 5; i++) {
      const label = "VO" + i;

      const idxVO = findExactColumn(header, label);
      const idxDate = findExactColumn(header, label + " Date");
      const idxDays = findExactColumn(header, label + " Additional Days");
      const idxRemarks = findExactColumn(header, label + " Remarks");

      const voVal = idxVO >= 0 ? (row[idxVO] || "").toString().trim() : "";
      const dateVal =
        idxDate >= 0 ? (row[idxDate] || "").toString().trim() : "";
      const daysVal =
        idxDays >= 0 ? (row[idxDays] || "").toString().trim() : "";
      const remVal =
        idxRemarks >= 0 ? (row[idxRemarks] || "").toString().trim() : "";

      // Hide if all empty
      if (!voVal && !dateVal && !daysVal && !remVal) continue;

      rows.push({
        vo: voVal || label,
        date: dateVal,
        days: daysVal,
        remarks: remVal,
      });
    }

    return rows;
  }

  // ---------- WSO / WRO / CTE ----------

  function buildWsoAndCteRows(values, contractId) {
    const { header, row } = findContractRow(values, contractId);
    if (!header || !row) return { wsoRows: [], cteRows: [] };

    const wsoRows = [];

    for (let i = 1; i <= 4; i++) {
      const wsoDateIdx = findExactColumn(header, "WSO" + i + " Date");
      const wsoReasonIdx = findExactColumn(header, "WSO" + i + " Reason");
      const cwsDateIdx = findExactColumn(header, "CWSO" + i + "a Date");
      const wroDateIdx = findExactColumn(header, "WRO" + i + " Date");

      const wsoDate =
        wsoDateIdx >= 0 ? (row[wsoDateIdx] || "").toString().trim() : "";
      const wsoReason =
        wsoReasonIdx >= 0 ? (row[wsoReasonIdx] || "").toString().trim() : "";
      const cwsDate =
        cwsDateIdx >= 0 ? (row[cwsDateIdx] || "").toString().trim() : "";
      const wroDate =
        wroDateIdx >= 0 ? (row[wroDateIdx] || "").toString().trim() : "";

      if (wsoDate || wsoReason) {
        wsoRows.push({
          code: "WSO" + i,
          date: wsoDate,
          reason: wsoReason,
        });
      }
      if (cwsDate) {
        wsoRows.push({
          code: "CWSO" + i + "a",
          date: cwsDate,
          reason: "Continuing Suspension",
        });
      }
      if (wroDate) {
        wsoRows.push({
          code: "WRO" + i,
          date: wroDate,
          reason: "Resolved",
        });
      }
    }

    const cteRows = [];

    for (let i = 1; i <= 10; i++) {
      const cteIdx = findExactColumn(header, "CTE" + i);
      const cteRemIdx = findExactColumn(header, "CTE" + i + " Remarks");

      const days =
        cteIdx >= 0 ? (row[cteIdx] || "").toString().trim() : "";
      const remarks =
        cteRemIdx >= 0 ? (row[cteRemIdx] || "").toString().trim() : "";

      if (!days && !remarks) continue;

      cteRows.push({
        code: "CTE" + i,
        days: days, // value is days, not date
        remarks: remarks,
      });
    }

    return { wsoRows, cteRows };
  }

  // ---------- BILLING (2025) ----------

  function buildBillingRows(billingSheet, contractId) {
    const values = billingSheet.values;
    const colorGrid = billingSheet.colorGrid || [];
    const { header, row, rowIndex } = findContractRow(values, contractId);
    if (!header || !row || rowIndex < 0) return [];

    const rows = [];

    header.forEach((title, colIndex) => {
      const match = /^(\d{4})\s+([A-Za-z]+)$/.exec(title);
      if (!match) return;
      const year = match[1];
      const monthName = match[2];

      if (year !== "2025") return; // Billing(2025) only

      const lowerYear = year.toLowerCase();
      const lowerMonth = monthName.toLowerCase();

      let remarksIndex = -1;
      for (let j = 0; j < header.length; j++) {
        const h = (header[j] || "").toString().toLowerCase();
        if (
          h.includes(lowerYear) &&
          h.includes(lowerMonth) &&
          h.includes("remarks")
        ) {
          remarksIndex = j;
          break;
        }
      }

      const baseText = (row[colIndex] || "").toString().trim();
      const remarksText =
        remarksIndex >= 0 ? (row[remarksIndex] || "").toString().trim() : "";

      // Hide if empty
      if (!baseText && !remarksText) return;

      let percent = null;


      // 1) Get Percentage in Billing (2025) cell
      if (baseText) {
        const m = baseText.match(/(\d+(\.\d+)?)\s*%?/);
        if (m) {
          percent = parseFloat(m[1]);
        }
      }

      // 2) Get Percentage inside "(" and ")" from Remarks
      if (remarksText) {
        const m = remarksText.match(/\((\s*\d+(\.\d+)?)\s*%?\s*\)/);
        if (m) {
          percent = parseFloat(m[1]);
        }
      }

      // If the Value in the Remarks have "Mobilization" the Value will be 0%
      if (/mobilization/i.test(remarksText)) {
        percent = 0;
      }

      // If the Value in the Remarks have "Final" or "Retention" the Value will be 100%
      if (/final/i.test(remarksText) || /retention/i.test(remarksText)) {
        percent = 100;
      }




      // Check if text color red => add "- Paid"
      const rowColors = colorGrid[rowIndex] || [];
      const color = rowColors[colIndex] || null;
      let isRed = false;
      if (color) {
        const r = color.red || 0;
        const g = color.green || 0;
        const b = color.blue || 0;
        if (r >= 0.7 && g <= 0.3 && b <= 0.3) {
          isRed = true;
        }
      }

      let displayRemarks = remarksText;
      if (isRed) {
        displayRemarks = displayRemarks
          ? displayRemarks + " - Paid"
          : "Paid";
      }

      rows.push({
        year: year,
        month: monthName,
        percentage: percent,
        remarks: displayRemarks,
      });
    });

    return rows;
  }

  // ---------- RENDER SECTIONS ----------

  function renderPcmaSection(pcmaRows) {
    const container = document.getElementById("pdPcmaSection");
    if (!container) return;

    if (!pcmaRows.length) {
      container.innerHTML =
        "<h3>PCMA</h3><p>No PCMA data for this Contract ID.</p>";
      return;
    }

    let html = "<h3>PCMA (Planned Accomplishment)</h3>";
    html +=
      '<table class="pd-table"><thead><tr>' +
      "<th>YEAR</th><th>MONTH</th><th>ACCOMP.</th><th>REMARKS</th>" +
      "</tr></thead><tbody>";

    pcmaRows.forEach((r) => {
      const percDisplay =
        r.percentage != null && r.percentage !== ""
          ? r.percentage + "%"
          : "";
      html +=
        "<tr>" +
        '<td class="col-year">' +
        r.year +
        "</td>" +
        '<td class="col-month">' +
        r.month +
        "</td>" +
        '<td class="col-accomp">' +
        percDisplay +
        "</td>" +
        '<td class="col-remarks">' +
        (r.remarks || "") +
        "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function renderVoSection(voRows) {
    const container = document.getElementById("pdVoSection");
    if (!container) return;

    if (!voRows.length) {
      container.innerHTML =
        "<h3>VO</h3><p>No VO data for this Contract ID.</p>";
      return;
    }

    let html =
      "<h3>VO (Variation Orders)</h3>" +
      '<table class="pd-table"><thead><tr>' +
      "<th>VO</th><th>DATE</th><th>ADDITIONAL DAYS</th><th>REMARKS</th>" +
      "</tr></thead><tbody>";

    voRows.forEach((r) => {
      html +=
        "<tr>" +
        "<td>" +
        (r.vo || "") +
        "</td>" +
        "<td>" +
        (r.date || "") +
        "</td>" +
        "<td>" +
        (r.days || "") +
        "</td>" +
        "<td>" +
        (r.remarks || "") +
        "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function renderWsoSection(wsoRows, cteRows) {
    const container = document.getElementById("pdWsoSection");
    if (!container) return;

    let html = "";

    if (wsoRows.length) {
      html +=
        "<h3>WSO / CWSO / WRO</h3>" +
        '<table class="pd-table"><thead><tr>' +
        "<th>CODE</th><th>DATE</th><th>REASON</th>" +
        "</tr></thead><tbody>";

      wsoRows.forEach((r) => {
        html +=
          "<tr>" +
          "<td>" +
          (r.code || "") +
          "</td>" +
          "<td>" +
          (r.date || "") +
          "</td>" +
          "<td>" +
          (r.reason || "") +
          "</td>" +
          "</tr>";
      });

      html += "</tbody></table>";
    }

    if (cteRows.length) {
      html +=
        "<h3>CTE</h3>" +
        '<table class="pd-table"><thead><tr>' +
        "<th>CTE</th><th>DAYS</th><th>REMARKS</th>" +
        "</tr></thead><tbody>";

      cteRows.forEach((r) => {
        html +=
          "<tr>" +
          "<td>" +
          (r.code || "") +
          "</td>" +
          "<td>" +
          (r.days || "") +
          "</td>" +
          "<td>" +
          (r.remarks || "") +
          "</td>" +
          "</tr>";
      });

      html += "</tbody></table>";
    }

    if (!html) {
      html =
        "<h3>WSO / WRO / CTE</h3><p>No WSO / WRO / CTE data for this Contract ID.</p>";
    }

    container.innerHTML = html;
  }

  function renderBillingSection(billingRows) {
    const container = document.getElementById("pdBillingSection");
    if (!container) return;

    if (!billingRows.length) {
      container.innerHTML =
        "<h3>Billing (2025)</h3><p>No Billing data for this Contract ID.</p>";
      return;
    }

    let html =
      "<h3>Billing (2025)</h3>" +
      '<table class="pd-table"><thead><tr>' +
      "<th>YEAR</th><th>MONTH</th><th>BILLING %</th><th>REMARKS</th>" +
      "</tr></thead><tbody>";

    billingRows.forEach((r) => {
      const percDisplay =
        r.percentage != null && r.percentage !== ""
          ? r.percentage + "%"
          : "";
      html +=
        "<tr>" +
        '<td class="col-year">' +
        r.year +
        "</td>" +
        '<td class="col-month">' +
        r.month +
        "</td>" +
        '<td class="col-accomp">' +
        percDisplay +
        "</td>" +
        '<td class="col-remarks">' +
        (r.remarks || "") +
        "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  // ---------- S-CURVE (PCMA vs BILLING 2025) ----------

  function monthNameToNumber(name) {
    const m = name ? name.toString().trim().toUpperCase() : "";
    switch (m) {
      case "JAN":
      case "JANUARY":
        return 1;
      case "FEB":
      case "FEBRUARY":
        return 2;
      case "MAR":
      case "MARCH":
        return 3;
      case "APR":
      case "APRIL":
        return 4;
      case "MAY":
        return 5;
      case "JUN":
      case "JUNE":
        return 6;
      case "JUL":
      case "JULY":
        return 7;
      case "AUG":
      case "AUGUST":
        return 8;
      case "SEP":
      case "SEPT":
      case "SEPTEMBER":
        return 9;
      case "OCT":
      case "OCTOBER":
        return 10;
      case "NOV":
      case "NOVEMBER":
        return 11;
      case "DEC":
      case "DECEMBER":
        return 12;
      default:
        return 0;
    }
  }

  function buildSCurveChart(pcmaRows, billingRows) {
    const canvas = document.getElementById("pdSCurveCanvas");
    if (!canvas || typeof Chart === "undefined") return;

    const monthMap = new Map(); // key => {year,month,monthNum}

    function addRows(rows) {
      rows.forEach((r) => {
        if (!r.year || !r.month) return;
        const mNum = monthNameToNumber(r.month);
        if (!mNum) return;
        const key = r.year + "-" + String(mNum).padStart(2, "0");
        if (!monthMap.has(key)) {
          monthMap.set(key, {
            year: r.year,
            month: r.month,
            monthNum: mNum,
          });
        }
      });
    }

    addRows(pcmaRows);
    addRows(billingRows);

    if (!monthMap.size) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const entries = Array.from(monthMap.entries());
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

    const labels = entries.map(([, info]) => info.month + " " + info.year);

    const pcmaByKey = {};
    pcmaRows.forEach((r) => {
      const mNum = monthNameToNumber(r.month);
      if (!mNum) return;
      const key = r.year + "-" + String(mNum).padStart(2, "0");
      pcmaByKey[key] =
        typeof r.percentage === "number" ? r.percentage : null;
    });

    const billingByKey = {};
    billingRows.forEach((r) => {
      const mNum = monthNameToNumber(r.month);
      if (!mNum) return;
      const key = r.year + "-" + String(mNum).padStart(2, "0");
      billingByKey[key] =
        typeof r.percentage === "number" ? r.percentage : null;
    });

    const pcmaData = entries.map(([key]) => {
      const v = pcmaByKey[key];
      return typeof v === "number" ? v : null;
    });

    const billingData = entries.map(([key]) => {
      const v = billingByKey[key];
      return typeof v === "number" ? v : null;
    });

    const ctx = canvas.getContext("2d");

    if (scurveChart) scurveChart.destroy();

    // Plugin to show % text above each point
    const dataLabelPlugin = {
      id: "pdDataLabelPlugin",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          meta.data.forEach((point, index) => {
            const value = dataset.data[index];
            if (value == null) return;
            const pos = point.tooltipPosition();
            ctx.save();
            ctx.fillStyle = "#000";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(value + "%", pos.x, pos.y - 4);
            ctx.restore();
          });
        });
      },
    };

    scurveChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "PCMA %",
            data: pcmaData,
            tension: 0.4, // smooth S-line
            borderColor: "rgba(0, 128, 0, 1)",
            backgroundColor: "rgba(0, 128, 0, 0.2)", // green fill
            borderWidth: 0.8, // approx "0.30" thin line
            pointBackgroundColor: "rgba(0, 128, 0, 1)",
            pointRadius: 3,
            spanGaps: true, // connect through months with no data
            fill: true,
          },
          {
            label: "Billing %",
            data: billingData,
            tension: 0.4,
            borderColor: "rgba(255, 0, 0, 1)", // red line
            backgroundColor: "rgba(255, 0, 0, 0.2)", // transparent red fill
            borderWidth: 0.8,
            pointBackgroundColor: "red",
            pointRadius: 3,
            spanGaps: true,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // use fixed height from CSS
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
              callback(value) {
                return value + "%"; // 0% - 100% left side
              },
            },
            title: {
              display: true,
              text: "Percentage",
            },
          },
          x: {
            grid: {
              display: true, // vertical line for every month
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label(context) {
                const label = context.dataset.label || "";
                const value =
                  typeof context.parsed.y === "number"
                    ? context.parsed.y
                    : "";
                return label + ": " + value + "%";
              },
            },
          },
        },
      },
      plugins: [dataLabelPlugin],
    });
  }

  // ---------- Overlay + body reset ----------

  function resetBody() {
    const body = document.getElementById("projectDocsBody");
    if (!body) return { loadingEl: null, contentEl: null };

    body.innerHTML = "";

    const loadingEl = document.createElement("div");
    loadingEl.id = "projectDocsLoading";
    loadingEl.className = "pd-loading";
    loadingEl.textContent = "Loading documentation…";

    const contentEl = document.createElement("div");
    contentEl.id = "projectDocsContent";
    contentEl.className = "pd-content";
    contentEl.style.display = "none";

    const pcmaSection = document.createElement("div");
    pcmaSection.id = "pdPcmaSection";
    pcmaSection.className = "pd-section";

    const scurveWrapper = document.createElement("div");
    scurveWrapper.className = "pd-scurve-wrapper";
    const canvas = document.createElement("canvas");
    canvas.id = "pdSCurveCanvas";
    scurveWrapper.appendChild(canvas);

    const billingSection = document.createElement("div");
    billingSection.id = "pdBillingSection";
    billingSection.className = "pd-section";

    const voSection = document.createElement("div");
    voSection.id = "pdVoSection";
    voSection.className = "pd-section";

    const wsoSection = document.createElement("div");
    wsoSection.id = "pdWsoSection";
    wsoSection.className = "pd-section";

    contentEl.appendChild(pcmaSection);
    contentEl.appendChild(scurveWrapper);
    contentEl.appendChild(billingSection);
    contentEl.appendChild(voSection);
    contentEl.appendChild(wsoSection);

    body.appendChild(loadingEl);
    body.appendChild(contentEl);

    return { loadingEl, contentEl };
  }

  function openOverlay() {
    const overlay = document.getElementById("projectDocsOverlay");
    if (!overlay) return;
    overlay.hidden = false;
  }

  function closeOverlay() {
    const overlay = document.getElementById("projectDocsOverlay");
    if (!overlay) return;
    overlay.hidden = true;
  }

  async function openProjectDocs(contractId) {
    // Fallback: read from modal header if no param
    if (!contractId) {
      const cidEl = document.getElementById("pcmaModalCID");
      if (cidEl) contractId = cidEl.textContent.trim();
    }

    if (!contractId) {
      alert("No Contract ID found.");
      return;
    }

    openOverlay();

    const { loadingEl, contentEl } = resetBody();
    if (!loadingEl || !contentEl) return;

    loadingEl.style.display = "block";
    contentEl.style.display = "none";

    try {
      const [pcmaValues, voValues, wsoValues, billingSheet] =
        await Promise.all([
          fetchValues("PCMA"),
          fetchValues("VO"),
          fetchValues("WSO/WRO/CTE"),
          fetchBillingSheet(),
        ]);

      const pcmaRows = buildPcmaRows(pcmaValues, contractId);
      const voRows = buildVoRows(voValues, contractId);
      const { wsoRows, cteRows } = buildWsoAndCteRows(
        wsoValues,
        contractId
      );
      const billingRows = buildBillingRows(billingSheet, contractId);

      renderPcmaSection(pcmaRows);
      renderBillingSection(billingRows);
      renderVoSection(voRows);
      renderWsoSection(wsoRows, cteRows);
      buildSCurveChart(pcmaRows, billingRows);
    } catch (err) {
      console.error("ProjectDocs error:", err);
      const body = document.getElementById("projectDocsBody");
      if (body) {
        body.innerHTML =
          '<div class="pd-error">Error loading Project Documentation. Please try again.</div>';
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
      if (contentEl) contentEl.style.display = "block";
    }
  }

  function setupOverlayClose() {
    const closeBtn = document.getElementById("pdCloseBtn");
    const overlay = document.getElementById("projectDocsOverlay");

    if (closeBtn) closeBtn.addEventListener("click", closeOverlay);

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeOverlay();
      });
    }
  }

  // Expose globally so modal button can call it
  window.openProjectDocs = openProjectDocs;

  document.addEventListener("DOMContentLoaded", setupOverlayClose);
})();
