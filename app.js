/* ===== CONFIG ===== */
const SHEET_ID="1LSYLZ7tfSeVupQMPsCOHG4SlnzPQqOAIe03QI1qRMr8";
const RANGE="APP";
const API_KEY="AIzaSyCz6fNJr3ecn-M2HActqM1aCXbxqRLj2e8";
const LOGO_FALLBACK="https://i.ibb.co/RRJpHk2/PCMA-logo-1.png";

/* ===== DOM READY ===== */
document.addEventListener('DOMContentLoaded', () => {
  init();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(console.error);
  }
});

function init(){
  /* ===== ELEMENTS ===== */
  const grid=document.getElementById('grid');
  const resultInfo=document.getElementById('resultInfo');
  const filtersBox=document.getElementById('filters');
  const toggleFiltersBtn=document.getElementById('toggleFilters');

  const filterCombo=document.getElementById('filterCombo');
  const filterYear=document.getElementById('filterYear');
  const filterStatus=document.getElementById('filterStatus');
  const filterContractor=document.getElementById('filterContractor');
  const filterEngineer=document.getElementById('filterEngineer');
  const applyFilterBtn=document.getElementById('applyFilter');
  const clearFilterBtn=document.getElementById('clearFilter');
  const moreFiltersBox=document.getElementById('moreFilters');
  const toggleMoreFiltersBtn=document.getElementById('toggleMoreFilters');

  const modalBg=document.getElementById('modalBg');
  const modalContent=document.getElementById('modalContent');
  const modalButtons=document.getElementById('modalButtons');
  const modalImages=document.getElementById('modalImages');
  const closeModalTop=document.getElementById('closeModalTop');
  const modalCID=document.getElementById('modalCID');
  const modalPrevFloat=document.getElementById('modalPrevFloat');
  const modalNextFloat=document.getElementById('modalNextFloat');

  const galleryOverlay = document.getElementById('galleryOverlay');
  const galleryCID = document.getElementById('galleryCID');
  const galleryImg = document.getElementById('galleryImg');
  const galleryPrev = document.getElementById('galleryPrev');
  const galleryNext = document.getElementById('galleryNext');
  const galleryCounter = document.getElementById('galleryCounter');
  const galleryThumbs = document.getElementById('galleryThumbs');
  const galleryOpenLink = document.getElementById('galleryOpen');
  const galleryCloseBtn = document.getElementById('galleryClose');

  const presentOverlay=document.getElementById('presentOverlay');
  const presentSlides=document.getElementById('presentSlides');
  const presentThumbs=document.getElementById('presentThumbs');
  const presentCID=document.getElementById('presentCID');
  const presentProj=document.getElementById('presentProj');
  const presentContractor=document.getElementById('presentContractor');
  const presentAmt=document.getElementById('presentAmt');
  const presentRevAmt=document.getElementById('presentRevAmt');
  const presentNTP=document.getElementById('presentNTP');
  const presentExpiry=document.getElementById('presentExpiry');
  const presentRevExpiry=document.getElementById('presentRevExpiry');
  const presentRemarks=document.getElementById('presentRemarks');
  const presentStatusChip=document.getElementById('presentStatusChip');
  const presentCounter=document.getElementById('presentCounter');
  const presentPrev=document.getElementById('presentPrev');
  const presentNext=document.getElementById('presentNext');
  const presentPlay=document.getElementById('presentPlay');
  const presentOpen=document.getElementById('presentOpen');
  const presentClose=document.getElementById('presentClose');

  /* ===== STATE ===== */
  let headers=[],records=[]; 
  let lastRenderedRows=[]; 
  let galleryItems=[]; 
  let galleryIndex=0; 
  let activeCID='—';
  let modalNavList=[]; 
  let modalNavIndex=0;
  let presentState={items:[],index:0,row:null,timer:null,delay:6000};

  /* ===== HELPERS (same as before) ===== */
  function isValidUrl(u){ try{ const x=new URL(u); return x.protocol==='http:'||x.protocol==='https:'; }catch{return false;} }
  function toPct(val,fallback=0){
    if(val==null) return fallback;
    const m=String(val).replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m?parseFloat(m[0]):fallback;
  }
  function colorForSlippage(num){
    if(num>0) return {bg:'#10b981',text:'#fff',sad:false};
    if(num<=0 && num>-5) return {bg:'#fecaca',text:'#7f1d1d',sad:false};
    if(num<=-5 && num>-10) return {bg:'#f87171',text:'#fff',sad:true};
    if(num<=-10) return {bg:'#dc2626',text:'#fff',sad:true};
    return {bg:'#6b7280',text:'#fff',sad:false};
  }
  function animateMiniBar(fillEl,value,duration=800,formatFn=null){
    const sign=value<0?-1:1; const endAbs=Math.min(Math.abs(value),100);
    const startTime=performance.now();
    function step(now){
      const t=Math.min(1,(now-startTime)/duration);
      const cur=endAbs*t; fillEl.style.width=cur+'%';
      const display=sign*cur; fillEl.textContent=formatFn?formatFn(display):`${display.toFixed(2)}%`;
      if(t<1) requestAnimationFrame(step);
      else { fillEl.style.width=endAbs+'%'; fillEl.textContent=formatFn?formatFn(sign*endAbs):`${(sign*endAbs).toFixed(2)}%`; }
    }
    requestAnimationFrame(step);
  }
  function parseMoney(v){ if(v==null) return null; const s=String(v).replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:null; }
  function fmtPHP(n){ try{ return '₱ ' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:2, maximumFractionDigits:2}); }catch{ return '₱ ' + n; } }
  function findCol(){ const keys=[...arguments].map(k=>String(k).toLowerCase()); return headers.findIndex(h=> keys.some(k=> h.includes(k))); }

  /* ===== DATA LOAD ===== */
  async function loadData(){
    const url=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    try{
      const res=await fetch(url);
      const data=await res.json();
      if(!data.values || !data.values.length) throw new Error('No data returned');

      const keyHints = ['contract id','project name','location','status'];
      let headerRowIndex = 0;
      for(let i=0;i<data.values.length;i++){
        const row = (data.values[i]||[]).map(c=>String(c||'').trim().toLowerCase());
        const hit = keyHints.some(h => row.some(cell => cell.includes(h)));
        if(hit){ headerRowIndex = i; break; }
      }

      headers = (data.values[headerRowIndex]||[]).map(h=>(h||'').trim().toLowerCase().replace(/[:]+/g,''));
      records = data.values.slice(headerRowIndex+1);

      populateFilterOptions();
      restoreFilterState();

      const all = records.filter(r=>r && r.join('').trim());
      renderGrid(all);
      grid.classList.remove('hidden');
      resultInfo.textContent = `${all.length} results`;
      resultInfo.classList.remove('hidden');
    }catch(e){
      console.error(e);
      grid.classList.remove('hidden');
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#b91c1c;">Failed to load data.</div>`;
    }
  }

  /* ===== FILTERS ===== */
  function populateFilterOptions(){
    const years=new Set(),contractors=new Set(),engineers=new Set(),statuses=new Set();
    const colYear=headers.findIndex(h=>h.includes('year'));
    const colContractor=headers.findIndex(h=>h.includes('contractor'));
    const colEngineer=headers.findIndex(h=>h.includes('project engineer'));
    const colStatus=headers.findIndex(h=>h.includes('status'));
    records.forEach(r=>{
      if(colYear>=0&&r[colYear])years.add(r[colYear]);
      if(colContractor>=0&&r[colContractor])contractors.add(r[colContractor]);
      if(colEngineer>=0&&r[colEngineer])engineers.add(r[colEngineer]);
      if(colStatus>=0&&r[colStatus])statuses.add(String(r[colStatus]).trim());
    });
    filterYear.innerHTML='<option value="">All</option>'+[...years].sort().map(y=>`<option value="${y}">${y}</option>`).join('');
    filterContractor.innerHTML='<option value="">All</option>'+[...contractors].sort().map(c=>`<option value="${c}">${c}</option>`).join('');
    filterEngineer.innerHTML='<option value="">All</option>'+[...engineers].sort().map(e=>`<option value="${e}">${e}</option>`).join('');
    filterStatus.innerHTML='<option value="">All</option>'+[...statuses].sort().map(s=>`<option value="${s}">${s}</option>`).join('');
  }
  function saveFilterState(){
    const state={
      combo:filterCombo.value||'',
      year:filterYear.value||'',
      status:filterStatus.value||'',
      contractor:filterContractor.value||'',
      engineer:filterEngineer.value||'',
      more:!moreFiltersBox.classList.contains('hidden')
    };
    localStorage.setItem('pcma_filters', JSON.stringify(state));
  }
  function restoreFilterState(){
    try{
      const raw=localStorage.getItem('pcma_filters'); if(!raw) return;
      const s=JSON.parse(raw);
      filterCombo.value=s.combo||'';
      filterYear.value=s.year||'';
      filterStatus.value=s.status||'';
      filterContractor.value=s.contractor||'';
      filterEngineer.value=s.engineer||'';
      if(s.more) moreFiltersBox.classList.remove('hidden');
    }catch{}
  }
  function filterData(text, year, engineer, contractor, status){
    const q=(text||'').toLowerCase().trim();
    const idx={
      cid: headers.findIndex(h=>h.includes('contract id')),
      project: headers.findIndex(h=>h.includes('project name')),
      location: headers.findIndex(h=>h.includes('location')),
      pe: headers.findIndex(h=>h.includes('project engineer')),
      pi: headers.findIndex(h=>h.includes('project inspector')),
      re: headers.findIndex(h=>h.includes('resident engineer')),
      qe: headers.findIndex(h=>h.includes('quantity engineer')),
      me: headers.findIndex(h=>h.includes('materials engineer')),
      contractor: headers.findIndex(h=>h.includes('contractor')),
      status: headers.findIndex(h=>h.includes('status')),
      year: headers.findIndex(h=>h.includes('year')),
    };
    return records.filter(r=>{
      if(!r || !r.join('').trim()) return false;
      let textOK = true;
      if(q){
        textOK = [
          idx.cid, idx.project, idx.location,
          idx.pe, idx.pi, idx.re, idx.qe, idx.me,
          idx.contractor, idx.status, idx.year
        ].some(ci => ci>=0 && String(r[ci]||'').toLowerCase().includes(q));
      }
      if(!textOK) return false;
      if(year){ if(!(idx.year>=0) || String(r[idx.year]||'').toLowerCase() !== year) return false; }
      if(engineer){ if(!(idx.pe>=0) || String(r[idx.pe]||'').toLowerCase() !== engineer) return false; }
      if(contractor){ if(!(idx.contractor>=0) || String(r[idx.contractor]||'').toLowerCase() !== contractor) return false; }
      if(status){ if(!(idx.status>=0) || String(r[idx.status]||'').toLowerCase() !== status) return false; }
      return true;
    });
  }
  function applyFilters(){
    const combo=(filterCombo.value||'');
    const y=(filterYear.value||'').toLowerCase();
    const s=(filterStatus.value||'').toLowerCase();
    const c=(filterContractor.value||'').toLowerCase();
    const e=(filterEngineer.value||'').toLowerCase();

    const filtered = filterData(combo, y, e, c, s);
    grid.classList.remove('hidden');
    renderGrid(filtered.length?filtered:[]);
    resultInfo.textContent = `${filtered.length} result${filtered.length!==1?'s':''}`;
    resultInfo.classList.remove('hidden');
    saveFilterState();
  }
  function clearFilters(){
    filterCombo.value='';
    filterYear.value='';
    filterStatus.value='';
    filterContractor.value='';
    filterEngineer.value='';
    saveFilterState();
    const all = records.filter(r=>r && r.join('').trim());
    renderGrid(all);
    resultInfo.textContent = `${all.length} results`;
    resultInfo.classList.remove('hidden');
    grid.classList.remove('hidden');
  }

  /* events */
  filterCombo.addEventListener('input', ()=>{
    const rows = filterData(filterCombo.value, '', '', '', '');
    grid.classList.remove('hidden');
    renderGrid(rows);
    resultInfo.textContent = `${rows.length} result${rows.length!==1?'s':''}`;
    resultInfo.classList.remove('hidden');
    saveFilterState();
  });
  applyFilterBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    applyFilters();
    moreFiltersBox.classList.add('hidden');
    const st = JSON.parse(localStorage.getItem('pcma_filters') || '{}');
    st.more = false;
    localStorage.setItem('pcma_filters', JSON.stringify(st));
  });
  clearFilterBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    clearFilters();
    moreFiltersBox.classList.add('hidden');
    const st = JSON.parse(localStorage.getItem('pcma_filters') || '{}');
    st.more = false;
    localStorage.setItem('pcma_filters', JSON.stringify(st));
  });
  toggleMoreFiltersBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    moreFiltersBox.classList.toggle('hidden');
    saveFilterState();
  });
  toggleFiltersBtn.addEventListener('click', ()=>{
    if(window.innerWidth<=768) return;
    const isHidden = filtersBox.style.display==='none';
    filtersBox.style.display = isHidden?'flex':'none';
    toggleFiltersBtn.textContent = isHidden?'Hide Search':'Show Search';
  });

  /* ===== GRID ===== */
  function renderGrid(rows){
    lastRenderedRows = rows.slice();
    grid.innerHTML="";
    const colContractID=headers.findIndex(h=>h.includes('contract id'));
    const colProjectName=headers.findIndex(h=>h.includes('project name'));
    const colStatus=headers.findIndex(h=>h.includes('status'));
    const colEngineer=headers.findIndex(h=>h.includes('project engineer'));
    const colLocation=headers.findIndex(h=>h.includes('location'));
    const colImage1=headers.findIndex(h=>h.includes('image 1'));

    if(rows.length===0){
      grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:20px;color:#777;">No data found.</div>`;
      return;
    }

    const q = (filterCombo.value||'').trim().toLowerCase();

    rows.forEach((r,idx)=>{
      if(!r || !r.join('').trim()) return;

      const card=document.createElement('div'); 
      card.className='card';
      card.dataset.rowIndex = String(idx);

      const img=document.createElement('img');
      const link=(colImage1>=0 && r[colImage1])?String(r[colImage1]).trim():'';
      img.src=link||LOGO_FALLBACK;
      img.className='card-thumb';
      img.loading='lazy';
      img.decoding='async';
      img.onerror=()=>{img.src=LOGO_FALLBACK;};
      card.appendChild(img);

      const content=document.createElement('div'); 
      content.className='card-content';

      const top=document.createElement('div');
      top.style.display='flex';
      top.style.justifyContent='space-between';
      top.style.alignItems='baseline';

      const cidVal = (colContractID>=0 && r[colContractID]) ? String(r[colContractID]) : '';
      const engVal = (colEngineer>=0 && r[colEngineer]) ? String(r[colEngineer]) : '';

      let cidHtml = cidVal;
      if(q && cidVal.toLowerCase().includes(q)){
        cidHtml = cidVal.replace(new RegExp(q,'ig'), m=>`<mark>${m}</mark>`);
      }

      top.innerHTML = `<span class="contract-id">${cidHtml}</span><span class="engineer-name">${engVal}</span>`;
      content.appendChild(top);

      const projVal = (colProjectName>=0 && r[colProjectName]) ? String(r[colProjectName]) : '';
      let projHtml = projVal;
      if(q && projVal.toLowerCase().includes(q)){
        projHtml = projVal.replace(new RegExp(q,'ig'), m=>`<mark>${m}</mark>`);
      }
      const projDiv = document.createElement('div');
      projDiv.innerHTML = projHtml;
      projDiv.style.marginTop = '2px';
      content.appendChild(projDiv);

      if(colLocation>=0 && r[colLocation]){
        const locVal = String(r[colLocation]);
        let locHtml = locVal;
        if(q && locVal.toLowerCase().includes(q)){
          locHtml = locVal.replace(new RegExp(q,'ig'), m=>`<mark>${m}</mark>`);
        }
        const locDiv=document.createElement('div');
        locDiv.innerHTML = locHtml;
        locDiv.style.opacity = .85;
        content.appendChild(locDiv);
      }

      const statusDiv=document.createElement('div');
      const statusText=((colStatus>=0 && r[colStatus])?String(r[colStatus]):'').trim();
      const tt=statusText.toLowerCase(); 
      let bg='#777';
      if(tt==='completed (pcma)'||tt==='pcma') bg='#2563eb';
      else if(tt==='completed') bg='#16a34a';
      else if(tt==='on-going') bg='#f97316';
      else if(tt==='100%') bg='#14b8a6';
      statusDiv.innerHTML=`<span class="status" style="background:${bg}">${statusText}</span>`;
      content.appendChild(statusDiv);

      card.appendChild(content);
      card.addEventListener('click', ()=>openDetailFromList(idx));
      grid.appendChild(card);
    });
  }

  /* ===== IMAGE HELPERS ===== */
  function collectImageUrls(row){
    const list = [];
    for (let i = 1; i <= 60; i++){
      const ci = headers.findIndex(h => {
        const hh = String(h || '').toLowerCase();
        return hh.includes(`image ${i}`) || hh === `image${i}`;
      });
      if (ci >= 0) {
        const url = String(row[ci] || '').trim();
        if (url) list.push({ label: `Image ${i}`, url });
      }
    }
    return list;
  }

  /* ===== FLOATING GALLERY ===== */
  function openFloatingGallery(row){
    const imgs = collectImageUrls(row);
    if(imgs.length===0){
      alert('No images available for this record.');
      return;
    }
    const cidIdx=headers.findIndex(h=>h.includes('contract id'));
    activeCID=(cidIdx>=0?row[cidIdx]:'')||'—';
    galleryItems = imgs;
    galleryIndex = 0;

    galleryThumbs.innerHTML = '';
    imgs.forEach((it, i)=>{
      const th = document.createElement('img');
      th.className='thumb'; th.src=it.url; th.alt=it.label; th.loading='lazy';
      th.addEventListener('click', (ev)=>{ ev.stopPropagation(); showGalleryIndex(i); });
      galleryThumbs.appendChild(th);
    });

    galleryCID.textContent = activeCID;
    showGalleryIndex(0);

    galleryOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
  }
  function closeFloatingGallery(){
    galleryOverlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }
  function showGalleryIndex(idx){
    if(!galleryItems.length) return;
    galleryIndex = (idx+galleryItems.length)%galleryItems.length;
    const item = galleryItems[galleryIndex];
    const img = new Image();
    img.onload = ()=>{
      galleryImg.src = item.url;
      galleryImg.alt = item.label + ' - ' + activeCID;
    };
    img.onerror = ()=>{ galleryImg.src = LOGO_FALLBACK; };
    img.src = item.url;
    galleryOpenLink.href = item.url;
    galleryCounter.textContent = `${galleryIndex+1} / ${galleryItems.length}`;
    [...galleryThumbs.children].forEach((el,i)=>el.classList.toggle('active', i===galleryIndex));
  }
  galleryPrev.addEventListener('click',(e)=>{e.stopPropagation();showGalleryIndex(galleryIndex-1);});
  galleryNext.addEventListener('click',(e)=>{e.stopPropagation();showGalleryIndex(galleryIndex+1);});
  galleryCloseBtn.addEventListener('click',()=>closeFloatingGallery());
  galleryOverlay.addEventListener('click',(e)=>{if(e.target===galleryOverlay) closeFloatingGallery();});

  /* ===== MODAL ===== */
  function showDetail(row){
    document.body.classList.add('no-scroll');
    modalBg.classList.add('show');

    modalContent.innerHTML=''; modalButtons.innerHTML=''; modalImages.innerHTML='';
    const cidIdx=headers.findIndex(h=>h.includes('contract id'));
    modalCID.textContent=(cidIdx>=0?row[cidIdx]:'')||'—';

    const colUpload=headers.findIndex(h=>h.includes('upload pictures'));
    const colStatus=headers.findIndex(h=>h.includes('status'));
    const colSched=headers.findIndex(h=>h.includes('sched'));
    const colActual=headers.findIndex(h=>h.includes('actual'));
    const colSlip=headers.findIndex(h=>h.includes('slip'));
    const colDelay=headers.findIndex(h=>h.includes('delay'));
    let colProg=headers.findIndex(h=>h.includes('progress')); if(colProg<0) colProg=18;

    function statusColor(v){
      const t=(v||'').toLowerCase();
      if(t==='completed (pcma)'||t==='pcma') return '#2563eb';
      if(t==='completed') return '#16a34a';
      if(t==='on-going') return '#f97316';
      if(t==='100%') return '#14b8a6';
      return '#6b7280';
    }

    headers.forEach((h,i)=>{
      const raw=(h||'').trim(); const L=raw.replace(/[:]/g,'').toUpperCase(); const V=row[i]||''; if(!V) return;
      if(L.startsWith('IMAGE')||L.includes('FOLDER')||L.includes('UPLOAD PICTURES')) return;

      const HIDE_KEYS=['SCHEDULE','ACTUAL','SLIPPAGE','DELAY','PROGRESS','YEAR','CONTRACT ID','ABC','CONTRACT AMOUNT','VARIANCE','CALENDAR DAYS','(CD)','CD','NOTICE TO PROCEED','NTP','EXPIRY DATE','ORIGINAL EXPIRY DATE','REVISED EXPIRY DATE','REV. EXPIRY DATE','REV EXPIRY DATE','DATE OF COMPLETION','COMPLETION DATE','CERTIFICATE OF COMPLETION','CERTIFICATE OF ACCEPTANCE','COC','COA'];
      if(HIDE_KEYS.some(k=>L.includes(k))) {
      } else {
        const d=document.createElement('div'); d.className='detail-row';
        const SHORT_MAP={'PROJECT ENGINEER':'PE','PROJECT INSPECTOR':'PI','RESIDENT ENGINEER':'RE','QUANTITY ENGINEER':'QE','MATERIALS ENGINEER':'ME'};
        const ROLE_CLASS_MAP={'PROJECT ENGINEER':'project-engineer','PROJECT INSPECTOR':'project-inspector','RESIDENT ENGINEER':'resident-engineer','QUANTITY ENGINEER':'quantity-engineer','MATERIALS ENGINEER':'materials-engineer'};
        let displayLabel=L;
        if(SHORT_MAP[L]){ displayLabel=SHORT_MAP[L]; d.classList.add('compact'); }
        const CENTER_SET=new Set(['PROJECT NAME','LOCATION','CONTRACTOR','REMARKS','LAST BILLING']);
        if(CENTER_SET.has(L)) d.classList.add('center-row');

        if(L==='STATUS'){
          const sv=(colStatus>=0?row[colStatus]:V)||'';
          d.innerHTML=`<span class="detail-label">${L}:</span><span class="detail-value status-badge" style="background:${statusColor(sv)}">${sv}</span>`;
        }else{
          d.innerHTML=`<span class="detail-label">${displayLabel}:</span><span class="detail-value ${ROLE_CLASS_MAP[L]||''}">${V}</span>`;
        }
        modalContent.appendChild(d);
      }

      if(L==='CONTRACTOR'){
        const abcIdx = findCol('abc','approved budget for the contract');
        const amtIdx = findCol('contract amount','amount');
        const revAmtIdx = findCol('revised contract amount','rev. contract amount','rev contract amount');
        const cdIdx = findCol('cd','calendar days');
        const revCdIdx = findCol('rev cd','revised cd','revised calendar days');
        const ntpIdx = findCol('notice to proceed','ntp');
        const expIdx = findCol('expiry date','original expiry date');          
        const revExpIdx = findCol('rev. expiry date','revised expiry date','rev expiry date');  
        const docIdx = findCol('date of completion','completion date','doc');
        const cocIdx = findCol('certificate of completion','cert of completion','coc');
        const coaIdx = findCol('certificate of acceptance','cert of acceptance','coa');

        const abcV = abcIdx>-1?row[abcIdx]:'';
        const amtV = amtIdx>-1?row[amtIdx]:'';
        const revAmtV = revAmtIdx>-1?row[revAmtIdx]:'';
        const cdV = cdIdx>-1?row[cdIdx]:'';
        const revCdV = revCdIdx>-1?row[revCdIdx]:'';
        const ntpV = ntpIdx>-1?row[ntpIdx]:'';
        const expV = expIdx>-1?row[expIdx]:'';
        const revExpV = revExpIdx>-1?row[revExpIdx]:'';
        const docV = docIdx>-1?row[docIdx]:'';
        const cocV = cocIdx>-1?row[cocIdx]:'';
        const coaV = coaIdx>-1?row[coaIdx]:'';

        const grid=document.createElement('div'); grid.className='pair-grid';
        function addBox(label,value,span2=false,neg=false){
          const box=document.createElement('div'); box.className='pair-box' + (span2?' span-2':'');
          const l=document.createElement('span'); l.className='pair-label'; l.textContent=label;
          const v=document.createElement('span'); v.className='pair-value'; if(neg) v.classList.add('neg'); v.textContent=value||'—';
          box.appendChild(l); box.appendChild(v); grid.appendChild(box);
        }
        addBox('ABC', abcV);
        addBox('Contract Amount', amtV);
        addBox('Rev. Contract Amount', revAmtV);
        { const __vIdx = findCol('variance'); const __vRaw = __vIdx>-1?row[__vIdx]:'—'; const __vNeg = (parseMoney(__vRaw)??0) < 0; addBox('Variance', __vRaw||'—', false, __vNeg); }
        addBox('CD', cdV);
        addBox('Rev. CD', revCdV);
        addBox('NTP', ntpV);
        addBox('Expiry Date', expV);
        addBox('Rev. Expiry Date', revExpV);
        addBox('Date of Completion', docV);
        addBox('Certificate of Completion', cocV);
        addBox('Certificate of Acceptance', coaV);

        modalContent.appendChild(grid);
      }

      if(L==='STATUS'){
        const schedNum=toPct((colSched>=0&&row[colSched])?row[colSched]:'0%',0);
        const actualNum=toPct((colActual>=0&&row[colActual])?row[colActual]:'0%',0);
        const slipNum=toPct((colSlip>=0&&row[colSlip])?row[colSlip]:'0%',0);

        const mini=document.createElement('div'); mini.className='mini-bars';
        function makeMini(label,num,baseColor,isSlippage=false){
          const r=document.createElement('div'); r.className='mini-row';
          const lab=document.createElement('div'); lab.className='mini-label'; lab.textContent=label;
          const bar=document.createElement('div'); bar.className='mini-bar';
          const fill=document.createElement('div'); fill.className='mini-fill';
          if(isSlippage){
            const cfg=colorForSlippage(num);
            fill.style.background=cfg.bg; fill.style.color=cfg.text;
            bar.appendChild(fill); r.appendChild(lab); r.appendChild(bar); mini.appendChild(r);
            animateMiniBar(fill,num,800,(v)=>`${v.toFixed(2)}%${(cfg.sad && v<=-10)?' ☹️':''}`);
          }else{
            fill.style.background=baseColor; bar.appendChild(fill); r.appendChild(lab); r.appendChild(bar); mini.appendChild(r);
            animateMiniBar(fill,num,800,(v)=>`${v.toFixed(2)}%`);
          }
        }
        makeMini('SCHED',schedNum,'#3b82f6',false);
        makeMini('ACTUAL',actualNum,'#10b981',false);
        makeMini('SLIPPAGE',slipNum,null,true);
        modalContent.appendChild(mini);

        const progRaw=(colProg>=0&&row[colProg])?String(row[colProg]).trim():'0%';
        const delayRaw=(colDelay>=0&&row[colDelay])?String(row[colDelay]).trim():'';
        let pctNum=Math.max(0,toPct(progRaw,0));

        const wrap=document.createElement('div'); wrap.className='progress-wrap';
        const label=document.createElement('div'); label.className='progress-label'; label.textContent='Time Lapsed';
        const bar=document.createElement('div'); bar.className='progress-bar';
        const fill=document.createElement('div'); fill.className='progress-fill'; fill.textContent='0%';
        bar.appendChild(fill); wrap.appendChild(label); wrap.appendChild(bar); modalContent.appendChild(wrap);

        function colorFor(v){ if(v>100) return '#dc2626'; if(v>=100) return '#16a34a'; if(v>80) return '#f97316'; return '#60a5fa'; }
        fill.style.background=colorFor(pctNum);
        requestAnimationFrame(()=>{
          const startTime=performance.now(),duration=900,start=0,end=pctNum;
          function step(now){
            const t=Math.min(1,(now-startTime)/duration);
            const curr=start+(end-start)*t, width=Math.min(curr,100);
            fill.style.width=width+'%';
            fill.textContent=`${Math.round(curr)}%${delayRaw?' ('+delayRaw+')':''}`;
            if(t<1) requestAnimationFrame(step);
            else { fill.style.width=Math.min(end,100)+'%'; fill.style.background=colorFor(end); fill.textContent=`${Math.round(end)}%${delayRaw?' ('+delayRaw+')':''}`; }
          }
          requestAnimationFrame(step);
        });
      }
    });

    if(colUpload>=0){
      const link = String(row[colUpload]||'').trim();
      if(link && isValidUrl(link)){
        const b=document.createElement('button');
        b.id='uploadBtn'; b.textContent='Upload Picture';
        b.onclick=e=>{ e.stopPropagation(); window.open(link,'_blank','noopener'); };
        modalButtons.appendChild(b);
      }
    }
    const viewBtn=document.createElement('button');
    viewBtn.id='viewPictureBtn'; 
    viewBtn.textContent='View Picture';
    viewBtn.onclick=e=>{ e.stopPropagation(); openFloatingGallery(row); };
    modalButtons.appendChild(viewBtn);

    const presentBtn=document.createElement('button');
    presentBtn.id='presentBtn';
    presentBtn.textContent='Present (Projector Mode)';
    presentBtn.onclick=e=>{ e.stopPropagation(); openPresentation(row); };
    modalButtons.appendChild(presentBtn);

    if(collectImageUrls(row).length===0){
      const box=document.createElement('div'); 
      box.style.textAlign='center'; box.style.marginTop='12px';
      const cap=document.createElement('p'); 
      cap.textContent='No images available';
      cap.style.color='#2563eb'; cap.style.fontWeight='700'; cap.style.marginTop='8px';
      box.appendChild(cap); 
      modalImages.appendChild(box);
    }

    (function(){
      const orangeSet=new Set(['PROJECT NAME','LOCATION','CONTRACTOR','LAST BILLING','REMARKS']);
      const rows=[...modalContent.querySelectorAll('.detail-row')];
      rows.forEach(row=>{
        const labelEl=row.querySelector('.detail-label');
        if(!labelEl) return;
        const raw=(labelEl.textContent||'').replace(':','').trim().toUpperCase();
        if(orangeSet.has(raw)){
          row.classList.add('emph-orange');
          row.classList.add('center-row');
        }
      });
    })();
  }
  function closeModal(){ modalBg.classList.remove('show'); document.body.classList.remove('no-scroll'); }
  closeModalTop.addEventListener('click',closeModal);
  modalBg.addEventListener('click',e=>{ if(e.target===modalBg) closeModal(); });
  window.addEventListener('keydown',(e)=>{
    if(e.key==='Escape' && modalBg.classList.contains('show')) closeModal();
    if(e.key==='ArrowRight' && modalBg.classList.contains('show')) goModal(1);
    if(e.key==='ArrowLeft' && modalBg.classList.contains('show')) goModal(-1);
  });

  /* ===== MODAL NAVIGATION ===== */
  function openDetailFromList(idx){
    modalNavList = lastRenderedRows.slice();
    modalNavIndex = idx;
    const row = modalNavList[modalNavIndex];
    showDetail(row);
  }
  function goModal(delta){
    if(!modalNavList.length) return;
    let next = modalNavIndex + delta;
    if(next<0) next=0;
    if(next>modalNavList.length-1) next=modalNavList.length-1;
    if(next===modalNavIndex) return;
    modalNavIndex = next;
    showDetail(modalNavList[modalNavIndex]);
  }
  modalPrevFloat.addEventListener('click',(e)=>{e.stopPropagation();goModal(-1);});
  modalNextFloat.addEventListener('click',(e)=>{e.stopPropagation();goModal(1);});

  /* ===== PROJECTOR MODE ===== */
  function statusChipColor(t){const s=(t||'').toLowerCase().trim(); if(s==='completed (pcma)'||s==='pcma') return '#2563eb'; if(s==='completed') return '#16a34a'; if(s==='on-going') return '#f59e0b'; if(s==='100%') return '#14b8a6'; return '#64748b';}
  function fmtDateSafe(x){const raw=(x||'').toString().trim(); if(!raw) return '—'; const d=new Date(raw); if(!isNaN(d)) return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}); return raw;}
  function openPresentation(row){
    presentState.row=row;
    const cidIdx=headers.findIndex(h=>h.includes('contract id'));
    const projIdx=headers.findIndex(h=>h.includes('project name'));
    const amtIdx=headers.findIndex(h=>h.includes('contract amount'));
    const revAmtIdx=headers.findIndex(h=>h.includes('rev. contract amount','revised contract amount','rev contract amount'));
    const contIdx=headers.findIndex(h=>h.includes('contractor'));
    const statIdx=headers.findIndex(h=>h.includes('status'));
    const ntpIdx=headers.findIndex(h=>h.includes('notice to proceed','ntp'));
    const expIdx=headers.findIndex(h=>h.includes('expiry date','original expiry date'));
    const revIdx=headers.findIndex(h=>h.includes('rev. expiry date','revised expiry date','rev expiry date'));
    presentCID.textContent = cidIdx>-1 ? (row[cidIdx]||'—') : '—';
    presentProj.textContent = projIdx>-1 ? (row[projIdx]||'—') : '—';
    presentContractor.textContent = contIdx>-1 ? (row[contIdx]||'—') : '—';
    const amtRaw = amtIdx>-1 ? row[amtIdx] : '';
    const revRaw = revAmtIdx>-1 ? row[revAmtIdx] : '';
    const amtNum = parseMoney(amtRaw); const revNum = parseMoney(revRaw);
    presentAmt.textContent = amtNum!=null?fmtPHP(amtNum):(amtRaw||'—');
    presentRevAmt.textContent = revNum!=null?fmtPHP(revNum):(revRaw||'—');
    presentNTP.textContent = fmtDateSafe(ntpIdx>-1 ? row[ntpIdx] : '');
    presentExpiry.textContent = fmtDateSafe(expIdx>-1 ? row[expIdx] : '');
    presentRevExpiry.textContent = fmtDateSafe(revIdx>-1 ? row[revIdx] : '');
    const remIdx = findCol('remarks');
    presentRemarks.textContent = remIdx>-1 ? (row[remIdx]||'—') : '—';
    const st = statIdx>-1 ? (row[statIdx]||'—') : '—';
    presentStatusChip.textContent = st;
    presentStatusChip.style.background = statusChipColor(st);

    const colSched=headers.findIndex(h=>h.includes('sched'));
    const colActual=headers.findIndex(h=>h.includes('actual'));
    const colSlip=headers.findIndex(h=>h.includes('slip'));
    const s=toPct(colSched>-1?row[colSched]:'0%');
    const a=toPct(colActual>-1?row[colActual]:'0%');
    const l=toPct(colSlip>-1?row[colSlip]:'0%');
    const sEl=document.getElementById('pMiniSched');
    const aEl=document.getElementById('pMiniActual');
    const lEl=document.getElementById('pMiniSlip');
    sEl.style.background='#3b82f6'; animateMiniBar(sEl,s,800,v=>`${v.toFixed(2)}%`);
    aEl.style.background='#10b981'; animateMiniBar(aEl,a,800,v=>`${v.toFixed(2)}%`);
    const cfg=colorForSlippage(l); lEl.style.background=cfg.bg; lEl.style.color=cfg.text; animateMiniBar(lEl,l,800,v=>`${v.toFixed(2)}%${(cfg.sad && v<=-10)?' ☹️':''}`);

    presentSlides.innerHTML=''; presentThumbs.innerHTML='';
    presentState.items = collectImageUrls(row);
    if(!presentState.items.length){
      const sld=document.createElement('div'); sld.className='present-slide active'; sld.innerHTML=`<img src="${LOGO_FALLBACK}" alt="No image">`; presentSlides.appendChild(sld);
      presentCounter.textContent='0 / 0';
    }else{
      presentState.items.forEach((it,i)=>{
        const sld=document.createElement('div'); sld.className='present-slide'+(i===0?' active':''); sld.innerHTML=`<img src="${it.url}" alt="${it.label}">`; presentSlides.appendChild(sld);
        const th=document.createElement('img'); th.className='present-thumb'+(i===0?' active':''); th.src=it.url; th.alt=it.label; th.onclick=()=>showPresentIndex(i); presentThumbs.appendChild(th);
      });
      presentCounter.textContent=`1 / ${presentState.items.length}`;
    }

    presentState.index=0;
    presentOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
    stopPresentAuto();
    startPresentAuto();
  }
  function showPresentIndex(i){
    if(!presentState.items.length) return;
    const N=presentState.items.length;
    presentState.index=(i%N+N)%N;
    [...presentSlides.children].forEach((el,idx)=>el.classList.toggle('active', idx===presentState.index));
    [...presentThumbs.children].forEach((el,idx)=>el.classList.toggle('active', idx===presentState.index));
    presentCounter.textContent=`${presentState.index+1} / ${N}`;
  }
  function startPresentAuto(){
    if(presentState.timer || !presentState.items.length) return;
    presentState.timer=setTimeout(function tick(){ showPresentIndex(presentState.index+1); presentState.timer=setTimeout(tick,presentState.delay); },presentState.delay);
    presentPlay.textContent='Pause';
  }
  function stopPresentAuto(){
    if(presentState.timer){ clearTimeout(presentState.timer); presentState.timer=null; }
    presentPlay.textContent='Play';
  }
  presentPrev.addEventListener('click',()=>showPresentIndex(presentState.index-1));
  presentNext.addEventListener('click',()=>showPresentIndex(presentState.index+1));
  presentPlay.addEventListener('click',()=>{ presentState.timer?stopPresentAuto():startPresentAuto(); });
  presentOpen.addEventListener('click',()=>{ if(presentState.items.length){ window.open(presentState.items[presentState.index].url,'_blank','noopener'); } });
  presentClose.addEventListener('click',()=>{ stopPresentAuto(); presentOverlay.classList.remove('show'); document.body.classList.remove('no-scroll'); });
  window.addEventListener('keydown',(e)=>{
    if(!presentOverlay.classList.contains('show')) return;
    if(e.key==='Escape'){ presentClose.click(); }
    else if(e.key==='ArrowRight'){ showPresentIndex(presentState.index+1); }
    else if(e.key==='ArrowLeft'){ showPresentIndex(presentState.index-1); }
  });

  /* finally load data */
  loadData();
}
