// Main bootstrap for PCMA Mobile
// (extracted from inline <script> in index.html)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(console.error);
}

// Optional: safe no-op hook for future page-wide init
document.addEventListener("DOMContentLoaded", () => {
  // ----- AMEND WINDOW -----
  const amendBtn  = document.getElementById("openAmend");
  const overlay   = document.getElementById("amendOverlay");
  const closeBtn  = document.getElementById("amendCloseBtn");

  if (!amendBtn || !overlay || !closeBtn) return;

  function openAmend() {
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
  }

  function closeAmend() {
    overlay.hidden = true;
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
});
