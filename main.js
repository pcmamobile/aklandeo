// Main bootstrap for PCMA Mobile
// (extracted from inline <script> in index.html)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(console.error);
}

document.addEventListener("DOMContentLoaded", () => {
  setupFooterNav();
  setupAmendOverlay();
});

function setupFooterNav() {
  const homeBtn = document.getElementById("footerHomeBtn");
  const reloadBtn = document.getElementById("footerReloadBtn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      // Close common overlays/modals (safe best-effort)
      const knownOverlayIds = [
        "projectDocsOverlay",
        "amendOverlay",
        "pcmaModalOverlay",
        "pcmaModal",
      ];

      knownOverlayIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Support both patterns: [hidden] and .hidden
        el.hidden = true;
        el.classList.add("hidden");
      });

      // If ProjectDocs exposes a close function, use it too
      if (typeof window.closeOverlay === "function") {
        try { window.closeOverlay(); } catch (e) {}
      }

      document.body.classList.remove("no-scroll");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      // Prefer your app's reload function if it exists; otherwise reload the page.
      const candidates = [
        "reloadAllTabs",
        "reloadData",
        "refreshData",
        "fetchAndRender",
        "loadCards",
      ];

      for (const fnName of candidates) {
        const fn = window[fnName];
        if (typeof fn === "function") {
          try { fn(); return; } catch (e) { /* fall through */ }
        }
      }

      location.reload();
    });
  }
}

function setupAmendOverlay() {
  // ----- AMEND WINDOW -----
  const amendBtn = document.getElementById("openAmend");
  const overlay = document.getElementById("amendOverlay");
  const closeBtn = document.getElementById("amendCloseBtn");

  if (!amendBtn || !overlay || !closeBtn) return;

  function openAmend() {
    overlay.hidden = false;
    overlay.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }

  function closeAmend() {
    overlay.hidden = true;
    overlay.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  amendBtn.addEventListener("click", openAmend);
  closeBtn.addEventListener("click", closeAmend);

  // click outside the box to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAmend();
  });

  // Esc to close
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") closeAmend();
  });
}
