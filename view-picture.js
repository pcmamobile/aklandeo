// view-picture.js
(function () {
  const PCMA = window.PCMA;
  if (!PCMA) return;

  const { LOGO_FALLBACK } = PCMA.config;

  // get gallery elements
  const galleryOverlay = document.getElementById("galleryOverlay");
  const galleryCID = document.getElementById("galleryCID");
  const galleryImg = document.getElementById("galleryImg");
  const galleryPrev = document.getElementById("galleryPrev");
  const galleryNext = document.getElementById("galleryNext");
  const galleryCounter = document.getElementById("galleryCounter");
  const galleryThumbs = document.getElementById("galleryThumbs");
  const galleryOpenLink = document.getElementById("galleryOpen");
  const galleryCloseBtn = document.getElementById("galleryClose");

  // local state
  let galleryItems = [];
  let galleryIndex = 0;
  let activeCID = "—";

  // make it available to other files
  PCMA.collectImageUrls = function collectImageUrls(row) {
    const { headers } = PCMA.state;
    const list = [];
    // look for columns "image 1" ... "image 99"
    for (let i = 1; i <= 99; i++) {
      const ci = headers.findIndex((h) => {
        let hh = String(h || "").toLowerCase().trim();
        hh = hh.replace(/[:]+/g, "");
        return (
          hh === `image ${i}` ||
          hh === `image${i}` ||
          hh.startsWith(`image ${i} `)
        );
      });
      if (ci >= 0) {
        const url = String(row[ci] || "").trim();
        if (url) {
          list.push({ label: `Image ${i}`, url });
        }
      }
    }
    return list;
  };

  function showGalleryIndex(idx) {
    if (!galleryItems.length) return;
    galleryIndex = (idx + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];

    const tmp = new Image();
    tmp.onload = () => {
      galleryImg.src = item.url;
      galleryImg.alt = item.label + " - " + activeCID;
    };
    tmp.onerror = () => {
      galleryImg.src = LOGO_FALLBACK;
    };
    tmp.src = item.url;

    galleryOpenLink.href = item.url;
    galleryCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
    [...galleryThumbs.children].forEach((el, i) =>
      el.classList.toggle("active", i === galleryIndex)
    );
  }

  function openFloatingGallery(row) {
    const imgs = PCMA.collectImageUrls(row);
    if (!imgs.length) {
      alert("No images (Image 1 to Image 99) for this record.");
      return;
    }

    const cidIdx = PCMA.state.headers.findIndex((h) => h.includes("contract id"));
    activeCID = (cidIdx >= 0 ? row[cidIdx] : "") || "—";
    galleryItems = imgs;
    galleryIndex = 0;

    galleryThumbs.innerHTML = "";
    imgs.forEach((it, i) => {
      const th = document.createElement("img");
      th.className = "thumb";
      th.src = it.url;
      th.alt = it.label;
      th.loading = "lazy";
      th.addEventListener("click", (ev) => {
        ev.stopPropagation();
        showGalleryIndex(i);
      });
      galleryThumbs.appendChild(th);
    });

    galleryCID.textContent = activeCID;
    showGalleryIndex(0);

    galleryOverlay.classList.add("show");
    document.body.classList.add("no-scroll");
  }

  function closeFloatingGallery() {
    galleryOverlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }

  // expose
  PCMA.openFloatingGallery = openFloatingGallery;
  PCMA.closeFloatingGallery = closeFloatingGallery;

  // events
  galleryPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    showGalleryIndex(galleryIndex - 1);
  });
  galleryNext.addEventListener("click", (e) => {
    e.stopPropagation();
    showGalleryIndex(galleryIndex + 1);
  });
  galleryCloseBtn.addEventListener("click", () => closeFloatingGallery());
  galleryOverlay.addEventListener("click", (e) => {
    if (e.target === galleryOverlay) closeFloatingGallery();
  });
})();
