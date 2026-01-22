// Main bootstrap for PCMA Mobile
// (extracted from inline <script> in index.html)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(console.error);
}

document.addEventListener("DOMContentLoaded", () => {
  setupFooterNav();
  setupAmendOverlay();
  setupDownloadButton(); // ✅ added
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

function setupDownloadButton() {
  // ✅ DOWNLOAD button beside Amend button, with SAME design as Amend
  const DRIVE_URL = "https://drive.google.com/file/d/1CTogwlTvQxwPW0KrdHyGSVxMZ3cjH3PM/view";

  const amendBtn = document.getElementById("openAmend");
  if (!amendBtn) return;

  // If it already exists in HTML, just wire it up (and force same design).
  let downloadBtn = document.getElementById("openDownload");

  if (!downloadBtn) {
    // Clone Amend button to guarantee same classes/structure
    downloadBtn = amendBtn.cloneNode(true);
    downloadBtn.id = "openDownload";

    // Insert immediately after Amend button (beside it)
    amendBtn.insertAdjacentElement("afterend", downloadBtn);
  }

  // Ensure it looks identical:
  // 1) Copy class list and inline styles
  downloadBtn.className = amendBtn.className;
  downloadBtn.style.cssText = amendBtn.style.cssText;

  // 2) Copy computed styles too (covers cases where styling is tied to #openAmend)
  copyComputedStyles(amendBtn, downloadBtn);

  // Add small spacing between the two buttons
  downloadBtn.style.marginLeft = "8px";

  // Remove any inline onclick carried over (so it won't open Amend)
  downloadBtn.removeAttribute("onclick");

  // Replace visible label to "Download" while keeping icon/markup if any
  const replaced = replaceFirstTextNode(downloadBtn, /amend/gi, "Download");
  if (!replaced) {
    // If no "Amend" text exists, force a plain label
    downloadBtn.textContent = "Download";
  }

  // Make sure it's a button (not submitting forms)
  if (downloadBtn.tagName === "BUTTON" && !downloadBtn.getAttribute("type")) {
    downloadBtn.setAttribute("type", "button");
  }

  // If it is an <a>, set proper link attrs (still add click handler as fallback)
  if (downloadBtn.tagName === "A") {
    downloadBtn.href = DRIVE_URL;
    downloadBtn.target = "_blank";
    downloadBtn.rel = "noopener";
  }

  // Click → open Google Drive
  downloadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(DRIVE_URL, "_blank", "noopener");
  }, { passive: false });
}

function copyComputedStyles(fromEl, toEl) {
  try {
    const cs = window.getComputedStyle(fromEl);
    // cs is iterable (list of property names)
    for (const prop of cs) {
      const val = cs.getPropertyValue(prop);
      const prio = cs.getPropertyPriority(prop);
      if (val) toEl.style.setProperty(prop, val, prio);
    }
  } catch (e) {
    // If anything fails, design will still match via className + inline styles
  }
}

function replaceFirstTextNode(root, pattern, replacement) {
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || "";
      if (pattern.test(text)) {
        node.nodeValue = text.replace(pattern, replacement);
        return true;
      }
    }
  } catch (e) {}
  return false;
}
