// projector.js
(function () {
  const PCMA = window.PCMA;
  if (!PCMA) return;

  const presentOverlay = document.getElementById("presentOverlay");
  const presentSlides = document.getElementById("presentSlides");
  const presentThumbs = document.getElementById("presentThumbs");
  const presentCID = document.getElementById("presentCID");
  const presentProj = document.getElementById("presentProj");
  const presentContractor = document.getElementById("presentContractor");
  const presentAmt = document.getElementById("presentAmt");
  const presentRevAmt = document.getElementById("presentRevAmt");
  const presentNTP = document.getElementById("presentNTP");
  const presentExpiry = document.getElementById("presentExpiry");
  const presentRevExpiry = document.getElementById("presentRevExpiry");
  const presentRemarks = document.getElementById("presentRemarks");
  const presentStatusChip = document.getElementById("presentStatusChip");
  const presentCounter = document.getElementById("presentCounter");
  const presentPrev = document.getElementById("presentPrev");
  const presentNext = document.getElementById("presentNext");
  const presentPlay = document.getElementById("presentPlay");
  const presentOpen = document.getElementById("presentOpen");
  const presentClose = document.getElementById("presentClose");

  const LOGO_FALLBACK = PCMA.config.LOGO_FALLBACK;

  const presentState = {
    items: [],
    index: 0,
    row: null,
    timer: null,
    delay: 6000,
  };

  function statusChipColor(t) {
    const s = (t || "").toLowerCase().trim();
    if (s === "completed (pcma)" || s === "pcma") return "#2563eb";
    if (s === "completed") return "#16a34a";
    if (s === "on-going") return "#f59e0b";
    if (s === "100%") return "#14b8a6";
    return "#64748b";
  }

  function fmtDateSafe(x) {
    const raw = (x || "").toString().trim();
    if (!raw) return "—";
    const d = new Date(raw);
    if (!isNaN(d))
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    return raw;
  }

  function showPresentIndex(i) {
    if (!presentState.items.length) return;
    const N = presentState.items.length;
    presentState.index = ((i % N) + N) % N;
    [...presentSlides.children].forEach((el, idx) =>
      el.classList.toggle("active", idx === presentState.index)
    );
    [...presentThumbs.children].forEach((el, idx) =>
      el.classList.toggle("active", idx === presentState.index)
    );
    presentCounter.textContent = `${presentState.index + 1} / ${N}`;
  }

  function startPresentAuto() {
    if (presentState.timer || !presentState.items.length) return;
    presentState.timer = setTimeout(function tick() {
      showPresentIndex(presentState.index + 1);
      presentState.timer = setTimeout(tick, presentState.delay);
    }, presentState.delay);
    presentPlay.textContent = "Pause";
  }
  function stopPresentAuto() {
    if (presentState.timer) {
      clearTimeout(presentState.timer);
      presentState.timer = null;
    }
    presentPlay.textContent = "Play";
  }

  function openPresentation(row) {
    presentState.row = row;
    const headers = PCMA.state.headers;

    const cidIdx = headers.findIndex((h) => h.includes("contract id"));
    const projIdx = headers.findIndex((h) => h.includes("project name"));
    const amtIdx = headers.findIndex((h) => h.includes("contract amount"));
    const revAmtIdx = headers.findIndex(
      (h) =>
        h.includes("rev. contract amount") ||
        h.includes("revised contract amount") ||
        h.includes("rev contract amount")
    );
    const contIdx = headers.findIndex((h) => h.includes("contractor"));
    const statIdx = headers.findIndex((h) => h.includes("status"));
    const ntpIdx = headers.findIndex(
      (h) => h.includes("notice to proceed") || h.includes("ntp")
    );
    const expIdx = headers.findIndex(
      (h) => h.includes("expiry date") || h.includes("original expiry date")
    );
    const revIdx = headers.findIndex(
      (h) =>
        h.includes("rev. expiry date") ||
        h.includes("revised expiry date") ||
        h.includes("rev expiry date")
    );
    const remIdx = headers.findIndex((h) => h.includes("remarks"));

    presentCID.textContent = cidIdx > -1 ? row[cidIdx] || "—" : "—";
    presentProj.textContent = projIdx > -1 ? row[projIdx] || "—" : "—";
    presentContractor.textContent = contIdx > -1 ? row[contIdx] || "—" : "—";

    const amtRaw = amtIdx > -1 ? row[amtIdx] : "";
    const revRaw = revAmtIdx > -1 ? row[revAmtIdx] : "";
    const amtNum = PCMA.helpers.parseMoney(amtRaw);
    const revNum = PCMA.helpers.parseMoney(revRaw);
    presentAmt.textContent = amtNum != null ? PCMA.helpers.fmtPHP(amtNum) : amtRaw || "—";
    presentRevAmt.textContent =
      revNum != null ? PCMA.helpers.fmtPHP(revNum) : revRaw || "—";

    presentNTP.textContent = fmtDateSafe(ntpIdx > -1 ? row[ntpIdx] : "");
    presentExpiry.textContent = fmtDateSafe(expIdx > -1 ? row[expIdx] : "");
    presentRevExpiry.textContent = fmtDateSafe(revIdx > -1 ? row[revIdx] : "");

    presentRemarks.textContent = remIdx > -1 ? row[remIdx] || "—" : "—";
    const st = statIdx > -1 ? row[statIdx] || "—" : "—";
    presentStatusChip.textContent = st;
    presentStatusChip.style.background = statusChipColor(st);

    // bars
    const colSched = headers.findIndex((h) => h.includes("sched"));
    const colActual = headers.findIndex((h) => h.includes("actual"));
    const colSlip = headers.findIndex((h) => h.includes("slip"));
    const s = PCMA.helpers.toPct(colSched > -1 ? row[colSched] : "0%");
    const a = PCMA.helpers.toPct(colActual > -1 ? row[colActual] : "0%");
    const l = PCMA.helpers.toPct(colSlip > -1 ? row[colSlip] : "0%");

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

    const sEl = document.getElementById("pMiniSched");
    const aEl = document.getElementById("pMiniActual");
    const lEl = document.getElementById("pMiniSlip");
    if (sEl) {
      sEl.style.background = "#3b82f6";
      animateMiniBar(sEl, s, 800, (v) => `${v.toFixed(2)}%`);
    }
    if (aEl) {
      aEl.style.background = "#10b981";
      animateMiniBar(aEl, a, 800, (v) => `${v.toFixed(2)}%`);
    }
    if (lEl) {
      const cfg = colorForSlippage(l);
      lEl.style.background = cfg.bg;
      lEl.style.color = cfg.text;
      animateMiniBar(lEl, l, 800, (v) =>
        `${v.toFixed(2)}%${cfg.sad && v <= -10 ? " ☹️" : ""}`
      );
    }

    // slides
    presentSlides.innerHTML = "";
    presentThumbs.innerHTML = "";
    presentState.items = PCMA.collectImageUrls(row);
    if (!presentState.items.length) {
      const sld = document.createElement("div");
      sld.className = "present-slide active";
      sld.innerHTML = `<img src="${LOGO_FALLBACK}" alt="No image">`;
      presentSlides.appendChild(sld);
      presentCounter.textContent = "0 / 0";
    } else {
      presentState.items.forEach((it, i) => {
        const sld = document.createElement("div");
        sld.className = "present-slide" + (i === 0 ? " active" : "");
        sld.innerHTML = `<img src="${it.url}" alt="${it.label}">`;
        presentSlides.appendChild(sld);

        const th = document.createElement("img");
        th.className = "present-thumb" + (i === 0 ? " active" : "");
        th.src = it.url;
        th.alt = it.label;
        th.onclick = () => showPresentIndex(i);
        presentThumbs.appendChild(th);
      });
      presentCounter.textContent = `1 / ${presentState.items.length}`;
    }

    presentState.index = 0;
    presentOverlay.classList.add("show");
    document.body.classList.add("no-scroll");
    stopPresentAuto();
    startPresentAuto();
  }

  // expose to modal.js
  PCMA.openPresentation = openPresentation;

  // events
  presentPrev.addEventListener("click", () =>
    showPresentIndex(presentState.index - 1)
  );
  presentNext.addEventListener("click", () =>
    showPresentIndex(presentState.index + 1)
  );
  presentPlay.addEventListener("click", () => {
    presentState.timer ? stopPresentAuto() : startPresentAuto();
  });
  presentOpen.addEventListener("click", () => {
    if (presentState.items.length) {
      window.open(presentState.items[presentState.index].url, "_blank", "noopener");
    }
  });
  presentClose.addEventListener("click", () => {
    stopPresentAuto();
    presentOverlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });
  window.addEventListener("keydown", (e) => {
    if (!presentOverlay.classList.contains("show")) return;
    if (e.key === "Escape") {
      presentClose.click();
    } else if (e.key === "ArrowRight") {
      showPresentIndex(presentState.index + 1);
    } else if (e.key === "ArrowLeft") {
      showPresentIndex(presentState.index - 1);
    }
  });
})();
