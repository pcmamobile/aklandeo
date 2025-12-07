// ProjectDocs.js
// Uses: #projectDocsOverlay, #pdCloseBtn, #projectDocsBody, and Chart.js (must be loaded before this file).

(function () {
  "use strict";

  const SHEET_ID = "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
  const API_KEY = "AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8";

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
    for (let i = 0; i < headerRow.length; i++) {
      if (normalizeHeader(headerRow[i]) === t) return i;
    }
    return -1;
  }

  function monthNameToNumber(name) {
    if (!name) return 0;
    const key = name.toString().trim().slice(0, 3).toUpperCase();
    switch (key) {
      case "JAN":
        return 1;
      case "FEB":
        return 2;
      case "MAR":
        return 3;
      case "APR":
        return 4;
      case "MAY":
        return 5;
      case "JUN":
        return 6;
      case "JUL":
        return 7;
      case "AUG":
        return 8;
      case "SEP":
      case "SEPT":
        return 9;
      case "OCT":
        return 10;
      case "NOV":
        return 11;
      case "DEC":
        return 12;
      default:
        return 0;
    }
  }

  // Find the row (after header row 3) that contains the Contract ID
  function findContractRow(values, contractId) {
    if (!values || values.length < 3) {
      return { header: null, row: null, rowIndex: -1 };
    }

    const header = values[2] || [];
    const target = String(contractId).trim().toLowerCase();

    for (let r = 3; r < values.length; r++) {
      const row = values[r] || [];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell != null && String(cell).trim().toLowerCase() === target) {
          return { header, row, rowIndex: r };
        }
      }
    }

    return { header, row: null, rowIndex: -1 };
  }

  // ---------- Google Sheets fetch helpers ----------

  async function fetchValues(sheetName) {
    const range = encodeURIComponent(sheetName + "!A1:ZZ500");
    const url =
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(SHEET_ID) +
      "/values/" +
      range +
      "?key=" +
      encodeURIComponent(API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch range " + sheetName);
    }
    const json = await res.json();
    return json.values || [];
  }

  // For BILLING we need text color (to detect red = Paid)
  async function fetchBillingSheet() {
    const url =
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(SHEET_ID) +
      "?ranges=" +
      encodeURIComponent("BILLING!A1:ZZ500") +
      "&fields=" +
      encodeURIComponent(
        "sheets(data(rowData(values(formattedValue,effectiveFormat.textFormat.foregroundColor))))"
      ) +
      "&key=" +
      encodeURIComponent(API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch BILLING sheet");
    }
    const json = await res.json();

    const sheet = json.sheets && json.sheets[0];
    const data = sheet && sheet.data && sheet.data[0];
    const rowData = (data && data.rowData) || [];

    const values = [];
    const colorGrid = [];

    rowData.forEach((row) => {
      const cells = row.values || [];
      const rowValues = [];
      const rowColors = [];

      cells.forEach((cell) => {
        const v =
          cell &&
          Object.prototype.hasOwnProperty.call(cell, "formattedValue")
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
      if (!title) return;
      const match = /^(\d{4})\s+([A-Za-z]+)$/.exec(title.toString().trim());
      if (match) {
        const year = match[1];
        const monthName = match[2];
        const shortMonth = monthName.slice(0, 3).toLowerCase();

        // Find "25 Jun Remarks", etc. (any header containing this month + "remarks")
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

      // hide if no value
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

      // If 100%, stop – next month/column hidden
      if (numericPerc === 100) {
        reached100 = true;
      }
    });

    return rows;
  }

  // Extra PCMA rows for headers like "2025 November PCMA" (blue S-curve)
  function buildPcmaExtraRows(values, contractId) {
    const { header, row } = findContractRow(values, contractId);
    if (!header || !row) return [];

    const monthColumns = []; // { year, month, percCol, remarksCol }

    header.forEach((title, colIndex) => {
      if (!title) return;
      const text = title.toString().trim();
      const match = /^(\d{4})\s+([A-Za-z]+)\s+PCMA$/i.exec(text);
      if (match) {
        const year = match[1];
        const monthName = match[2];
        const shortMonth = monthName.slice(0, 3).toLowerCase();

        // Try to find a remarks column that contains this short month and "remarks"
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

      // hide if no value at all
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
      const dateLabel = "VO" + i + " Date";
      const daysLabel = "VO" + i + " Additional Days";
      const remarksLabel = "VO" + i + " Remarks";

      const dateIdx = findExactColumn(header, dateLabel);
      const daysIdx = findExactColumn(header, daysLabel);
      const remarksIdx = findExactColumn(header, remarksLabel);

      const date = dateIdx >= 0 ? row[dateIdx] || "" : "";
      const days = daysIdx >= 0 ? row[daysIdx] || "" : "";
      const remarks = remarksIdx >= 0 ? row[remarksIdx] || "" : "";

      const hasAny =
        (date && String(date).trim() !== "") ||
        (days && String(days).trim() !== "") ||
        (remarks && String(remarks).trim() !== "");

      if (!hasAny) continue;

      rows.push({
        label,
        date,
        days,
        remarks,
      });
    }

    return rows;
  }

  // ---------- WSO / WRO / CTE ----------

  function buildWsoAndCteRows(values, contractId) {
    const { header, row } = findContractRow(values, contractId);
    if (!header || !row) return { wsoRows: [], cteRows: [] };

    const wsoRows = [];
    const cteRows = [];

    // WSO / CWSO / WRO1..4
    for (let i = 1; i <= 4; i++) {
      const wsoDateIdx = findExactColumn(header, "WSO" + i + " Date");
      const wsoReasonIdx = findExactColumn(header, "WSO" + i + " Reason");
      const cwsoDateIdx = findExactColumn(header, "CWSO" + i + "a Date");
      const wroDateIdx = findExactColumn(header, "WRO" + i + " Date");

      const wsoDate = wsoDateIdx >= 0 ? row[wsoDateIdx] || "" : "";
      const wsoReason = wsoReasonIdx >= 0 ? row[wsoReasonIdx] || "" : "";

      if (wsoDate || wsoReason) {
        wsoRows.push({
          code: "WSO" + i,
          date: wsoDate,
          reason: wsoReason || "",
        });
      }

      const cwsoDate = cwsoDateIdx >= 0 ? row[cwsoDateIdx] || "" : "";
      if (cwsoDate) {
        wsoRows.push({
          code: "CWSO" + i + "a",
          date: cwsoDate,
          reason: "Continuing Suspension",
        });
      }

      const wroDate = wroDateIdx >= 0 ? row[wroDateIdx] || "" : "";
      if (wroDate) {
        wsoRows.push({
          code: "WRO" + i,
          date: wroDate,
          reason: "Resolved",
        });
      }
    }

    // CTE1..CTE10 – value is Days, plus Remarks
    for (let i = 1; i <= 10; i++) {
      const label = "CTE" + i;
      const remarksLabel = "CTE" + i + " Remarks";

      const daysIdx = findExactColumn(header, label);
      const remarksIdx = findExactColumn(header, remarksLabel);

      const days = daysIdx >= 0 ? row[daysIdx] || "" : "";
      const remarks = remarksIdx >= 0 ? row[remarksIdx] || "" : "";

      const hasAny =
        (days && String(days).trim() !== "") ||
        (remarks && String(remarks).trim() !== "");
      if (!hasAny) continue;

      cteRows.push({
        code: label,
        days,
        remarks,
      });
    }

    return { wsoRows, cteRows };
  }

  // ---------- BILLING (2025) + percentages ----------

  function buildBillingRows(billingSheet, contractId) {
    const values = billingSheet.values || [];
    const colorGrid = billingSheet.colorGrid || [];
    const { header, row, rowIndex } = findContractRow(values, contractId);
    if (!header || !row || rowIndex < 0) return [];

    const rows = [];

    header.forEach((title, colIndex) => {
      if (!title) return;
      const match = /^(\d{4})\s+([A-Za-z]+)$/.exec(title.toString().trim());
      if (!match) return;

      const year = match[1];
      const monthName = match[2];

      // Billing (2025) only
      if (year !== "2025") return;

      const amountText = (row[colIndex] || "").toString().trim();

      // Remarks column "2025 March Remarks"
      const remarksHeader = year + " " + monthName + " Remarks";
      let remarksColIndex = -1;
      for (let j = 0; j < header.length; j++) {
        if (normalizeHeader(header[j]) === normalizeHeader(remarksHeader)) {
          remarksColIndex = j;
          break;
        }
      }

      const remarksText =
        remarksColIndex >= 0
          ? (row[remarksColIndex] || "").toString().trim()
          : "";

      // Hide if no value at all
      if (!amountText && !remarksText) return;

      let percent = null;

      // 1) Try to get percentage from Billing cell itself
      if (amountText) {
        const m = amountText.match(/(\d+(?:\.\d+)?)\s*%?/);
        if (m) {
          percent = parseFloat(m[1]);
        }
      }

      // 2) Get percentage inside "(" and ")" from Remarks, example "(35%)"
      if (remarksText) {
        const m = remarksText.match(/\((\s*\d+(?:\.\d+)?)\s*%?\s*\)/);
        if (m) {
          percent = parseFloat(m[1]);
        }
      }

      // If the value in the Remarks have "Mobilization" the Value will be 0%
      if (/mobilization/i.test(remarksText)) {
        percent = 0;
      }

      // If the value in the Remarks have "Final" or "Retention" the Value will be 100%
      if (/final/i.test(remarksText) || /retention/i.test(remarksText)) {
        percent = 100;
      }

      // Check if text color red => add "- Paid" at the end of remarks
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
        year,
        month: monthName,
        amount: amountText,
        remarks: displayRemarks,
        percentage: percent,
      });
    });

    return rows;
  }

  // ---------- RENDER SECTIONS ----------


function renderPcmaSection(pcmaRows, pcmaExtraRows) {
  const container = document.getElementById("pdPcmaSection");
  if (!container) return;

  // --- Combine ACTUAL (pcmaRows) + PCMA (pcmaExtraRows) per Year/Month ---
  const combinedMap = new Map(); // key = "YYYY-MM" => {year, month, monthNum, actual, pcma, remarks}

  function upsertEntry(sourceRow, type) {
    if (!sourceRow || !sourceRow.year || !sourceRow.month) return;

    const mNum = monthNameToNumber(sourceRow.month);
    if (!mNum) return;

    const key = sourceRow.year + "-" + String(mNum).padStart(2, "0");
    let entry = combinedMap.get(key);
    if (!entry) {
      entry = {
        year: sourceRow.year,
        month: sourceRow.month,
        monthNum: mNum,
        actual: null,
        pcma: null,
        remarks: "",
      };
      combinedMap.set(key, entry);
    }

    if (typeof sourceRow.percentage === "number") {
      if (type === "actual") entry.actual = sourceRow.percentage;
      if (type === "pcma") entry.pcma = sourceRow.percentage;
    }

    // Use first non-empty remarks we find
    if (sourceRow.remarks && !entry.remarks) {
      entry.remarks = sourceRow.remarks;
    }
  }

  (pcmaRows || []).forEach((r) => upsertEntry(r, "actual")); // 2025 January, etc. = ACTUAL
  (pcmaExtraRows || []).forEach((r) => upsertEntry(r, "pcma")); // 2025 January PCMA, etc. = PCMA

  let rows = Array.from(combinedMap.values());

  // Remove rows with absolutely no data
  rows = rows.filter(
    (r) =>
      typeof r.actual === "number" ||
      typeof r.pcma === "number" ||
      (r.remarks && String(r.remarks).trim() !== "")
  );

  if (!rows.length) {
    container.innerHTML =
      "<h3>MONTHLY ACCOMPLISHMENT</h3><p>No Monthly Accomplishment data for this Contract ID.</p>";
    return;
  }

  // Sort by Year then Month
  rows.sort((a, b) => {
    const ya = parseInt(a.year, 10) || 0;
    const yb = parseInt(b.year, 10) || 0;
    if (ya !== yb) return ya - yb;
    return a.monthNum - b.monthNum;
  });

  // --- Build HTML: YEAR row + indented MONTH rows ---
  let html = "<h3>MONTHLY ACCOMPLISHMENT</h3>";
  html +=
    '<div class="pd-table-wrapper"><table class="pd-table pd-table-pcma"><thead><tr>' +
    "<th>MONTH</th><th>ACTUAL</th><th>PCMA</th><th>REMARKS</th>" +
    "</tr></thead><tbody>";

  let currentYear = null;

  rows.forEach((r) => {
    // Year row (e.g. "2025")
    if (r.year !== currentYear) {
      currentYear = r.year;
      html +=
        '<tr class="pd-year-row"><td class="pd-year-label" colspan="4">' +
        (currentYear || "") +
        "</td></tr>";
    }

    const actualDisplay =
      typeof r.actual === "number" ? r.actual + "%" : "";
    const pcmaDisplay =
      typeof r.pcma === "number" ? r.pcma + "%" : "";

    html +=
      "<tr>" +
      // 4 spaces before month name
      '<td class="col-month">&nbsp;&nbsp;&nbsp;&nbsp;' +
      (r.month || "") +
      "</td>" +
      '<td class="col-actual">' +
      actualDisplay +
      "</td>" +
      '<td class="col-pcma">' +
      pcmaDisplay +
      "</td>" +
      '<td class="pd-remarks">' +
      (r.remarks || "") +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
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
    "<h3>VARIATION ORDER (VO)</h3>" +
    '<div class="pd-table-wrapper"><table class="pd-table pd-table-vo"><thead><tr>' +
    "<th>VO</th><th>DATE</th><th>ADD'L DAYS</th><th>REMARKS</th>" +
    "</tr></thead><tbody>";

  voRows.forEach((r) => {
    html +=
      "<tr>" +
      '<td class="col-vo">' +
      r.label +
      "</td>" +
      '<td class="col-date">' +
      (r.date || "") +
      "</td>" +
      '<td class="col-days">' +
      (r.days || "") +
      "</td>" +
      '<td class="pd-remarks">' +
      (r.remarks || "") +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}



function renderWsoSection(wsoRows) {
  const container = document.getElementById("pdWsoSection");
  if (!container) return;

  if (!wsoRows.length) {
    container.innerHTML =
      "<h3>SUSPENSION ORDER</h3><p>No WSO/WRO/CTE data for this Contract ID.</p>";
    return;
  }

  let html = "<h3>SUSPENSION ORDER</h3>";

  // --- Suspension Order (WSO / CWSO / WRO) ---
  html +=
    '<div class="pd-table-wrapper"><table class="pd-table pd-table-wso"><thead><tr>' +
    "<th>CODE</th><th>DATE</th><th>REASON</th>" +
    "</tr></thead><tbody>";

  wsoRows.forEach((r) => {
    html +=
      "<tr>" +
      '<td class="col-code">' +
      r.code +
      "</td>" +
      '<td class="col-date">' +
      (r.date || "") +
      "</td>" +
      '<td class="pd-remarks">' +
      (r.reason || "") +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";

  container.innerHTML = html;
}

function renderCteSection(cteRows) {
  const container = document.getElementById("pdCteSection");
  if (!container) return;

  if (!cteRows.length) {
    container.innerHTML =
      "<h3>CONTRACT TIME EXTENSION (CTE)</h3><p>No CTE data for this Contract ID.</p>";
    return;
  }

  let html =
    "<h3>CONTRACT TIME EXTENSION (CTE)</h3>" +
    '<div class="pd-table-wrapper"><table class="pd-table pd-table-cte"><thead><tr>' +
    "<th>CTE</th><th>DAYS</th><th>REMARKS</th>" +
    "</tr></thead><tbody>";

  cteRows.forEach((r) => {
    html +=
      "<tr>" +
      '<td class="col-code">' +
      r.code +
      "</td>" +
      '<td class="col-days">' +
      (r.days || "") +
      "</td>" +
      '<td class="pd-remarks">' +
      (r.remarks || "") +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}




function renderBillingSection(billingRows) {
  const container = document.getElementById("pdBillingSection");
  if (!container) return;

  if (!billingRows.length) {
    container.innerHTML =
      "<h3>BILLING</h3><p>No Billing data for this Contract ID.</p>";
    return;
  }

  let html =
    "<h3>BILLING</h3>" +
    '<div class="pd-table-wrapper"><table class="pd-table pd-table-billing"><thead><tr>' +
    "<th>YEAR</th><th>MONTH</th><th>AMOUNT</th><th>REMARKS</th>" +
    "</tr></thead><tbody>";

  billingRows.forEach((r) => {
    html +=
      "<tr>" +
      '<td class="col-year">' +
      (r.year || "") +
      "</td>" +
      '<td class="col-month">' +
      (r.month || "") +
      "</td>" +
      '<td class="col-amount">' +
      (r.amount || "") +
      "</td>" +
      '<td class="pd-remarks">' +
      (r.remarks || "") +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}


  // ---------- S-CURVE CHART (ACTUAL + PCMA + BILLING) ----------

  function buildSCurveChart(pcmaRows, pcmaExtraRows, billingRows) {
    const canvas = document.getElementById("pdSCurveCanvas");
    if (!canvas || typeof Chart === "undefined") return;

    const monthMap = new Map(); // key => {year,month,monthNum}

    function addRows(rows) {
      rows.forEach((r) => {
        if (!r || !r.year || !r.month) return;
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
    addRows(pcmaExtraRows);
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
      if (!r || typeof r.year === "undefined") return;
      const mNum = monthNameToNumber(r.month);
      if (!mNum) return;
      const key = r.year + "-" + String(mNum).padStart(2, "0");
      pcmaByKey[key] =
        typeof r.percentage === "number" ? r.percentage : null;
    });

    const pcmaExtraByKey = {};
    pcmaExtraRows.forEach((r) => {
      if (!r || typeof r.year === "undefined") return;
      const mNum = monthNameToNumber(r.month);
      if (!mNum) return;
      const key = r.year + "-" + String(mNum).padStart(2, "0");
      pcmaExtraByKey[key] =
        typeof r.percentage === "number" ? r.percentage : null;
    });

    const billingByKey = {};
    billingRows.forEach((r) => {
      if (!r || typeof r.year === "undefined") return;
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

    const pcmaExtraData = entries.map(([key]) => {
      const v = pcmaExtraByKey[key];
      return typeof v === "number" ? v : null;
    });

    const billingData = entries.map(([key]) => {
      const v = billingByKey[key];
      return typeof v === "number" ? v : null;
    });

    const ctx = canvas.getContext("2d");

    if (scurveChart) scurveChart.destroy();


// Plugin to show % in a colored container above each point,
// and automatically move containers up if they overlap
const dataLabelPlugin = {
  id: "pdDataLabelPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const placedBoxes = []; // track label boxes to avoid overlap

    // simple rectangle overlap check
    function overlaps(a, b) {
      return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
      );
    }

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      // skip hidden datasets
      if (!chart.isDatasetVisible(datasetIndex)) return;

      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((point, index) => {
        const value = dataset.data[index];
        if (value == null) return;

        const pos = point.tooltipPosition();
        const fontSize = 9;
        const fontFamily = "Arial";

        ctx.save();
        ctx.font = fontSize + "px " + fontFamily;

        const text = value + "%";
        const textWidth = ctx.measureText(text).width;

        const paddingX = 4; // left/right padding inside container
        const paddingY = 2; // top/bottom padding inside container
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = fontSize + paddingY * 2;

        // base position (slightly above point, staggered per dataset)
        const baseOffsetY = 8 + datasetIndex * 10;
        let x = pos.x;
        let y = pos.y - baseOffsetY;

        // initial box around the label
        let box = {
          left: x - boxWidth / 2,
          right: x + boxWidth / 2,
          top: y - boxHeight,
          bottom: y,
        };

        // move the box up until it no longer overlaps a previous one
        let safety = 0;
        const maxShifts = 20;
        while (
          placedBoxes.some((b) => overlaps(b, box)) &&
          safety < maxShifts
        ) {
          y -= boxHeight + 2; // push up by one box height
          box.top = y - boxHeight;
          box.bottom = y;
          safety++;
        }

        // pick colors based on which dataset (ACTUAL / PCMA / BILLING)
        const label = (dataset.label || "").toUpperCase();
        let fillColor = "rgba(255, 255, 255, 0.9)";
        let strokeColor = "rgba(148, 163, 184, 0.9)";
        let textColor = "#000000";

        if (label === "ACTUAL") {
          // green
          fillColor = "rgba(0, 128, 0, 0.9)";
          strokeColor = "rgba(0, 100, 0, 1)";
          textColor = "#ffffff";
        } else if (label === "PCMA") {
          // blue
          fillColor = "rgba(37, 99, 235, 0.9)";
          strokeColor = "rgba(30, 64, 175, 1)";
          textColor = "#ffffff";
        } else if (label === "BILLING") {
          // red
          fillColor = "rgba(220, 38, 38, 0.9)";
          strokeColor = "rgba(185, 28, 28, 1)";
          textColor = "#ffffff";
        }

        // draw rounded rectangle (the "container")
        const radius = 3;
        const x0 = box.left;
        const y0 = box.top;
        const x1 = box.right;
        const y1 = box.bottom;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.beginPath();
        ctx.moveTo(x0 + radius, y0);
        ctx.lineTo(x1 - radius, y0);
        ctx.quadraticCurveTo(x1, y0, x1, y0 + radius);
        ctx.lineTo(x1, y1 - radius);
        ctx.quadraticCurveTo(x1, y1, x1 - radius, y1);
        ctx.lineTo(x0 + radius, y1);
        ctx.quadraticCurveTo(x0, y1, x0, y1 - radius);
        ctx.lineTo(x0, y0 + radius);
        ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
        ctx.closePath();

        // filled container with border
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 0.8;
        ctx.fill();
        ctx.stroke();

        // percentage text inside the container
        const textY = (box.top + box.bottom) / 2;
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, textY);

        ctx.restore();

        // remember this box so next labels can avoid it
        placedBoxes.push(box);
      });
    });
  },
};




    scurveChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          // Green – base PCMA values (this is your ACTUAL line)
          {
            label: "ACTUAL",
            data: pcmaData,
            tension: 0.4, // smooth S-line
            borderColor: "rgba(0, 128, 0, 1)",
            backgroundColor: "rgba(0, 128, 0, 0.2)", // green fill
            borderWidth: 0.8,
            pointBackgroundColor: "rgba(0, 128, 0, 1)",
            pointRadius: 3,
            spanGaps: true,
            fill: true, // fill from 0% line
          },
          // Blue – columns like "2025 November PCMA"
          {
            label: "PCMA",
            data: pcmaExtraData,
            tension: 0.4,
            borderColor: "rgba(37, 99, 235, 1)", // blue line
            backgroundColor: "rgba(37, 99, 235, 0.25)", // transparent blue fill
            borderWidth: 0.8,
            pointBackgroundColor: "rgba(37, 99, 235, 1)",
            pointRadius: 3,
            spanGaps: true,
            fill: true,
          },
          // Red – Billing(2025)
          {
            label: "BILLING",
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
        maintainAspectRatio: false, // height controlled by CSS
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
              callback(value) {
                return value + "%"; // 0% – 100% left side
              },
            },
            title: {
              display: true,
              text: "Percentage",
            },
          },
          x: {
            grid: {
              display: true, // vertical lines per month
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

    // Bind checkboxes to show/hide lines
    function bindToggle(id, datasetIndex) {
      const checkbox = document.getElementById(id);
      if (!checkbox) return;
      // initial state: checked and visible
      checkbox.checked = scurveChart.isDatasetVisible(datasetIndex);
      checkbox.onchange = function () {
        scurveChart.setDatasetVisibility(datasetIndex, checkbox.checked);
        scurveChart.update();
      };
    }

    bindToggle("pdToggleActual", 0);
    bindToggle("pdTogglePcma", 1);
    bindToggle("pdToggleBilling", 2);
  }

  // ---------- Overlay + body skeleton ----------

  function openOverlay() {
    const overlay = document.getElementById("projectDocsOverlay");
    if (!overlay) return;
    overlay.hidden = false;
  }

  function closeOverlay() {
    const overlay = document.getElementById("projectDocsOverlay");
    if (!overlay) return;
    overlay.hidden = true;

    if (scurveChart) {
      scurveChart.destroy();
      scurveChart = null;
    }
  }

function buildBodySkeleton() {
  const body = document.getElementById("projectDocsBody");
  if (!body) return { body: null, loadingEl: null };

  body.innerHTML =
    '<div id="projectDocsLoading" class="pd-loading">Loading documentation…</div>' +
    // 1. MONTHLY ACCOMPLISHMENT
    '<section id="pdPcmaSection" class="pd-section"></section>' +
    // 2. S-Curve (toggles + chart)
    '<div class="pd-scurve-controls">' +
    '<label class="pd-toggle"><input type="checkbox" id="pdToggleActual" checked><span>ACTUAL</span></label>' +
    '<label class="pd-toggle"><input type="checkbox" id="pdTogglePcma" checked><span>PCMA</span></label>' +
    '<label class="pd-toggle"><input type="checkbox" id="pdToggleBilling" checked><span>BILLING</span></label>' +
    "</div>" +
    '<div class="pd-scurve-wrapper"><canvas id="pdSCurveCanvas"></canvas></div>' +
    // 3. BILLING
    '<section id="pdBillingSection" class="pd-section"></section>' +
    // 4. WSO / WRO / CTE (Suspension Order table)
    '<section id="pdWsoSection" class="pd-section"></section>' +
    // 5. VARIATION ORDER (VO)
    '<section id="pdVoSection" class="pd-section"></section>' +
    // 6. CONTRACT TIME EXTENSION (CTE) – separate section
    '<section id="pdCteSection" class="pd-section"></section>';

  const loadingEl = document.getElementById("projectDocsLoading");
  return { body, loadingEl };
}


  // ---------- MAIN OPEN FUNCTION ----------

async function openProjectDocs(contractId) {
    // Fallback: read Contract ID from modal label if not passed
    if (!contractId) {
      const cidEl = document.getElementById("pcmaModalCID");
      if (cidEl) contractId = cidEl.textContent.trim();
    }

    if (!contractId) {
      alert("No Contract ID found.");
      return;
    }

    openOverlay();

    const { body, loadingEl } = buildBodySkeleton();
    if (!body) return;
    if (loadingEl) loadingEl.style.display = "block";

    try {
      const [pcmaValues, voValues, wsoValues, billingSheet] =
        await Promise.all([
          fetchValues("PCMA"),
          fetchValues("VO"),
          fetchValues("WSO/WRO/CTE"),
          fetchBillingSheet(),
        ]);

      const pcmaRows = buildPcmaRows(pcmaValues, contractId);
      const pcmaExtraRows = buildPcmaExtraRows(pcmaValues, contractId);
      const voRows = buildVoRows(voValues, contractId);
      const { wsoRows, cteRows } = buildWsoAndCteRows(
        wsoValues,
        contractId
      );
      const billingRows = buildBillingRows(billingSheet, contractId);

renderPcmaSection(pcmaRows, pcmaExtraRows);
renderBillingSection(billingRows);
renderWsoSection(wsoRows);
renderVoSection(voRows);
renderCteSection(cteRows);
buildSCurveChart(pcmaRows, pcmaExtraRows, billingRows);

    } catch (err) {
      console.error("ProjectDocs error:", err);
      if (body) {
        body.innerHTML =
          '<div class="pd-error">Error loading Project Documentation. Please try again.</div>';
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }



// ---------- Setup close button & background click ----------


// ---------- Setup close button & background click ----------

function setupOverlayClose() {
  const closeBtn = document.getElementById("pdCloseBtn");
  const overlay  = document.getElementById("projectDocsOverlay");

  // Close button (inside PROJECT DOCUMENTATION window)
  if (closeBtn) {
    closeBtn.addEventListener("click", closeOverlay);
  }

  // Click outside the box to close
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeOverlay();
      }
    });
  }

  // Use event delegation so it still works even if the button
  // is recreated dynamically inside the PCMA modal.
  document.addEventListener("click", (e) => {
    if (!e.target) return;
    const btn = e.target.closest ? e.target.closest("#projectDocsBtn") : null;
    if (!btn) return;

    // If no contractId is passed, openProjectDocs() will read #pcmaModalCID
    openProjectDocs();
  });
}


  // Expose globally so HTML onclick="openProjectDocs()" can use it
  window.openProjectDocs = openProjectDocs;

  // Script is loaded at the end of <body>, so DOM is ready now.
  setupOverlayClose();
})();

