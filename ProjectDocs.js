// ProjectDocs.js
// Project Documentation overlay:
// - PCMA: Year | Month | Percentage | Remarks + S-curve
// - VO: VO1–VO5 (VO, Date, Additional Days, Remarks)
// - WSO/WRO/CTE: WSO1–4 + CTE1–10
// - BILLING: 2025 Month Billing + Remarks
// All filtered by Contract ID shown in #pcmaModalCID

document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
  const API_KEY = "AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8";

  const RANGE_PCMA = "PCMA";
  const RANGE_VO   = "VO";
  const RANGE_WSO  = "WSO/WRO/CTE";
  const RANGE_BILL = "BILLING";

  const overlay   = document.getElementById("projectDocsOverlay");
  const bodyEl    = document.getElementById("projectDocsBody");
  const loadingEl = document.getElementById("projectDocsLoading");
  const closeBtn  = document.getElementById("pdCloseBtn");
  
  
  
    let currentZoom = 1;

  function setupZoomControls() {
    if (!bodyEl) return;

    // Create zoom bar
    const bar = document.createElement("div");
    bar.className = "pd-zoom-bar";

    const label = document.createElement("span");
    label.className = "pd-zoom-bar-label";
    label.textContent = "Zoom";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.textContent = "-";

    const valueSpan = document.createElement("span");
    valueSpan.className = "pd-zoom-value";
    valueSpan.textContent = "100%";

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.textContent = "+";

    bar.appendChild(label);
    bar.appendChild(minusBtn);
    bar.appendChild(valueSpan);
    bar.appendChild(plusBtn);

    // Insert zoom bar just above the ProjectDocs body
    if (bodyEl.parentElement) {
      bodyEl.parentElement.insertBefore(bar, bodyEl);
    } else {
      bodyEl.insertAdjacentElement("beforebegin", bar);
    }

    // Mark body as zoomable (CSS uses this)
    bodyEl.classList.add("pd-body-zoomable");

    function applyZoom() {
      // On bigger screens, always reset to 100% (no zoom for desktop)
      if (window.innerWidth > 768) {
        currentZoom = 1;
      }
      valueSpan.textContent = Math.round(currentZoom * 100) + "%";
      bodyEl.style.setProperty("--pd-zoom-scale", currentZoom);
    }

    minusBtn.addEventListener("click", () => {
      // Only active on phone
      if (window.innerWidth > 768) return;
      currentZoom = Math.max(0.6, currentZoom - 0.1);  // min 60%
      applyZoom();
    });

    plusBtn.addEventListener("click", () => {
      if (window.innerWidth > 768) return;
      currentZoom = Math.min(1.4, currentZoom + 0.1);  // max 140%
      applyZoom();
    });

    window.addEventListener("resize", applyZoom);
    applyZoom();
  }

  
  
  
  

  if (!overlay || !bodyEl || !loadingEl || !closeBtn) {
    console.warn("ProjectDocs: overlay elements not found in DOM.");
    return;
  }

  // Setup zoom bar for ProjectDocs (mobile only)
  setupZoomControls();


  let pcmaData    = [];
  let voData      = [];
  let wsoData     = [];
  let billingData = [];
  let dataLoaded  = false;

  /* ---------- Helpers ---------- */

  function getCurrentCID() {
    const cidEl = document.getElementById("pcmaModalCID");
    if (!cidEl) return "";
    return String(cidEl.textContent || "").trim();
  }

  function cell(row, idx) {
    if (!row || idx == null || idx < 0 || idx >= row.length) return "";
    return String(row[idx] || "").trim();
  }

  function normalize(str) {
    return String(str || "").trim().toLowerCase();
  }

  function findColumnExact(headers, name) {
    const target = normalize(name);
    for (let i = 0; i < headers.length; i++) {
      if (normalize(headers[i]) === target) return i;
    }
    return -1;
  }

  function findColumnAny(headers, names) {
    const lowerHeaders = headers.map((h) => normalize(h));
    const lowerNames   = names.map((n) => normalize(n));
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (lowerNames.includes(lowerHeaders[i])) return i;
    }
    return -1;
  }

  function parsePercent(value) {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    let num;
    if (v.endsWith("%")) {
      num = parseFloat(v.replace("%", "").trim());
    } else {
      num = parseFloat(v);
    }
    if (isNaN(num)) return null;
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    return num;
  }

  function isHundred(value) {
    const pct = parsePercent(value);
    if (pct == null) return false;
    return Math.abs(pct - 100) < 0.0001;
  }
  
    function isRedText(cell) {
    if (!cell) return false;

    const fmt =
      (cell.effectiveFormat && cell.effectiveFormat.textFormat) ||
      (cell.userEnteredFormat && cell.userEnteredFormat.textFormat) ||
      cell.textFormat;

    if (!fmt || !fmt.foregroundColor) return false;

    const c = fmt.foregroundColor;
    const r = c.red != null ? c.red : 0;
    const g = c.green != null ? c.green : 0;
    const b = c.blue != null ? c.blue : 0;

    // "Red-ish": high red, low green/blue
    return r >= 0.8 && g <= 0.3 && b <= 0.3;
  }


  /* ---------- S-CURVE: smooth continuous S-line ---------- */

  function renderSCurve(container, points) {
    if (!points || points.length === 0) return;

    const block = document.createElement("div");
    block.className = "pd-scurve-block";

    const title = document.createElement("div");
    title.className = "pd-scurve-title";
    title.textContent = "S-Curve (Percentage vs Month)";
    block.appendChild(title);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "pd-scurve-svg");
    svg.setAttribute("viewBox", "0 0 100 60");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // don't stretch

    const chartLeft   = 15;  // space for 0–100% labels
    const chartRight  = 95;
    const chartTop    = 5;
    const chartBottom = 55;
    const chartWidth  = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // Axes
    const axisX = document.createElementNS(svgNS, "line");
    axisX.setAttribute("x1", chartLeft);
    axisX.setAttribute("y1", chartBottom);
    axisX.setAttribute("x2", chartRight);
    axisX.setAttribute("y2", chartBottom);
    axisX.setAttribute("stroke", "#9ca3af");
    axisX.setAttribute("stroke-width", "0.8");
    svg.appendChild(axisX);

    const axisY = document.createElementNS(svgNS, "line");
    axisY.setAttribute("x1", chartLeft);
    axisY.setAttribute("y1", chartBottom);
    axisY.setAttribute("x2", chartLeft);
    axisY.setAttribute("y2", chartTop);
    axisY.setAttribute("stroke", "#9ca3af");
    axisY.setAttribute("stroke-width", "0.8");
    svg.appendChild(axisY);

    // Y-axis ticks & labels
    const ticks = [0, 20, 40, 60, 80, 100];
    ticks.forEach((pct) => {
      const y = chartBottom - (chartHeight * pct) / 100;

      if (pct !== 0 && pct !== 100) {
        const grid = document.createElementNS(svgNS, "line");
        grid.setAttribute("x1", chartLeft);
        grid.setAttribute("y1", y);
        grid.setAttribute("x2", chartRight);
        grid.setAttribute("y2", y);
        grid.setAttribute("stroke", "#e5e7eb");
        grid.setAttribute("stroke-width", "0.5");
        svg.appendChild(grid);
      }

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", chartLeft - 2);
      label.setAttribute("y", y + 1.5);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("font-size", "3");
      label.setAttribute("fill", "#111827");
      label.textContent = `${pct}%`;
      svg.appendChild(label);
    });

    // Points → coords
    const coords = [];
    const n = points.length;
    points.forEach((pt, idx) => {
      const x = (n === 1)
        ? chartLeft + chartWidth / 2
        : chartLeft + (chartWidth * idx) / (n - 1);

      const y = chartBottom - (chartHeight * pt.pct) / 100;
      coords.push({ x, y, label: pt.label, pct: pt.pct });
    });

    if (!coords.length) {
      block.appendChild(svg);
      container.appendChild(block);
      return;
    }

    // Vertical lines per month
    coords.forEach((c) => {
      const vline = document.createElementNS(svgNS, "line");
      vline.setAttribute("x1", c.x);
      vline.setAttribute("y1", chartTop);
      vline.setAttribute("x2", c.x);
      vline.setAttribute("y2", chartBottom);
      vline.setAttribute("stroke", "#d1d5db");
      vline.setAttribute("stroke-width", "0.5");
      svg.appendChild(vline);
    });

    // If only one point: no curve
    if (coords.length === 1) {
      const c = coords[0];

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", c.x);
      circle.setAttribute("cy", c.y);
      circle.setAttribute("r", 1.5);
      circle.setAttribute("fill", "#16a34a");
      svg.appendChild(circle);

      const pctText = document.createElementNS(svgNS, "text");
      pctText.setAttribute("x", c.x);
      pctText.setAttribute("y", c.y - 2.5);
      pctText.setAttribute("text-anchor", "middle");
      pctText.setAttribute("font-size", "3");
      pctText.setAttribute("fill", "#16a34a");
      pctText.textContent = `${c.pct}%`;
      svg.appendChild(pctText);

      const monthLabel = document.createElementNS(svgNS, "text");
      monthLabel.setAttribute("x", c.x);
      monthLabel.setAttribute("y", chartBottom + 4);
      monthLabel.setAttribute("text-anchor", "middle");
      monthLabel.setAttribute("font-size", "3");
      monthLabel.setAttribute("fill", "#111827");
      monthLabel.textContent = c.label;
      svg.appendChild(monthLabel);

      block.appendChild(svg);
      container.appendChild(block);
      return;
    }

    // Smooth continuous S-curve via Catmull–Rom → Bézier
    let dCurve = "";
    let dArea  = "";

    const first = coords[0];
    dCurve = `M ${first.x} ${first.y}`;
    dArea  = `M ${first.x} ${chartBottom} L ${first.x} ${first.y}`;

    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i - 1] || coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      dCurve += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      dArea  += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = coords[coords.length - 1];
    dArea += ` L ${last.x} ${chartBottom} Z`;

    const areaPath = document.createElementNS(svgNS, "path");
    areaPath.setAttribute("d", dArea);
    areaPath.setAttribute("fill", "rgba(34, 197, 94, 0.18)");
    areaPath.setAttribute("stroke", "none");
    svg.appendChild(areaPath);

    const linePath = document.createElementNS(svgNS, "path");
    linePath.setAttribute("d", dCurve);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "#16a34a");
    linePath.setAttribute("stroke-width", "0.30"); // thinner line as requested
    svg.appendChild(linePath);

    coords.forEach((c) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", c.x);
      circle.setAttribute("cy", c.y);
      circle.setAttribute("r", 1.5);
      circle.setAttribute("fill", "#16a34a");
      svg.appendChild(circle);

      const pctText = document.createElementNS(svgNS, "text");
      pctText.setAttribute("x", c.x);
      pctText.setAttribute("y", c.y - 2.5);
      pctText.setAttribute("text-anchor", "middle");
      pctText.setAttribute("font-size", "3");
      pctText.setAttribute("fill", "#16a34a");
      pctText.textContent = `${c.pct}%`;
      svg.appendChild(pctText);

      const monthLabel = document.createElementNS(svgNS, "text");
      monthLabel.setAttribute("x", c.x);
      monthLabel.setAttribute("y", chartBottom + 4);
      monthLabel.setAttribute("text-anchor", "middle");
      monthLabel.setAttribute("font-size", "3");
      monthLabel.setAttribute("fill", "#111827");
      monthLabel.textContent = c.label;
      svg.appendChild(monthLabel);
    });

    block.appendChild(svg);
    container.appendChild(block);
  }

  /* ---------- Render PCMA + VO + WSO/CTE + BILLING ---------- */

  function renderDocs() {
    bodyEl.innerHTML = "";

    const currentCID = getCurrentCID();
    if (!currentCID) {
      const msg = document.createElement("div");
      msg.className = "pd-empty";
      msg.textContent =
        "No Contract ID selected. Open a project first, then click Project Documentation.";
      bodyEl.appendChild(msg);
      return;
    }

    const pcmaRows = pcmaData.filter((doc) => doc.cid && doc.cid === currentCID);
    const voRow    = voData.find((doc) => doc.cid && doc.cid === currentCID);
    const wsoRow   = wsoData.find((doc) => doc.cid && doc.cid === currentCID);
    const billRow  = billingData.find((doc) => doc.cid && doc.cid === currentCID);

    if (
      !pcmaRows.length &&
      (!voRow || !voRow.entries || !voRow.entries.length) &&
      (!wsoRow ||
        ((!wsoRow.wsoEntries || !wsoRow.wsoEntries.length) &&
         (!wsoRow.cteEntries || !wsoRow.cteEntries.length))) &&
      (!billRow || !billRow.months || !billRow.months.length)
    ) {
      const msg = document.createElement("div");
      msg.className = "pd-empty";
      msg.textContent = `No documentation found for Contract ID "${currentCID}".`;
      bodyEl.appendChild(msg);
      return;
    }

    /* ---- PCMA ---- */

    pcmaRows.forEach((doc, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "pd-row";

      const title = document.createElement("div");
      title.className = "pd-row-title";
      title.textContent = doc.cid
        ? `Contract ID: ${doc.cid}`
        : `PCMA Row ${idx + 1}`;
      wrapper.appendChild(title);

      const list = document.createElement("div");
      list.className = "pd-month-list";

      let reached100 = false;
      const chartPoints = [];

      function addMonth(year, monthLabel, value, remarks) {
        if (reached100) return;
        if (!value) return;

        const rowEl = document.createElement("div");
        rowEl.className = "pd-month-row";

        const ySpan = document.createElement("span");
        ySpan.className = "pd-month-year";
        ySpan.textContent = year;

        const mSpan = document.createElement("span");
        mSpan.className = "pd-month-name";
        mSpan.textContent = monthLabel;

        const vSpan = document.createElement("span");
        vSpan.className = "pd-month-value";
        vSpan.textContent = value;

        const rSpan = document.createElement("span");
        rSpan.className = "pd-month-remarks";
        rSpan.textContent = remarks || "";

        rowEl.appendChild(ySpan);
        rowEl.appendChild(mSpan);
        rowEl.appendChild(vSpan);
        rowEl.appendChild(rSpan);

        list.appendChild(rowEl);

        const pct = parsePercent(value);
        if (pct != null) {
          chartPoints.push({ label: monthLabel, pct });
        }

        if (isHundred(value)) {
          reached100 = true;
        }
      }

      // PCMA – 2025 months
      addMonth("2025", "June",      doc.val2025Jun, doc.rem2025Jun);
      addMonth("2025", "July",      doc.val2025Jul, doc.rem2025Jul);
      addMonth("2025", "August",    doc.val2025Aug, doc.rem2025Aug);
      addMonth("2025", "September", doc.val2025Sep, doc.rem2025Sep);
      addMonth("2025", "October",   doc.val2025Oct, doc.rem2025Oct);

      if (!list.children.length) {
        const msg = document.createElement("div");
        msg.className = "pd-empty";
        msg.textContent =
          "No documentation values for this Contract ID (all month values are empty or hidden).";
        wrapper.appendChild(msg);
      } else {
        const headerRow = document.createElement("div");
        headerRow.className = "pd-month-row pd-month-header";

        const hYear = document.createElement("span");
        hYear.className = "pd-month-year";
        hYear.textContent = "YEAR";

        const hMonth = document.createElement("span");
        hMonth.className = "pd-month-name";
        hMonth.textContent = "MONTH";

        const hPct = document.createElement("span");
        hPct.className = "pd-month-value";
        hPct.textContent = "ACCOMPLSIHMENT";

        const hRem = document.createElement("span");
        hRem.className = "pd-month-remarks";
        hRem.textContent = "REMARKS";

        headerRow.appendChild(hYear);
        headerRow.appendChild(hMonth);
        headerRow.appendChild(hPct);
        headerRow.appendChild(hRem);

        list.insertBefore(headerRow, list.firstChild);
        wrapper.appendChild(list);

        if (chartPoints.length) {
          renderSCurve(wrapper, chartPoints);
        }
      }

      bodyEl.appendChild(wrapper);
    });

    /* ---- VO (below PCMA) ---- */

    if (voRow && voRow.entries && voRow.entries.length) {
      const visibleEntries = voRow.entries.filter((e) => e.value);
      if (visibleEntries.length) {
        const wrapper = document.createElement("div");
        wrapper.className = "pd-row pd-row-vo";

        const title = document.createElement("div");
        title.className = "pd-row-title";
        title.textContent = "Variation Orders (VO)";
        wrapper.appendChild(title);

        const voList = document.createElement("div");
        voList.className = "pd-vo-list";

        const headerRow = document.createElement("div");
        headerRow.className = "pd-vo-row pd-vo-header";

        const hVo = document.createElement("span");
        hVo.textContent = "VO";

        const hDate = document.createElement("span");
        hDate.textContent = "DATE";

        const hDays = document.createElement("span");
        hDays.textContent = "ADD'L DAYS";

        const hRemarks = document.createElement("span");
        hRemarks.textContent = "REMARKS";

        headerRow.appendChild(hVo);
        headerRow.appendChild(hDate);
        headerRow.appendChild(hDays);
        headerRow.appendChild(hRemarks);

        voList.appendChild(headerRow);

        visibleEntries.forEach((entry) => {
          const rowEl = document.createElement("div");
          rowEl.className = "pd-vo-row";

          const voSpan = document.createElement("span");
          voSpan.textContent = entry.label;

          const dateSpan = document.createElement("span");
          dateSpan.textContent = entry.date || "";

          const daysSpan = document.createElement("span");
          daysSpan.textContent = entry.days || "";

          const remSpan = document.createElement("span");
          remSpan.textContent = entry.remarks || "";

          rowEl.appendChild(voSpan);
          rowEl.appendChild(dateSpan);
          rowEl.appendChild(daysSpan);
          rowEl.appendChild(remSpan);

          voList.appendChild(rowEl);
        });

        wrapper.appendChild(voList);
        bodyEl.appendChild(wrapper);
      }
    }

    /* ---- WSO / WRO / CTE (below VO) ---- */

    if (wsoRow) {
      const wsoEntries = (wsoRow.wsoEntries || []).filter(
        (e) => e.wsoDate || e.reason || e.cwsoDate || e.wroDate
      );
      const cteEntries = (wsoRow.cteEntries || []).filter(
        (e) => e.days || e.remarks
      );

      if (wsoEntries.length || cteEntries.length) {
        const wrapper = document.createElement("div");
        wrapper.className = "pd-row pd-row-wso";

        const title = document.createElement("div");
        title.className = "pd-row-title";
        title.textContent = "WSO / WRO / CTE";
        wrapper.appendChild(title);

        if (wsoEntries.length) {
          const wsoList = document.createElement("div");
          wsoList.className = "pd-wso-list";

          const headerRow = document.createElement("div");
          headerRow.className = "pd-wso-row pd-wso-header";

          const hWSO = document.createElement("span");
          hWSO.textContent = "WSO";

          const hDate = document.createElement("span");
          hDate.textContent = "DATE";

          const hReason = document.createElement("span");
          hReason.textContent = "REASON";

          headerRow.appendChild(hWSO);
          headerRow.appendChild(hDate);
          headerRow.appendChild(hReason);

          wsoList.appendChild(headerRow);

          wsoEntries.forEach((entry) => {
            // Row 1: WSO1  | (Value Date) | (Value Reason)
            if (entry.wsoDate || entry.reason) {
              const rowEl = document.createElement("div");
              rowEl.className = "pd-wso-row";

              const sWSO = document.createElement("span");
              sWSO.textContent = entry.label;            // e.g. "WSO1"

              const sDate = document.createElement("span");
              sDate.textContent = entry.wsoDate || "";   // WSO1 Date

              const sReason = document.createElement("span");
              sReason.textContent = entry.reason || "";  // WSO1 Reason

              rowEl.appendChild(sWSO);
              rowEl.appendChild(sDate);
              rowEl.appendChild(sReason);

              wsoList.appendChild(rowEl);
            }

            // Row 2: CSWO1a | (CWSO1a Date) | "Continuing Suspension"
            if (entry.cwsoDate) {
              const cwsoRow = document.createElement("div");
              cwsoRow.className = "pd-wso-row pd-wso-row-cwso";

              const cLabel = document.createElement("span");
              cLabel.textContent = entry.label.replace("WSO", "CSWO") + "a";

              const cDate = document.createElement("span");
              cDate.textContent = entry.cwsoDate;

              const cReason = document.createElement("span");
              cReason.textContent = "Continuing Suspension";

              cwsoRow.appendChild(cLabel);
              cwsoRow.appendChild(cDate);
              cwsoRow.appendChild(cReason);

              wsoList.appendChild(cwsoRow);
            }

            // Row 3: WRO1 | (WRO1 Date) | "Resolved"
            if (entry.wroDate) {
              const wroRow = document.createElement("div");
              wroRow.className = "pd-wso-row pd-wso-row-wro";

              const wLabel = document.createElement("span");
              wLabel.textContent = entry.label.replace("WSO", "WRO");

              const wDate = document.createElement("span");
              wDate.textContent = entry.wroDate;

              const wReason = document.createElement("span");
              wReason.textContent = "Resolved";

              wroRow.appendChild(wLabel);
              wroRow.appendChild(wDate);
              wroRow.appendChild(wReason);

              wsoList.appendChild(wroRow);
            }
          });

          wrapper.appendChild(wsoList);
        }

        if (cteEntries.length) {
          const cteList = document.createElement("div");
          cteList.className = "pd-cte-list";

          const headerRow = document.createElement("div");
          headerRow.className = "pd-cte-row pd-cte-header";

          const hCTE = document.createElement("span");
          hCTE.textContent = "CTE";

          const hDays = document.createElement("span");
          hDays.textContent = "DAYS";

          const hRem = document.createElement("span");
          hRem.textContent = "REMARKS";

          headerRow.appendChild(hCTE);
          headerRow.appendChild(hDays);
          headerRow.appendChild(hRem);

          cteList.appendChild(headerRow);

          cteEntries.forEach((entry) => {
            const rowEl = document.createElement("div");
            rowEl.className = "pd-cte-row";

            const sCTE = document.createElement("span");
            sCTE.textContent = entry.label;

            const sDays = document.createElement("span");
            sDays.textContent = entry.days || "";

            const sRem = document.createElement("span");
            sRem.textContent = entry.remarks || "";

            rowEl.appendChild(sCTE);
            rowEl.appendChild(sDays);
            rowEl.appendChild(sRem);

            cteList.appendChild(rowEl);
          });

          wrapper.appendChild(cteList);
        }

        bodyEl.appendChild(wrapper);
      }
    }

    /* ---- BILLING (below WSO/CTE) ---- */

    if (billRow && billRow.months && billRow.months.length) {
      const wrapper = document.createElement("div");
      wrapper.className = "pd-row pd-row-billing";

      const title = document.createElement("div");
      title.className = "pd-row-title";
      title.textContent = "Billing (2025)";
      wrapper.appendChild(title);

      const list = document.createElement("div");
      list.className = "pd-billing-list";

      // Header: YEAR | MONTH | BILLING | REMARKS
      const headerRow = document.createElement("div");
      headerRow.className = "pd-billing-row pd-billing-header";

      const hYear = document.createElement("span");
      hYear.textContent = "YEAR";

      const hMonth = document.createElement("span");
      hMonth.textContent = "MONTH";

      const hVal = document.createElement("span");
      hVal.textContent = "BILLING";

      const hRem = document.createElement("span");
      hRem.textContent = "REMARKS";

      headerRow.appendChild(hYear);
      headerRow.appendChild(hMonth);
      headerRow.appendChild(hVal);
      headerRow.appendChild(hRem);

      list.appendChild(headerRow);

      billRow.months.forEach((m) => {
        const rowEl = document.createElement("div");
        rowEl.className = "pd-billing-row";

        const ySpan = document.createElement("span");
        ySpan.textContent = m.year;

        const mSpan = document.createElement("span");
        mSpan.textContent = m.month;

        const vSpan = document.createElement("span");
        vSpan.textContent = m.value || "";
		
		        // Remarks + optional " - Paid"
        let remarksText = m.remarks || "";
        if (m.paid) {
          remarksText = remarksText
            ? `${remarksText} - Paid`
            : "Paid";
        }

        const rSpan = document.createElement("span");
        rSpan.textContent = remarksText;

        rowEl.appendChild(ySpan);
        rowEl.appendChild(mSpan);
        rowEl.appendChild(vSpan);
        rowEl.appendChild(rSpan);

        list.appendChild(rowEl);
      });

      wrapper.appendChild(list);
      bodyEl.appendChild(wrapper);
    }

    if (!bodyEl.children.length) {
      const msg = document.createElement("div");
      msg.className = "pd-empty";
      msg.textContent =
        "No documentation values for the selected Contract ID.";
      bodyEl.appendChild(msg);
    }
  }

  /* ---------- Load from Google Sheets: PCMA + VO + WSO/CTE + BILLING ---------- */

  async function loadDocs() {
    try {
      loadingEl.style.display = "block";
      loadingEl.textContent = "Loading documentation…";

      const urlPcma =
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/` +
        encodeURIComponent(RANGE_PCMA) +
        `?key=${API_KEY}`;

      const urlVo =
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/` +
        encodeURIComponent(RANGE_VO) +
        `?key=${API_KEY}`;

      const urlWso =
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/` +
        encodeURIComponent(RANGE_WSO) +
        `?key=${API_KEY}`;

      const urlBillVals =
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/` +
        encodeURIComponent(RANGE_BILL) +
        `?key=${API_KEY}`;

      const urlBillFmt =
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}` +
        `?includeGridData=true&ranges=${encodeURIComponent(RANGE_BILL)}&key=${API_KEY}`;

      const [respPcma, respVo, respWso, respBillVals, respBillFmt] =
        await Promise.all([
          fetch(urlPcma),
          fetch(urlVo),
          fetch(urlWso),
          fetch(urlBillVals),
          fetch(urlBillFmt),
        ]);

      if (!respPcma.ok)  throw new Error("PCMA HTTP " + respPcma.status);
      if (!respVo.ok)    throw new Error("VO HTTP " + respVo.status);
      if (!respWso.ok)   throw new Error("WSO HTTP " + respWso.status);
      if (!respBillVals.ok) throw new Error("BILLING values HTTP " + respBillVals.status);
      if (!respBillFmt.ok)  throw new Error("BILLING format HTTP " + respBillFmt.status);

      const jsonPcma    = await respPcma.json();
      const jsonVo      = await respVo.json();
      const jsonWso     = await respWso.json();
      const jsonBillVals = await respBillVals.json();
      const jsonBillFmt  = await respBillFmt.json();


      /* ---- PCMA ---- */
      const valuesPcma = jsonPcma.values || [];
      if (valuesPcma.length >= 3) {
        const headerPcma = valuesPcma[2] || [];
        const dataPcma   = valuesPcma.slice(3);

        const idxCID = findColumnAny(headerPcma, [
          "cid",
          "contract id",
          "contractid",
        ]);

        const idx2025Jun = findColumnExact(headerPcma, "2025 June");
        const idx2025Jul = findColumnExact(headerPcma, "2025 July");
        const idx2025Aug = findColumnExact(headerPcma, "2025 August");
        const idx2025Sep = findColumnExact(headerPcma, "2025 September");
        const idx2025Oct = findColumnExact(headerPcma, "2025 October");

        const idxJunRem = findColumnExact(headerPcma, "25 Jun Remarks");
        const idxJulRem = findColumnExact(headerPcma, "25 Jul Remarks");
        const idxAugRem = findColumnExact(headerPcma, "25 Aug Remarks");
        const idxSepRem = findColumnExact(headerPcma, "25 Sep Remarks");
        const idxOctRem = findColumnExact(headerPcma, "25 Oct Remarks");

        pcmaData = dataPcma.map((row) => ({
          cid: cell(row, idxCID),

          val2025Jun: cell(row, idx2025Jun),
          rem2025Jun: cell(row, idxJunRem),

          val2025Jul: cell(row, idx2025Jul),
          rem2025Jul: cell(row, idxJulRem),

          val2025Aug: cell(row, idx2025Aug),
          rem2025Aug: cell(row, idxAugRem),

          val2025Sep: cell(row, idx2025Sep),
          rem2025Sep: cell(row, idxSepRem),

          val2025Oct: cell(row, idx2025Oct),
          rem2025Oct: cell(row, idxOctRem),
        }));
      } else {
        pcmaData = [];
      }

      /* ---- VO ---- */
      const valuesVo = jsonVo.values || [];
      if (valuesVo.length >= 3) {
        const headerVo = valuesVo[2] || [];
        const dataVo   = valuesVo.slice(3);

        const idxCIDVo = findColumnAny(headerVo, [
          "cid",
          "contract id",
          "contractid",
        ]);

        const voCols = [];
        for (let i = 1; i <= 5; i++) {
          voCols.push({
            label: `VO${i}`,
            idxVal:  findColumnExact(headerVo, `VO${i}`),
            idxDate: findColumnExact(headerVo, `VO${i} Date`),
            idxDays: findColumnExact(headerVo, `VO${i} Additional Days`),
            idxRem:  findColumnExact(headerVo, `VO${i} Remarks`),
          });
        }

        voData = dataVo.map((row) => {
          const entries = voCols.map((cfg) => ({
            label: cfg.label,
            value: cell(row, cfg.idxVal),
            date:  cell(row, cfg.idxDate),
            days:  cell(row, cfg.idxDays),
            remarks: cell(row, cfg.idxRem),
          }));
          return {
            cid: cell(row, idxCIDVo),
            entries,
          };
        });
      } else {
        voData = [];
      }

      /* ---- WSO/WRO/CTE ---- */
      const valuesWso = jsonWso.values || [];
      if (valuesWso.length >= 3) {
        const headerWso = valuesWso[2] || [];
        const dataWso   = valuesWso.slice(3);

        const idxCIDWso = findColumnAny(headerWso, [
          "cid",
          "contract id",
          "contractid",
        ]);

        const wsoCols = [];
        for (let i = 1; i <= 4; i++) {
          wsoCols.push({
            label: `WSO${i}`,
            idxDate:    findColumnExact(headerWso, `WSO${i} Date`),
            idxReason:  findColumnExact(headerWso, `WSO${i} Reason`),
            idxCwso:    findColumnExact(headerWso, `CWSO${i}a Date`),
            idxWroDate: findColumnExact(headerWso, `WRO${i} Date`),
          });
        }

        const cteCols = [];
        for (let i = 1; i <= 10; i++) {
          cteCols.push({
            label: `CTE${i}`,
            idxDays: findColumnExact(headerWso, `CTE${i}`),
            idxRem:  findColumnExact(headerWso, `CTE${i} Remarks`),
          });
        }

        wsoData = dataWso.map((row) => ({
          cid: cell(row, idxCIDWso),
          wsoEntries: wsoCols.map((cfg) => ({
            label:   cfg.label,
            wsoDate: cell(row, cfg.idxDate),
            reason:  cell(row, cfg.idxReason),
            cwsoDate: cell(row, cfg.idxCwso),
            wroDate: cell(row, cfg.idxWroDate),
          })),
          cteEntries: cteCols.map((cfg) => ({
            label:   cfg.label,
            days:    cell(row, cfg.idxDays),
            remarks: cell(row, cfg.idxRem),
          })),
        }));
      } else {
        wsoData = [];
      }

      /* ---- BILLING ---- */
      const valuesBill = jsonBillVals.values || [];

      // Grid data (for formatting / text color)
      const gridBill =
        jsonBillFmt &&
        jsonBillFmt.sheets &&
        jsonBillFmt.sheets[0] &&
        jsonBillFmt.sheets[0].data &&
        jsonBillFmt.sheets[0].data[0] &&
        jsonBillFmt.sheets[0].data[0].rowData
          ? jsonBillFmt.sheets[0].data[0].rowData
          : [];

      if (valuesBill.length >= 3) {
        const headerBill = valuesBill[2] || [];
        const dataBill   = valuesBill.slice(3);

        const idxCIDBill = findColumnAny(headerBill, [
          "cid",
          "contract id",
          "contractid",
        ]);

        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        const monthConfigs = monthNames.map((month) => ({
          month,
          idxVal: findColumnExact(headerBill, `2025 ${month}`),
          idxRem: findColumnExact(headerBill, `2025 ${month} Remarks`),
        }));

        billingData = dataBill.map((row, rowIndex) => {
          // rowData index: 0=Row1, 1=Row2, 2=Header(Row3), so data rows start at index 3
          const gridRow = gridBill[3 + rowIndex] || null;

          const months = monthConfigs
            .filter((cfg) => cfg.idxVal !== -1 || cfg.idxRem !== -1)
            .map((cfg) => {
              const value   = cell(row, cfg.idxVal);
              const remarks = cell(row, cfg.idxRem);

              // Check if "Year Month" cell is red → Paid
              let paid = false;
              if (
                gridRow &&
                cfg.idxVal !== -1 &&
                gridRow.values &&
                gridRow.values[cfg.idxVal]
              ) {
                paid = isRedText(gridRow.values[cfg.idxVal]);
              }

              return {
                year: "2025",
                month: cfg.month,
                value,
                remarks,
                paid,
              };
            })
            // Hide if no billing value and no remarks
            .filter((m) => m.value || m.remarks);

          return {
            cid: cell(row, idxCIDBill),
            months,
          };
        });
      } else {
        billingData = [];
      }


      dataLoaded = true;
      loadingEl.style.display = "none";
      renderDocs();
    } catch (err) {
      console.error("ProjectDocs: failed to load", err);
      loadingEl.style.display = "block";
      loadingEl.textContent = "Failed to load documentation.";
    }
  }

  /* ---------- Open / Close ---------- */

  function openDocs() {
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    if (dataLoaded) {
      renderDocs();
    } else {
      loadDocs();
    }
  }

  function closeDocs() {
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  window.openProjectDocs = openDocs;

  closeBtn.addEventListener("click", closeDocs);

  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay) {
      closeDocs();
    }
  });

  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && !overlay.hidden) {
      closeDocs();
    }
  });
});
