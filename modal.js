// modal.js
(function () {
  const PCMA = window.PCMA;
  if (!PCMA) return;

  const modalBg = document.getElementById("modalBg");
  const modalContent = document.getElementById("modalContent");
  const modalButtons = document.getElementById("modalButtons");
  const modalImages = document.getElementById("modalImages"); // kept for future
  const modalCID = document.getElementById("modalCID");
  const closeModalTop = document.getElementById("closeModalTop");
  const modalPrevFloat = document.getElementById("modalPrevFloat");
  const modalNextFloat = document.getElementById("modalNextFloat");

  let modalNavList = [];
  let modalNavIndex = 0;

  function findCol() {
    const headers = PCMA.state.headers;
    const keys = [...arguments].map((k) => String(k).toLowerCase());
    return headers.findIndex((h) =>
      keys.some((k) => String(h || "").toLowerCase().includes(k))
    );
  }

  function showDetail(row) {
    document.body.classList.add("no-scroll");
    modalBg.classList.add("show");

    modalContent.innerHTML = "";
    modalButtons.innerHTML = "";
    if (modalImages) modalImages.innerHTML = "";

    const headers = PCMA.state.headers;
    const LOGO_FALLBACK = PCMA.config.LOGO_FALLBACK;

    const cidIdx = findCol("contract id");
    const projIdx = findCol("project name");
    const locIdx = findCol("location");
    const contIdx = findCol("contractor");
    const amtIdx = findCol("contract amount", "amount");
    const revAmtIdx = findCol(
      "rev. contract amount",
      "revised contract amount",
      "rev contract amount"
    );
    const ntpIdx = findCol("notice to proceed", "ntp");
    const expIdx = findCol("expiry date", "original expiry date");
    const revExpIdx = findCol("rev. expiry date", "revised expiry date", "rev expiry date");
    const statIdx = findCol("status");
    const remIdx = findCol("remarks");
    const lastBillIdx = findCol("last billing");
    const uploadCol = findCol("upload pictures");

    const peIdx = findCol("project engineer");
    const piIdx = findCol("project inspector");
    const reIdx = findCol("resident engineer");
    const qeIdx = findCol("quantity engineer");
    const meIdx = findCol("materials engineer");

    const schedIdx = findCol("sched");
    const actualIdx = findCol("actual");
    const slipIdx = findCol("slip");
    const delayIdx = findCol("delay");
    let progIdx = findCol("progress");
    if (progIdx < 0) progIdx = 18; // your previous default

    // hero image
    let heroImgUrl = row[29] ? String(row[29]).trim() : "";
    if (!heroImgUrl) {
      const imgs99 = PCMA.collectImageUrls(row);
      if (imgs99.length) heroImgUrl = imgs99[0].url;
    }

    modalCID.textContent = (cidIdx >= 0 ? row[cidIdx] : "") || "—";

    if (heroImgUrl) {
      const wrap = document.createElement("div");
      wrap.className = "modal-hero-wrap";
      const im = document.createElement("img");
      im.className = "modal-hero-img";
      im.src = heroImgUrl;
      im.onerror = () => {
        im.src = LOGO_FALLBACK;
      };
      wrap.appendChild(im);
      modalContent.appendChild(wrap);
    }

    // helper in modal
    function parseMoneyLocal(v) {
      if (!v) return null;
      const s = String(v).replace(/[^0-9.\-]/g, "");
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    }
    function fmtPHPLocal(n) {
      try {
        return "₱ " + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });
      } catch {
        return "₱ " + n;
      }
    }
    function fmtDateLocal(v) {
      if (!v) return "";
      const d = new Date(v);
      if (!isNaN(d)) {
        return d.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      }
      return v;
    }
    function makePrimaryRow(label, value, isStatus) {
      const r = document.createElement("div");
      r.className = "primary-row";
      const l = document.createElement("div");
      l.className = "primary-label";
      l.textContent = label + " :";
      const v = document.createElement("div");
      v.className = "primary-value";
      if (isStatus) v.classList.add("status");
      v.textContent = value;
      r.appendChild(l);
      r.appendChild(v);
      return r;
    }

    // primary block
    const primary = document.createElement("div");
    primary.className = "modal-primary";

    const colA = document.createElement("div");
    colA.className = "primary-col group-a";
    if (projIdx > -1 && row[projIdx])
      colA.appendChild(makePrimaryRow("Project Name", row[projIdx]));
    if (locIdx > -1 && row[locIdx])
      colA.appendChild(makePrimaryRow("Location", row[locIdx]));
    if (contIdx > -1 && row[contIdx])
      colA.appendChild(makePrimaryRow("Contractor", row[contIdx]));

    const colB = document.createElement("div");
    colB.className = "primary-col";
    if (amtIdx > -1 && row[amtIdx]) {
      const n = parseMoneyLocal(row[amtIdx]);
      colB.appendChild(
        makePrimaryRow(
          "Contract Amount",
          n != null ? fmtPHPLocal(n) : row[amtIdx]
        )
      );
    }
    if (revAmtIdx > -1 && row[revAmtIdx]) {
      const n = parseMoneyLocal(row[revAmtIdx]);
      colB.appendChild(
        makePrimaryRow(
          "Rev. Contract Amount",
          n != null ? fmtPHPLocal(n) : row[revAmtIdx]
        )
      );
    }

    const colC = document.createElement("div");
    colC.className = "primary-col";
    if (ntpIdx > -1 && row[ntpIdx])
      colC.appendChild(makePrimaryRow("NTP", fmtDateLocal(row[ntpIdx])));
    if (expIdx > -1 && row[expIdx])
      colC.appendChild(makePrimaryRow("Expiry Date", fmtDateLocal(row[expIdx])));
    if (revExpIdx > -1 && row[revExpIdx])
      colC.appendChild(
        makePrimaryRow("Rev. Expiry Date", fmtDateLocal(row[revExpIdx]))
      );
    if (statIdx > -1 && row[statIdx])
      colC.appendChild(makePrimaryRow("Status", row[statIdx], true));

    const colD = document.createElement("div");
    colD.className = "primary-col group-d";
    if (remIdx > -1 && row[remIdx])
      colD.appendChild(makePrimaryRow("Remarks", row[remIdx]));
    if (lastBillIdx > -1 && row[lastBillIdx])
      colD.appendChild(makePrimaryRow("Last Billing", row[lastBillIdx]));

    if (colA.children.length) primary.appendChild(colA);
    if (colB.children.length) primary.appendChild(colB);
    if (colC.children.length) primary.appendChild(colC);
    if (colD.children.length) primary.appendChild(colD);

    modalContent.appendChild(primary);

    // sched / actual / slippage
    const hasSched = schedIdx > -1 && row[schedIdx];
    const hasActual = actualIdx > -1 && row[actualIdx];
    const hasSlip = slipIdx > -1 && row[slipIdx];
    if (hasSched || hasActual || hasSlip) {
      const mini = document.createElement("div");
      mini.className = "mini-bars";

      function animateMiniBar(fillEl, value, duration, formatter) {
        const sign = value < 0 ? -1 : 1;
        const endAbs = Math.min(Math.abs(value), 100);
        const startTime = performance.now();
        function step(now) {
          const t = Math.min(1, (now - startTime) / duration);
          const cur = endAbs * t;
          fillEl.style.width = cur + "%";
          const disp = sign * cur;
          fillEl.textContent = formatter
            ? formatter(disp)
            : `${disp.toFixed(2)}%`;
          if (t < 1) requestAnimationFrame(step);
          else {
            fillEl.style.width = endAbs + "%";
            fillEl.textContent = formatter
              ? formatter(sign * endAbs)
              : `${(sign * endAbs).toFixed(2)}%`;
          }
        }
        requestAnimationFrame(step);
      }

      function colorForSlippage(num) {
        if (num > 0) return { bg: "#10b981", text: "#fff", sad: false };
        if (num <= 0 && num > -5) return { bg: "#fecaca", text: "#7f1d1d", sad: false };
        if (num <= -5 && num > -10) return { bg: "#f87171", text: "#fff", sad: true };
        if (num <= -10) return { bg: "#dc2626", text: "#fff", sad: true };
        return { bg: "#6b7280", text: "#fff", sad: false };
      }

      function makeMini(label, val, baseColor, isSlippage) {
        const r = document.createElement("div");
        r.className = "mini-row";
        const lab = document.createElement("div");
        lab.className = "mini-label";
        lab.textContent = label;
        const bar = document.createElement("div");
        bar.className = "mini-bar";
        const fill = document.createElement("div");
        fill.className = "mini-fill";
        bar.appendChild(fill);
        r.appendChild(lab);
        r.appendChild(bar);
        mini.appendChild(r);

        const num = PCMA.helpers.toPct(val, 0);
        if (isSlippage) {
          const cfg = colorForSlippage(num);
          fill.style.background = cfg.bg;
          fill.style.color = cfg.text;
          animateMiniBar(fill, num, 800, (v) =>
            `${v.toFixed(2)}%${cfg.sad && v <= -10 ? " ☹️" : ""}`
          );
        } else {
          fill.style.background = baseColor;
          animateMiniBar(fill, num, 800, (v) => `${v.toFixed(2)}%`);
        }
      }

      if (hasSched) makeMini("SCHED", row[schedIdx], "#3b82f6", false);
      if (hasActual) makeMini("ACTUAL", row[actualIdx], "#10b981", false);
      if (hasSlip) makeMini("SLIPPAGE", row[slipIdx], null, true);

      const progRaw = progIdx > -1 && row[progIdx] ? String(row[progIdx]).trim() : "";
      const delayRaw = delayIdx > -1 && row[delayIdx] ? String(row[delayIdx]).trim() : "";
      if (progRaw) {
        const wrap = document.createElement("div");
        wrap.className = "progress-wrap";
        const label = document.createElement("div");
        label.className = "progress-label";
        label.textContent = "Time Lapsed";
        const bar = document.createElement("div");
        bar.className = "progress-bar";
        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.textContent = "0%";
        bar.appendChild(fill);
        wrap.appendChild(label);
        wrap.appendChild(bar);
        mini.appendChild(wrap);

        const pctNum = Math.max(0, PCMA.helpers.toPct(progRaw, 0));
        function colorFor(v) {
          if (v > 100) return "#dc2626";
          if (v >= 100) return "#16a34a";
          if (v > 80) return "#f97316";
          return "#60a5fa";
        }
        fill.style.background = colorFor(pctNum);
        requestAnimationFrame(() => {
          const startTime = performance.now();
          const duration = 900;
          (function step(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const curr = pctNum * t;
            const width = Math.min(curr, 100);
            fill.style.width = width + "%";
            fill.textContent = `${Math.round(curr)}%${
              delayRaw ? " (" + delayRaw + ")" : ""
            }`;
            if (t < 1) requestAnimationFrame(step);
            else {
              fill.style.width = Math.min(pctNum, 100) + "%";
              fill.style.background = colorFor(pctNum);
              fill.textContent = `${Math.round(pctNum)}%${
                delayRaw ? " (" + delayRaw + ")" : ""
              }`;
            }
          })(startTime);
        });
      }

      modalContent.appendChild(mini);
    }

    // upload btn
    if (uploadCol > -1) {
      const link = (row[uploadCol] || "").trim();
      if (link && PCMA.helpers.isValidUrl(link)) {
        const b = document.createElement("button");
        b.id = "uploadBtn";
        b.textContent = "Upload Picture";
        b.onclick = (e) => {
          e.stopPropagation();
          window.open(link, "_blank", "noopener");
        };
        modalButtons.appendChild(b);
      }
    }

    // View Picture (always)
    const viewBtn = document.createElement("button");
    viewBtn.id = "viewPictureBtn";
    viewBtn.textContent = "View Picture";
    viewBtn.onclick = (e) => {
      e.stopPropagation();
      if (PCMA.openFloatingGallery) PCMA.openFloatingGallery(row);
    };
    modalButtons.appendChild(viewBtn);

    // Projector
    const presentBtn = document.createElement("button");
    presentBtn.id = "presentBtn";
    presentBtn.textContent = "Present (Projector Mode)";
    presentBtn.onclick = (e) => {
      e.stopPropagation();
      if (PCMA.openPresentation) PCMA.openPresentation(row);
    };
    modalButtons.appendChild(presentBtn);

    // TEAM badges
    let teamHtml = "";
    function addRole(label, idx) {
      if (idx > -1 && row[idx]) {
        return `<span class="detail-value staff-badge" style="background:#e2e8f0;color:#0f172a;border-radius:999px;padding:4px 10px;font-weight:700;font-size:.78rem;"><strong>${label}:</strong> ${row[idx]}</span>`;
      }
      return "";
    }
    teamHtml += addRole("PE", peIdx);
    teamHtml += addRole("PI", piIdx);
    teamHtml += addRole("RE", reIdx);
    teamHtml += addRole("QE", qeIdx);
    teamHtml += addRole("ME", meIdx);
    if (teamHtml.trim()) {
      const team = document.createElement("div");
      team.className = "detail-row";
      team.innerHTML = `<span class="detail-label" style="font-weight:700;color:#475569;">TEAM</span><div style="display:flex;gap:6px;flex-wrap:wrap;">${teamHtml}</div>`;
      modalContent.appendChild(team);
    }
  }

  function closeModal() {
    modalBg.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  function goModal(delta) {
    if (!modalNavList.length) return;
    let next = modalNavIndex + delta;
    if (next < 0) next = 0;
    if (next > modalNavList.length - 1) next = modalNavList.length - 1;
    if (next === modalNavIndex) return;
    modalNavIndex = next;
    showDetail(modalNavList[modalNavIndex]);
  }

  // expose to other files (search.js uses this)
  PCMA.openDetailFromList = function (idx) {
    modalNavList = PCMA.state.lastRenderedRows.slice();
    modalNavIndex = idx;
    showDetail(modalNavList[modalNavIndex]);
  };

  // events
  closeModalTop.addEventListener("click", closeModal);
  modalBg.addEventListener("click", (e) => {
    if (e.target === modalBg) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBg.classList.contains("show")) {
      closeModal();
    }
    if (e.key === "ArrowRight" && modalBg.classList.contains("show")) {
      goModal(1);
    }
    if (e.key === "ArrowLeft" && modalBg.classList.contains("show")) {
      goModal(-1);
    }
  });
  modalPrevFloat.addEventListener("click", (e) => {
    e.stopPropagation();
    goModal(-1);
  });
  modalNextFloat.addEventListener("click", (e) => {
    e.stopPropagation();
    goModal(1);
  });
})();
