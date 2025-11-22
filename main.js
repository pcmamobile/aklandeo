// Main bootstrap for PCMA Mobile
// (extracted from inline <script> in index.html)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(console.error);
}

// Optional: safe no-op hook for future page-wide init
document.addEventListener("DOMContentLoaded", () => {
  // Intentionally empty: core features live in search.js, view-picture.js, modal.js, projector.js, StatusPE.js
  // Keep this file for page bootstrapping only.
});
