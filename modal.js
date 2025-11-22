// ===== PCMA MODAL (namespaced, deduped) =====
(function () {
  'use strict';

  const PCMA = window.PCMA;
  if (!PCMA) return;

  // Elements (all namespaced)
  const modalBg        = document.getElementById('pcmaModalBg');
  const modalContent   = document.getElementById('pcmaModalContent');
  const modalButtons   = document.getElementById('pcmaModalButtons');
  const modalImages    = document.getElementById('pcmaModalImages'); // optional
  const modalCID       = document.getElementById('pcmaModalCID');
  const closeModalTop  = document.getElementById('pcmaCloseModalTop');
  const modalPrevFloat = document.getElementById('pcmaModalPrev');
  const modalNextFloat = document.getElementById('pcmaModalNext');

  // Guard: do nothing if critical nodes are missing
  if (!modalBg || !modalContent || !modalButtons || !modalCID) return;

  let modalNavList = [];
  let modalNavIndex = 0;

  const $ = (sel) => document.querySelector(sel);

  // Utility: header index finder
  function findCol() {
    const headers = PCMA.state?.headers || [];
    const keys = [...arguments].map(k => String(k).toLowerCase());
    return headers.findIndex(h => keys.some(k => String(h || '').toLowerCase().includes(k)));
  }

  function addNoScroll()  { document.documentElement.classList.add('pcma-no-scroll'); }
  function removeNoScroll(){ document.documentElement.classList.remove('pcma-no-scroll'); }

  function openBg()  { modalBg.classList.add('pcma-show'); addNoScroll(); }
  function closeBg() { modalBg.classList.remove('pcma-show'); removeNoScroll(); }

  function createPrimaryRow(label, value, isStatus) {
    const r = document.createElement('div');
    r.className = 'pcma-primary-row';

    const l = document.createElement('div');
    l.className = 'pcma-primary-label';
    l.textContent = `${label} :`;

    const v = document.createElement('div');
    v.className = 'pcma-primary-value';
    if (isStatus) v.classList.add('pcma-status');
    v.textContent = value;

    r.append(l, v);
    return r;
  }

  function toMoney(n) {
    if (n == null || n === '') return null;
    const s = String(n).replace(/[^0-9.\-]/g, '');
    const f = parseFloat(s);
    if (Number.isNaN(f)) return null;
    try { return '₱ ' + f.toLocaleString('en-PH', { minimumFractionDigits: 2 }); }
    catch { return '₱ ' + f; }
  }

  function toDate(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'2-digit' });
  }

  function animateBar(fillEl, value, duration, formatter) {
    const sign = value < 0 ? -1 : 1;
    const endAbs = Math.min(Math.abs(value), 100);
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const cur = endAbs * t;
      fillEl.style.width = cur + '%';
      const disp = sign * cur;
      fillEl.textContent = formatter ? formatter(disp) : `${disp.toFixed(2)}%`
      if (t < 1) requestAnimationFrame(step);
      else {
        fillEl.style.width = endAbs + '%';
        fillEl.textContent = formatter ? formatter(sign * endAbs) : `${(sign * endAbs).toFixed(2)}%`;
      }
    }
    requestAnimationFrame(step);
  }

  const slipColor = (num) => {
    if (num > 0) return { bg: '#10b981', text: '#fff', sad: false };
    if (num <= 0 && num > -5)  return { bg: '#fecaca', text: '#7f1d1d', sad: false };
    if (num <= -5 && num > -10) return { bg: '#f87171', text: '#fff', sad: true };
    if (num <= -10) return { bg: '#dc2626', text: '#fff', sad: true };
    return { bg: '#6b7280', text: '#fff', sad: false };
  };

  function showDetail(row) {
    openBg();

    modalContent.innerHTML = '';
    modalButtons.innerHTML = '';
    if (modalImages) modalImages.innerHTML = '';

    const headers = PCMA.state?.headers || [];
    const LOGO_FALLBACK = PCMA.config?.LOGO_FALLBACK;

    const cidIdx     = findCol('contract id');
    const projIdx    = findCol('project name');
    const locIdx     = findCol('location');
    const contIdx    = findCol('contractor');
    const amtIdx     = findCol('contract amount','amount');
    const revAmtIdx  = findCol('rev. contract amount','revised contract amount','rev contract amount');
    const ntpIdx     = findCol('notice to proceed','ntp');
    const expIdx     = findCol('expiry date','original expiry date');
    const revExpIdx  = findCol('rev. expiry date','revised expiry date','rev expiry date');
    const statIdx    = findCol('status');
    const remIdx     = findCol('remarks');
    const lastBillIdx= findCol('last billing');
    const uploadCol  = findCol('upload pictures');

    const peIdx = findCol('project engineer');
    const piIdx = findCol('project inspector');
    const reIdx = findCol('resident engineer');
    const qeIdx = findCol('quantity engineer');
    const meIdx = findCol('materials engineer');

    const schedIdx = findCol('sched');
    const actualIdx= findCol('actual');
    const slipIdx  = findCol('slip');
    const delayIdx = findCol('delay');
    let   progIdx  = findCol('progress');
    if (progIdx < 0 && headers.length > 18) progIdx = 18; // conservative fallback

    // hero image (kept same heuristic)
    let heroImgUrl = row[33] ? String(row[33]).trim() : '';
    if (!heroImgUrl) {
      const imgs = PCMA.collectImageUrls?.(row) || [];
      if (imgs.length) heroImgUrl = imgs[0].url;
    }

    modalCID.textContent = (cidIdx >= 0 ? row[cidIdx] : '') || '—';

    if (heroImgUrl) {
      const wrap = document.createElement('div');
      wrap.className = 'pcma-hero';
      const im = document.createElement('img');
      im.src = heroImgUrl;
      if (LOGO_FALLBACK) im.onerror = () => { im.src = LOGO_FALLBACK; };
      wrap.appendChild(im);
      modalContent.appendChild(wrap);
    }

    // PRIMARY block
    const primary = document.createElement('div');
    primary.className = 'pcma-primary';

    const colA = document.createElement('div');
    colA.className = 'pcma-primary-col pcma-group-a';
    if (projIdx > -1 && row[projIdx]) colA.appendChild(createPrimaryRow('Project Name', row[projIdx]));
    if (locIdx  > -1 && row[locIdx])  colA.appendChild(createPrimaryRow('Location', row[locIdx]));
    if (contIdx > -1 && row[contIdx]) colA.appendChild(createPrimaryRow('Contractor', row[contIdx]));

    const colB = document.createElement('div');
    colB.className = 'pcma-primary-col';
    if (amtIdx > -1 && row[amtIdx])     colB.appendChild(createPrimaryRow('Contract Amount', toMoney(row[amtIdx]) ?? row[amtIdx]));
    if (revAmtIdx > -1 && row[revAmtIdx]) colB.appendChild(createPrimaryRow('Rev. Contract Amount', toMoney(row[revAmtIdx]) ?? row[revAmtIdx]));

    const colC = document.createElement('div');
    colC.className = 'pcma-primary-col';
    if (ntpIdx > -1 && row[ntpIdx])  colC.appendChild(createPrimaryRow('NTP', toDate(row[ntpIdx])));
    if (expIdx > -1 && row[expIdx])  colC.appendChild(createPrimaryRow('Expiry Date', toDate(row[expIdx])));
    if (revExpIdx > -1 && row[revExpIdx]) colC.appendChild(createPrimaryRow('Rev. Expiry Date', toDate(row[revExpIdx])));
    if (statIdx > -1 && row[statIdx]) colC.appendChild(createPrimaryRow('Status', row[statIdx], true));

    const colD = document.createElement('div');
    colD.className = 'pcma-primary-col pcma-group-d';
    if (remIdx > -1 && row[remIdx])        colD.appendChild(createPrimaryRow('Remarks', row[remIdx]));
    if (lastBillIdx > -1 && row[lastBillIdx]) colD.appendChild(createPrimaryRow('Last Billing', row[lastBillIdx]));

    if (colA.children.length) primary.appendChild(colA);
    if (colB.children.length) primary.appendChild(colB);
    if (colC.children.length) primary.appendChild(colC);
    if (colD.children.length) primary.appendChild(colD);
    modalContent.appendChild(primary);
	
	
	    // Project Documentation button (below container, above SCHED/ACTUAL/SLIPPAGE)
    if (window.openProjectDocs) {
      const docsRow = document.createElement('div');
      docsRow.className = 'pcma-docs-row';

      const docsBtn = document.createElement('button');
      docsBtn.id = 'projectDocsBtn';
      docsBtn.textContent = 'Project Documentation';
      docsBtn.className = 'pd-docs-btn'; // styled in ProjectDocs.css
      docsBtn.onclick = (e) => {
        e.stopPropagation();
        window.openProjectDocs();
      };

      docsRow.appendChild(docsBtn);
      modalContent.appendChild(docsRow);
    }

    // MINI bars
    const hasSched = schedIdx > -1 && row[schedIdx];
    const hasActual= actualIdx > -1 && row[actualIdx];
    const hasSlip  = slipIdx > -1 && row[slipIdx];

    if (hasSched || hasActual || hasSlip) {
      const mini = document.createElement('div');
      mini.className = 'pcma-mini-bars';

      function pct(val){ return PCMA.helpers?.toPct ? PCMA.helpers.toPct(val, 0) : Number(val) || 0; }

      function addMini(label, val, baseColor, isSlippage){
        const r = document.createElement('div'); r.className = 'pcma-mini-row';
        const lab = document.createElement('div'); lab.className = 'pcma-mini-label'; lab.textContent = label;
        const bar = document.createElement('div'); bar.className = 'pcma-mini-bar';
        const fill= document.createElement('div'); fill.className = 'pcma-mini-fill';
        bar.appendChild(fill); r.append(lab, bar); mini.appendChild(r);

        const num = pct(val);
        if (isSlippage){
          const cfg = slipColor(num);
          fill.style.background = cfg.bg; fill.style.color = cfg.text;
          animateBar(fill, num, 800, v => `${v.toFixed(2)}%${cfg.sad && v <= -10 ? ' ☹️' : ''}`);
        } else {
          fill.style.background = baseColor;
          animateBar(fill, num, 800, v => `${v.toFixed(2)}%`);
        }
      }

      if (hasSched)  addMini('SCHED',    row[schedIdx],  '#3b82f6', false);
      if (hasActual) addMini('ACTUAL',   row[actualIdx], '#10b981', false);
      if (hasSlip)   addMini('SLIPPAGE', row[slipIdx],   null,      true);

      const progRaw  = (progIdx > -1 && row[progIdx]) ? String(row[progIdx]).trim() : '';
      const delayRaw = (delayIdx > -1 && row[delayIdx]) ? String(row[delayIdx]).trim() : '';

      if (progRaw) {
        const wrap  = document.createElement('div'); wrap.className = 'pcma-progress';
        const label = document.createElement('div'); label.className = 'pcma-progress-label'; label.textContent = 'Time Lapsed';
        const bar   = document.createElement('div'); bar.className   = 'pcma-progress-bar';
        const fill  = document.createElement('div'); fill.className  = 'pcma-progress-fill'; fill.textContent = '0%';
        bar.appendChild(fill); wrap.append(label, bar); mini.appendChild(wrap);

        const pctNum = Math.max(0, pct(progRaw));
        const colorFor = (v) => (v > 100 ? '#dc2626' : v >= 100 ? '#16a34a' : v > 80 ? '#f97316' : '#60a5fa');
        fill.style.background = colorFor(pctNum);

        requestAnimationFrame(() => {
          const start = performance.now(); const duration = 900;
          (function step(now){
            const t = Math.min(1, (now - start) / duration);
            const curr = pctNum * t;
            const width = Math.min(curr, 100);
            fill.style.width = width + '%';
            fill.textContent = `${Math.round(curr)}%${delayRaw ? ' ('+delayRaw+')' : ''}`;
            if (t < 1) requestAnimationFrame(step);
            else {
              fill.style.width = Math.min(pctNum, 100) + '%';
              fill.style.background = colorFor(pctNum);
              fill.textContent = `${Math.round(pctNum)}%${delayRaw ? ' ('+delayRaw+')' : ''}`;
            }
          })(start);
        });
      }

      modalContent.appendChild(mini);
    }

    // BUTTONS
    if (uploadCol > -1) {
      const link = String(row[uploadCol] || '').trim();
      if (link && PCMA.helpers?.isValidUrl?.(link)) {
        const b = document.createElement('button');
        b.id = 'pcmaUploadBtn';
        b.textContent = 'Upload Picture';
        b.onclick = (e) => { e.stopPropagation(); window.open(link, '_blank', 'noopener'); };
        modalButtons.appendChild(b);
      }
    }

    const viewBtn = document.createElement('button');
    viewBtn.id = 'pcmaViewPictureBtn';
    viewBtn.textContent = 'View Picture';
    viewBtn.onclick = (e) => { e.stopPropagation(); PCMA.openFloatingGallery?.(row); };
    modalButtons.appendChild(viewBtn);

    const presentBtn = document.createElement('button');
    presentBtn.id = 'pcmaPresentBtn';
    presentBtn.textContent = 'Present (Projector Mode)';
    presentBtn.onclick = (e) => { e.stopPropagation(); PCMA.openPresentation?.(row); };
    modalButtons.appendChild(presentBtn);

    // TEAM badges
    const roles = [
      ['PE', peIdx], ['PI', piIdx], ['RE', reIdx], ['QE', qeIdx], ['ME', meIdx],
    ].map(([label, idx]) => (idx > -1 && row[idx])
      ? `<span class="pcma-staff-badge" style="background:#e2e8f0;color:#0f172a;border-radius:999px;padding:4px 10px;font-weight:700;font-size:.78rem;"><strong>${label}:</strong> ${row[idx]}</span>`
      : ''
    ).join('');

    if (roles.trim()) {
      const team = document.createElement('div');
      team.className = 'pcma-team';
      team.innerHTML = `<span class="pcma-team-label" style="font-weight:700;color:#475569;">TEAM</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${roles}</div>`;
      modalContent.appendChild(team);
    }
  }

  function goModal(delta) {
    if (!modalNavList.length) return;
    let next = modalNavIndex + delta;
    next = Math.max(0, Math.min(next, modalNavList.length - 1));
    if (next === modalNavIndex) return;
    modalNavIndex = next;
    showDetail(modalNavList[modalNavIndex]);
  }

  // Public API
  PCMA.openDetailFromList = function (idx) {
    const list = PCMA.state?.lastRenderedRows || [];
    if (!Array.isArray(list) || !list.length) return;
    modalNavList = list.slice();
    modalNavIndex = Math.max(0, Math.min(idx, modalNavList.length - 1));
    showDetail(modalNavList[modalNavIndex]);
  };

  // Events (with null checks)
  if (closeModalTop)  closeModalTop.addEventListener('click', closeBg);
  modalBg.addEventListener('click', (e) => { if (e.target === modalBg) closeBg(); });

  window.addEventListener('keydown', (e) => {
    if (!modalBg.classList.contains('pcma-show')) return;
    if (e.key === 'Escape')      closeBg();
    else if (e.key === 'ArrowRight') goModal(1);
    else if (e.key === 'ArrowLeft')  goModal(-1);
  });

  if (modalPrevFloat) modalPrevFloat.addEventListener('click', (e) => { e.stopPropagation(); goModal(-1); });
  if (modalNextFloat) modalNextFloat.addEventListener('click', (e) => { e.stopPropagation(); goModal(1); });
})();