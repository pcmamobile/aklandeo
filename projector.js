// projector.clean.js — Simplified & De-duplicated
// • Keeps behavior intact
// • Removes stray comments & duplication
// • Shares helpers for team-role chips
(function () {
  'use strict';

  const PCMA = (window.PCMA = window.PCMA || {});
  const H = (PCMA.state || {});

  // ---------- Elements ----------
  const presentOverlay = document.getElementById('presentOverlay');
  if (!presentOverlay) return;

  presentOverlay.classList.remove('show');
  presentOverlay.setAttribute('hidden', '');

  const presentSlides  = document.getElementById('presentSlides');
  const presentThumbs  = document.getElementById('presentThumbs');
  const presentCID     = document.getElementById('presentCID');
  const presentTeam    = document.getElementById('presentTeam');

  const presentPrimary = document.getElementById('presentPrimary');
  const presentBars    = document.getElementById('presentBars');
  const presentCounter = document.getElementById('presentCounter');

  const presentPrev    = document.getElementById('presentPrev');
  const presentNext    = document.getElementById('presentNext');

  const presentPlay    = document.getElementById('presentPlay');
  const presentOpen    = document.getElementById('presentOpen');
  const presentClose   = document.getElementById('presentClose');
  const presentPrevBtn = document.getElementById('presentPrevBtn');
  const presentNextBtn = document.getElementById('presentNextBtn');

  const LOGO_FALLBACK =
    (PCMA.config && PCMA.config.LOGO_FALLBACK) ||
    'https://lh3.googleusercontent.com/d/1VanVX82ANGfKA8jcGZL8cVDQh4EuN8-r=s800?authuser=0';

  // ---------- State ----------
  const state = {
    projects: [],  // current filtered list
    pIndex: 0,
    items: [],     // slides for current project
    sIndex: 0,
    timer: null,
    delay: 6000,
  };

  // ---------- Helpers ----------
  const getFilteredProjects = () => (
    (PCMA.state && Array.isArray(PCMA.state.lastRenderedRows))
      ? PCMA.state.lastRenderedRows.filter(r => Array.isArray(r) && r.length)
      : []
  );

  function findCol(...keys) {
    const headers = H.headers || [];
    return headers.findIndex(h =>
      keys.some(k => String(h || '').toLowerCase().includes(String(k).toLowerCase()))
    );
  }
  const text = (v) => (v == null ? '' : String(v));

  function parseMoney(v){
    if (v == null) return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g,''));
    return Number.isFinite(n) ? n : null;
  }
  function fmtPHP(n){
    try { return '₱ ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch { return '₱ ' + n; }
  }
  function fmtDate(v){
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? String(v) :
      d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  function statusChipColor(t){
    const s = (t || '').toLowerCase().trim();
    if (s === 'completed (pcma)' || s === 'pcma') return '#2563eb';
    if (s === 'completed') return '#16a34a';
    if (s === 'on-going') return '#f59e0b';
    if (s === '100%') return '#14b8a6';
    return '#64748b';
  }

  // Shared team-role mapping for header & mini-block
  function getTeamList(row){
    const roles = [
      ['PE', 'role-pe', 'project engineer',     '#ef4444', '#fff'],
      ['PI', 'role-pi', 'project inspector',    '#22c55e', '#0b1220'],
      ['RE', 'role-re', 'resident engineer',    '#f59e0b', '#0b1220'],
      ['QE', 'role-qe', 'quantity engineer',    '#a855f7', '#fff'],
      ['ME', 'role-me', 'materials engineer',   '#92400e', '#fff'],
    ];
    return roles.map(([abbr, cls, key, bg, fg])=>{
      const idx = findCol(key);
      const val = (idx > -1) ? (row[idx] ?? '').toString().trim() : '';
      return { abbr, cls, val, bg, fg };
    }).filter(r => r.val);
  }

  // Build header team chips
  function buildTeamChips(row){
    presentTeam.innerHTML = '';
    const list = getTeamList(row);
    list.forEach(({abbr, cls, val, bg})=>{
      const chip = document.createElement('span');
      chip.className = 'role-chip';

      const tag = document.createElement('span');
      tag.className = `role-tag ${cls}`;
      tag.textContent = abbr;
      tag.style.color = bg;        // colored label
      chip.style.background = 'transparent';
      chip.style.border = '1px solid rgba(255,255,255,0.18)';
      chip.style.color = '#e5e7eb';

      chip.appendChild(tag);
      chip.append(`: ${val}`);
      presentTeam.appendChild(chip);
    });
    presentTeam.classList.toggle('hidden', list.length === 0);
  }

  function makeRow(label, value, isStatus){
    const sRaw = (value == null ? '' : String(value)).trim();
    const sLow = sRaw.toLowerCase();
    const isEmpty =
      sRaw === '' || sRaw === '-' || sRaw === '—' ||
      sLow === 'n/a' || sLow === 'na' ||
      sLow === 'null' || sLow === 'undefined';

    const r = document.createElement('div');
    r.className = 'primary-row';

    if (isEmpty){ r.style.display = 'none'; return r; }

    const l = document.createElement('div');
    l.className = 'primary-label';
    l.textContent = label + ' :';

    const v = document.createElement('div');
    v.className = 'primary-value';
    v.textContent = sRaw;

    if (isStatus){
      v.classList.add('status');
      v.style.background = statusChipColor(sRaw);
      v.style.color = '#fff';
      v.style.borderRadius = '999px';
      v.style.padding = '6px 12px';
      v.style.fontWeight = '900';
      v.style.display = 'inline-block';
    }

    r.append(l, v);
    return r;
  }

  function buildRightPane(row){
    presentPrimary.innerHTML = '';
    presentBars.innerHTML = '';

    const cidIdx    = findCol('contract id');
    const projIdx   = findCol('project name');
    const locIdx    = findCol('location');
    const contIdx   = findCol('contractor');
    const amtIdx    = findCol('contract amount','amount');
    const revAmtIdx = findCol('rev. contract amount','revised contract amount','rev contract amount');
    const ntpIdx    = findCol('notice to proceed','ntp');
    const expIdx    = findCol('expiry date','original expiry date');
    const revExpIdx = findCol('rev. expiry date','revised expiry date','rev expiry date');
    const statIdx   = findCol('status');
    const remIdx    = findCol('remarks');
    const lbIdx     = findCol('last billing');

    presentCID.textContent = (cidIdx > -1 ? (row[cidIdx] || '') : '') || '—';
    buildTeamChips(row);

    const primary = document.createElement('div');
    primary.className = 'modal-primary';

    // A) Project / Contractor
    const colA = document.createElement('div'); colA.className = 'primary-col group-a';
    if (cidIdx  > -1 && row[cidIdx])  colA.appendChild(makeRow('Contract ID', row[cidIdx]));
    if (projIdx > -1 && row[projIdx]) colA.appendChild(makeRow('Project Name', row[projIdx]));
    if (contIdx > -1 && row[contIdx]) colA.appendChild(makeRow('Contractor', row[contIdx]));

    // B) Amounts
    const colB = document.createElement('div'); colB.className = 'primary-col group-b';
    if (amtIdx    > -1){ const n = parseMoney(row[amtIdx]);    colB.appendChild(makeRow('Contract Amount', n!=null ? fmtPHP(n) : String(row[amtIdx]??''))); }
    if (revAmtIdx > -1){ const n = parseMoney(row[revAmtIdx]); colB.appendChild(makeRow('Rev. Contract Amount', n!=null ? fmtPHP(n) : String(row[revAmtIdx]??''))); }

    // C) Dates + Status
    const colC = document.createElement('div'); colC.className = 'primary-col group-c';
    if (ntpIdx    > -1 && row[ntpIdx])    colC.appendChild(makeRow('NTP', fmtDate(row[ntpIdx])));
    if (expIdx    > -1 && row[expIdx])    colC.appendChild(makeRow('Expiry Date', fmtDate(row[expIdx])));
    if (revExpIdx > -1 && row[revExpIdx]) colC.appendChild(makeRow('Rev. Expiry Date', fmtDate(row[revExpIdx])));
    if (statIdx   > -1 && row[statIdx])   colC.appendChild(makeRow('Status', String(row[statIdx]??''), true));

    // D) Remarks / Last Billing
    const colD = document.createElement('div'); colD.className = 'primary-col group-d';
    if (remIdx > -1 && row[remIdx]) colD.appendChild(makeRow('Remarks', row[remIdx]));
    if (lbIdx  > -1 && row[lbIdx])  colD.appendChild(makeRow('Last Billing', row[lbIdx]));

    if (colA.children.length) primary.appendChild(colA);
    if (colB.children.length) primary.appendChild(colB);
    if (colC.children.length) primary.appendChild(colC);
    if (colD.children.length) primary.appendChild(colD);

    if (primary.children.length) presentPrimary.appendChild(primary);

    // Mini bars (Sched / Actual / Slippage)
    const schedIdx  = findCol('sched');
    const actualIdx = findCol('actual');
    const slipIdx   = findCol('slip');

    const hasSched  = schedIdx  > -1 && row[schedIdx];
    const hasActual = actualIdx > -1 && row[actualIdx];
    const hasSlip   = slipIdx   > -1 && row[slipIdx];

    if (hasSched || hasActual || hasSlip) {
      const mini = document.createElement('div');
      mini.className = 'mini-bars';

      function animateFill(fillEl, value, duration, formatter) {
        const barEl = fillEl.parentElement;
        const v = Math.max(-100, Math.min(100, Number(value) || 0));
        const start = performance.now();
        function setTxt(x){
          const txt = formatter ? formatter(x) : `${x.toFixed(2)}%`;
          fillEl.textContent = txt;
          barEl.setAttribute('data-pct', txt);
        }
        function step(now){
          const t = Math.min(1, (now - start)/duration);
          fillEl.style.width = (Math.abs(v) * t) + '%';
          setTxt(v * t);
          if (t < 1) requestAnimationFrame(step);
          else { fillEl.style.width = Math.abs(v) + '%'; setTxt(v); }
        }
        requestAnimationFrame(step);
      }
      const toPct = (val) => {
        if (val == null || String(val).trim()==='') return 0;
        const s = String(val).trim();
        if (s.endsWith('%')) return Number(s.replace('%','')) || 0;
        const num = Number(s); return Number.isFinite(num) ? (num > 1 ? num : num*100) : 0;
      };
      const slipCfg = (num) => {
        if (num > 0) return { bg:'#10b981', text:'#fff' };
        if (num <= 0 && num > -5)  return { bg:'#fecaca', text:'#7f1d1d' };
        if (num <= -5 && num > -10) return { bg:'#f87171', text:'#fff' };
        if (num <= -10) return { bg:'#dc2626', text:'#fff' };
        return { bg:'#6b7280', text:'#fff' };
      };

      if (hasSched){
        const r = document.createElement('div'); r.className = 'mini-row';
        r.innerHTML = `<div class="mini-label">SCHED--- :</div><div class="mini-bar"><div class="mini-fill"></div></div>`;
        mini.appendChild(r);
        const fill = r.querySelector('.mini-fill');
        fill.style.background = '#3b82f6';
        fill.style.color = '#fff';
        animateFill(fill, toPct(row[schedIdx]), 800, v => `${v.toFixed(2)}%`);
      }
      if (hasActual){
        const r = document.createElement('div'); r.className = 'mini-row';
        r.innerHTML = `<div class="mini-label">ACTUAL--:</div><div class="mini-bar"><div class="mini-fill"></div></div>`;
        mini.appendChild(r);
        const fill = r.querySelector('.mini-fill');
        fill.style.background = '#10b981';
        fill.style.color = '#fff';
        animateFill(fill, toPct(row[actualIdx]), 800, v => `${v.toFixed(2)}%`);
      }
      if (hasSlip){
        const r = document.createElement('div'); r.className = 'mini-row';
        r.innerHTML = `<div class="mini-label">SLIPPAGE :</div><div class="mini-bar"><div class="mini-fill"></div></div>`;
        mini.appendChild(r);
        const fill = r.querySelector('.mini-fill');
        const pct = toPct(row[slipIdx]);
        const cfg = slipCfg(pct);
        fill.style.background = cfg.bg; fill.style.color = cfg.text;
        animateFill(fill, pct, 800, v => `${v.toFixed(2)}%${(pct <= -10) ? ' ☹️' : ''}`);
      }

      // Team chips block under bars (left-aligned); reuse mapping
      const teamBlock = document.createElement('div');
      teamBlock.className = 'mini-team-block';
      teamBlock.style.marginTop = '8px';
      teamBlock.style.display = 'flex';
      teamBlock.style.flexWrap = 'wrap';
      teamBlock.style.gap = '6px';
      teamBlock.style.justifyContent = 'flex-start';

      getTeamList(row).forEach(({abbr, cls, val})=>{
        const chip = document.createElement('span');
        chip.className = 'role-chip';
        const tag = document.createElement('span');
        tag.className = `role-tag ${cls}`;
        tag.textContent = abbr;
        chip.appendChild(tag);
        chip.append(`: ${val}`);
        teamBlock.appendChild(chip);
      });

      if (teamBlock.children.length) mini.appendChild(teamBlock);
      presentBars.appendChild(mini);
    }
  }

  // ---------- Slides ----------
  function rebuildSlidesForRow(row){
    presentSlides.innerHTML = '';
    presentThumbs.innerHTML = '';
    state.items = (typeof PCMA.collectImageUrls === 'function' && PCMA.collectImageUrls(row)) || [];
    state.sIndex = 0;

    if (!state.items.length){
      const sld = document.createElement('div');
      sld.className = 'present-slide active';
      sld.innerHTML = `<img src="${LOGO_FALLBACK}" alt="No image">`;
      presentSlides.appendChild(sld);
      presentCounter.textContent = '0 / 0';
      return;
    }

    state.items.forEach((it, i) => {
      const sld = document.createElement('div');
      sld.className = 'present-slide' + (i === 0 ? ' active' : '');
      sld.innerHTML = `<img src="${it.url}" alt="${it.label || ''}">`;
      presentSlides.appendChild(sld);

      const th = document.createElement('img');
      th.className = 'present-thumb' + (i === 0 ? ' active' : '');
      th.src = it.url; th.alt = it.label || '';
      th.onclick = () => showSlide(i);
      presentThumbs.appendChild(th);
    });
    presentCounter.textContent = `1 / ${state.items.length}`;
  }

  function showSlide(i){
    if (!state.items.length) { presentCounter.textContent = '0 / 0'; return; }
    const N = state.items.length;
    state.sIndex = ((i % N) + N) % N;
    const slides = Array.from(presentSlides.children);
    const thumbs = Array.from(presentThumbs.children);
    slides.forEach((el, k) => el.classList.toggle('active', k === state.sIndex));
    thumbs.forEach((el, k) => el.classList.toggle('active', k === state.sIndex));
    presentCounter.textContent = `${state.sIndex + 1} / ${N}`;
  }

  function startAuto(){
    stopAuto();
    if (!state.items.length) return;
    state.timer = setTimeout(function tick(){
      showSlide(state.sIndex + 1);
      state.timer = setTimeout(tick, state.delay);
    }, state.delay);
    if (presentPlay) presentPlay.textContent = 'Pause';
  }
  function stopAuto(){
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    if (presentPlay) presentPlay.textContent = 'Play';
  }

  // ---------- Project navigation ----------
  function openProjectByIndex(i){
    state.projects = (PCMA.state && Array.isArray(PCMA.state.lastRenderedRows))
      ? PCMA.state.lastRenderedRows.filter(r => Array.isArray(r) && r.length)
      : [];
    if (!state.projects.length) return;

    const N = state.projects.length;
    state.pIndex = ((i % N) + N) % N;
    const row = state.projects[state.pIndex];

    buildRightPane(row);
    rebuildSlidesForRow(row);

    stopAuto();
    startAuto();

    if (!presentOverlay.classList.contains('show')){
      presentOverlay.classList.add('show');
      presentOverlay.removeAttribute('hidden');
      document.body.classList.add('no-scroll');
    }
  }
  const nextProject = () => openProjectByIndex(state.pIndex + 1);
  const prevProject = () => openProjectByIndex(state.pIndex - 1);

  // Public open()
  function openPresentation(row){
    const list = (PCMA.state && Array.isArray(PCMA.state.lastRenderedRows))
      ? PCMA.state.lastRenderedRows.filter(r => Array.isArray(r) && r.length)
      : [];
    if (!list.length){ alert('No projects to present.'); return; }
    let idx = list.findIndex(r => r === row);
    if (idx < 0){
      const sig = JSON.stringify(row);
      idx = list.findIndex(r => JSON.stringify(r) === sig);
      if (idx < 0) idx = 0;
    }
    openProjectByIndex(idx);
  }

  // ---------- Events ----------
  if (presentPrev) presentPrev.addEventListener('click', () => { showSlide(state.sIndex - 1); stopAuto(); });
  if (presentNext) presentNext.addEventListener('click', () => { showSlide(state.sIndex + 1); stopAuto(); });
  if (presentPrevBtn) presentPrevBtn.addEventListener('click', () => { prevProject(); stopAuto(); });
  if (presentNextBtn) presentNextBtn.addEventListener('click', () => { nextProject(); stopAuto(); });

  if (presentPlay) presentPlay.addEventListener('click', () => { state.timer ? stopAuto() : startAuto(); });
  if (presentOpen) presentOpen.addEventListener('click', () => {
    if (!state.items.length) return;
    const it = state.items[state.sIndex];
    if (it && it.url) window.open(it.url, '_blank', 'noopener');
  });
  if (presentClose) presentClose.addEventListener('click', () => {
    stopAuto();
    presentOverlay.classList.remove('show');
    presentOverlay.setAttribute('hidden','');
    document.body.classList.remove('no-scroll');
  });

  window.addEventListener('keydown', (e) => {
    if (!presentOverlay.classList.contains('show')) return;
    if (e.key === 'Escape') presentClose?.click();
    if (e.key === 'ArrowRight') { nextProject(); stopAuto(); }
    if (e.key === 'ArrowLeft')  { prevProject(); stopAuto(); }
  });

  PCMA.openPresentation = openPresentation;
})();