document.addEventListener('DOMContentLoaded', () => {
  const qs = (s, p=document) => p.querySelector(s);
  const qsa = (s, p=document) => Array.from(p.querySelectorAll(s));
  const getCssVar = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();

  // Init
  initHero();
  initCharts();
  initDetails();
  initRecs();
  updateFooterTime();
  initSimulator();
  initEnhancedCharts();

  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  if(themeBtn){
    const saved = localStorage.getItem('modelsTheme') || 'light';
    document.body.classList.toggle('theme-dark', saved==='dark');
    themeBtn.setAttribute('aria-pressed', saved==='dark'?'true':'false');
    themeBtn.querySelector('i').className = saved==='dark' ? 'ri-sun-line' : 'ri-moon-line';
    themeBtn.addEventListener('click', ()=>{
      const isDark = document.body.classList.toggle('theme-dark');
      localStorage.setItem('modelsTheme', isDark?'dark':'light');
      themeBtn.setAttribute('aria-pressed', isDark?'true':'false');
      themeBtn.querySelector('i').className = isDark ? 'ri-sun-line' : 'ri-moon-line';
      renderCharts({});
      initEnhancedCharts();
    });
  }

  // Chips interactions
  const chips = document.getElementById('chips');
  if(chips){
    chips.addEventListener('click', (e)=>{
      const b = e.target.closest('.chip');
      if(!b) return;
      Array.from(chips.querySelectorAll('.chip')).forEach(x=>{ x.classList.remove('is-active'); x.setAttribute('aria-selected','false'); });
      b.classList.add('is-active'); b.setAttribute('aria-selected','true');
      const cat = b.getAttribute('data-cat');
      // Simple scroll to sections
      if(cat==='trends') document.getElementById('recTitle')?.scrollIntoView({ behavior:'smooth' });
      if(cat==='pitching') document.getElementById('pitcherChart')?.scrollIntoView({ behavior:'smooth' });
      if(cat==='batting') document.getElementById('batterChart')?.scrollIntoView({ behavior:'smooth' });
      if(cat==='overview') document.getElementById('heroTitle')?.scrollIntoView({ behavior:'smooth' });
    });
  }

  // Ripple + focus a11y
  document.querySelectorAll('.btn, .toggle-btn, .chip').forEach(el=>{
    if(el._ripple) return; el._ripple=true;
    el.addEventListener('click', ()=>{ el.classList.add('ripple'); setTimeout(()=> el.classList.remove('ripple'), 350); });
  });

  // Background parallax with orbs
  const onScroll = ()=>{
    const sc = Math.min(1, window.scrollY/600);
    document.querySelectorAll('.orb').forEach((o,i)=>{
      const dir = i%2===0 ? 1 : -1;
      o.style.transform = `translate3d(${dir*sc*12}px, ${-sc*24}px, 0)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  // Confidence slider -> affect charts and numbers
  const confSlider = document.getElementById('confidenceSlider');
  const confVal = document.getElementById('confidenceValue');
  if(confSlider && confVal){
    const apply = ()=>{
      confVal.textContent = confSlider.value + '%';
      // Re-render with slight adjustments based on confidence
      try{ renderCharts({ mode: document.querySelector('.toggle-btn.is-active')?.dataset.mode || 'today' }); }catch{}
      try{ initEnhancedCharts(); }catch{}
      // Also animate bar
      const fill = document.getElementById('confidenceFill');
      if(fill){ fill.style.width = Math.max(40, Math.min(95, confSlider.value)) + '%'; }
    };
    confSlider.addEventListener('input', apply);
    setTimeout(apply, 0);
  }

  // Summary skeleton before first paints
  (function skeleton(){
    const win = document.getElementById('winPercentage');
    if(!win) return;
    win.style.opacity='.6';
    const hs = document.getElementById('homeScore'); const as = document.getElementById('awayScore');
    [hs,as].forEach(el=>{ if(el){ el.style.opacity='.6'; } });
    setTimeout(()=>{ [win,hs,as].forEach(el=>{ if(el){ el.style.opacity=''; } }); }, 400);
  })();

  function initHero(){
    const gameSelect = qs('#gameSelect');
    ['DRG vs TIG 19:05','LIO vs MON 18:35','BRO vs EAG 18:35'].forEach((t,i)=>{
      const o = document.createElement('option'); o.value = `g${i}`; o.textContent = t; gameSelect.appendChild(o);
    });

    qsa('.toggle-btn').forEach(b=> b.addEventListener('click', ()=>{
      qsa('.toggle-btn').forEach(x=>x.classList.remove('is-active'));
      b.classList.add('is-active');
      // mock update
      renderCharts({ mode: b.dataset.mode });
    }));

    qs('#pinSummary')?.addEventListener('click', () => {
      const key = 'pb-pinned-summary';
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), game: gameSelect.value }));
      alert('已釘選到首頁！');
    });
  }

  // Charts
  let cWin, cBars, cLine, cRadar;
  function initCharts(){ renderCharts({}); }

  function renderCharts({ mode='today' }){
    const colorHome = getCssVar('--chart-home') || '#2563eb';
    const colorAway = getCssVar('--chart-away') || '#ef4444';
    const muted = getCssVar('--chart-muted') || 'rgba(2,6,23,.12)';

    // Win Donut
    const win = qs('#winDonut'); if(win){ try{ cWin?.destroy(); }catch{}; const val = mode==='today'?62:58; cWin = new Chart(win, {
      type:'doughnut', data:{ labels:['主隊','客隊'], datasets:[{ data: [val, 100-val], backgroundColor:[colorHome, colorAway], borderWidth:0, cutout:'72%' }] }, options:{ plugins:{ legend:{ display:false } } },
      plugins:[{ id:'centerText', afterDraw(chart){ const { ctx, chartArea } = chart; const x=(chartArea.left+chartArea.right)/2; const y=(chartArea.top+chartArea.bottom)/2+5; ctx.save(); ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text')||'#111'; ctx.font='700 24px Inter, Noto Sans TC'; ctx.textAlign='center'; ctx.fillText(val+'%', x, y); ctx.restore(); } }]
    }); }

    // Score Bars
    const bars = qs('#scoreBars'); if(bars){ try{ cBars?.destroy(); }catch{}; cBars = new Chart(bars, {
      type:'bar', data:{ labels:['主隊','客隊'], datasets:[{ data: mode==='today'?[5.3,4.7]:[4.8,4.2], backgroundColor:[colorHome, colorAway], borderRadius:10, borderSkipped:false }] }, options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color: muted } } } }
    }); }

    // Inning Line
    const line = qs('#inningLine'); if(line){ try{ cLine?.destroy(); }catch{}; cLine = new Chart(line, {
      type:'line', data:{ labels:['1','2','3','4','5','6','7','8','9'], datasets:[{ label:'主隊', data:[0.6,0.3,0.7,0.5,0.6,0.4,0.7,0.5,0.8], borderColor: colorHome, tension:.3 }, { label:'客隊', data:[0.4,0.5,0.6,0.4,0.5,0.6,0.5,0.4,0.6], borderColor: colorAway, tension:.3 }] }, options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ grid:{ color: muted } } } }
    }); }

    // P v B Radar
    const radar = qs('#pvbRadar'); if(radar){ try{ cRadar?.destroy(); }catch{}; cRadar = new Chart(radar, {
      type:'radar', data:{ labels:['長打','控球','壓制','選球','穩定','速度'], datasets:[{ label:'投手', data:[70,82,78,65,80,84], borderColor: colorHome, backgroundColor: hexA(colorHome,.15), pointRadius:2, fill:true }, { label:'打者', data:[75,68,72,80,70,76], borderColor: colorAway, backgroundColor: hexA(colorAway,.15), pointRadius:2, fill:true }] }, options:{ plugins:{ legend:{ display:false } } }
    }); }

    // 更新 Hero 數字
    animateNumber(qs('#winPercentage'), mode==='today'?62:58, '%');
    animateNumber(qs('#homeScore'), mode==='today'?5.3:4.8, '');
    animateNumber(qs('#awayScore'), mode==='today'?4.7:4.2, '');
  }

  function hexA(hex, a){
    const m = hex.replace('#','');
    const i = parseInt(m.length===3 ? m.split('').map(x=>x+x).join('') : m, 16);
    const r=(i>>16)&255, g=(i>>8)&255, b=i&255; return `rgba(${r},${g},${b},${a})`;
  }

  function initDetails(){
    // mock players
    const batters = [
      { name:'A. Chen', img:'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=300&auto=format&fit=crop', stats:'安打率 31% · HR 機率 12% · 上壘率 36%' },
      { name:'J. Wang', img:'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=300&auto=format&fit=crop', stats:'安打率 28% · HR 機率 9% · 上壘率 33%' }
    ];
    const pitchers = [
      { name:'R. Tanaka', img:'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=300&auto=format&fit=crop', stats:'K% 27% · 失分率 3.2 · 控球穩定 82' },
      { name:'K. Lin', img:'https://images.unsplash.com/photo-1521417531048-9b7e1b6c6d51?q=80&w=300&auto=format&fit=crop', stats:'K% 24% · 失分率 3.8 · 控球穩定 78' }
    ];
    const batList = qs('#battersList');
    if(batList){ batList.innerHTML = batters.map(p => playerCard(p)).join(''); }
    const pitList = qs('#pitchersList');
    if(pitList){ pitList.innerHTML = pitchers.map(p => playerCard(p)).join(''); }

    // MVP
    const mvpEl = qs('#mvpName');
    if(mvpEl) mvpEl.textContent = batters[0].name;
  }

  function playerCard(p){
    return `<div class="player-card"><img src="${p.img}" alt="${p.name}"><div><div class="name">${p.name}</div><div class="stats">${p.stats}</div></div></div>`;
  }

  function initRecs(){
    // 歷史比賽
    const historical = [
      { date: '2024-07-15', teams: 'DRG vs TIG', result: '5:4', accuracy: '✓' },
      { date: '2024-06-28', teams: 'DRG vs TIG', result: '3:2', accuracy: '✓' },
      { date: '2024-05-12', teams: 'DRG vs TIG', result: '7:1', accuracy: '✗' }
    ];
    qs('#historicalMatches').innerHTML = historical.map(h => 
      `<div class="historical-match">
        <span>${h.date} ${h.teams}</span>
        <span>${h.result} ${h.accuracy}</span>
      </div>`
    ).join('');

    // 模型洞察
    const insights = [
      '主隊近5場主場勝率達78%',
      '投手A.Chen對Tigers歷史優勢明顯',
      '雨天條件下主隊表現更穩定'
    ];
    qs('#insightsList').innerHTML = insights.map(i => 
      `<div class="insight-item">${i}</div>`
    ).join('');

    // 趨勢圖表
    const trendCtx = qs('#trendChart');
    if(trendCtx){
      const colorHome = getCssVar('--chart-home') || '#2563eb';
      new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: ['近7天', '近14天', '近30天'],
          datasets: [{
            label: '模型準確度',
            data: [87, 82, 85],
            borderColor: colorHome,
            backgroundColor: hexA(colorHome, .1),
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 70, max: 100, grid: { color: getCssVar('--chart-grid') } }
          }
        }
      });
    }
  }

  function initInteract(){
    const sel = id => qs(id);
    const m = sel('#matchPicker'), t = sel('#teamPicker'), p = sel('#playerPicker');
    ['今日 - DRG vs TIG','今日 - LIO vs MON','明日 - BRO vs EAG'].forEach((x,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=x; m.appendChild(o); });
    ['Dragons','Tigers','Lions','Monkeys'].forEach(x=>{ const o=document.createElement('option'); o.value=x; o.textContent=x; t.appendChild(o); });
    ['A. Chen','J. Wang','R. Tanaka','K. Lin'].forEach(x=>{ const o=document.createElement('option'); o.value=x; o.textContent=x; p.appendChild(o); });

    m.addEventListener('change', () => renderCharts({}));
    t.addEventListener('change', () => renderCharts({}));
    p.addEventListener('change', () => renderCharts({}));
  }

  function initSimulator(){
    // 模擬器控制
    qs('#updateSim')?.addEventListener('click', () => {
      const pitcher = qs('#pitcherSelect').value;
      const lineup = qs('#batterSelect').value;
      // 模擬更新預測
      const newWin = pitcher === 'chen' ? 65 : 58;
      animateNumber(qs('#winPercentage'), newWin, '%');
      renderCharts({ mode: 'today' });
    });

    // 多比賽對比
    qs('#compareBtn')?.addEventListener('click', () => {
      const compareMatch = qs('#compareMatch').value;
      const result = qs('#comparisonResult');
      if(result){
        result.removeAttribute('hidden');
        // 模擬對比數據
        const currentWin = parseInt(qs('#winPercentage').textContent) || 62;
        const compareWin = compareMatch === 'lio-mon' ? 55 : 48;
        result.querySelector('.compare-item:last-child .win-prob').textContent = compareWin + '%';
      }
    });
  }

  function initEnhancedCharts(){
    // 勝率變化圖
    const winProbCtx = qs('#winProbLine');
    if(winProbCtx){
      const colorHome = getCssVar('--chart-home') || '#2563eb';
      const colorAway = getCssVar('--chart-away') || '#ef4444';
      const innings = ['1','2','3','4','5','6','7','8','9'];
      const homeProb = [52,48,55,52,58,62,65,68,62];
      const awayProb = homeProb.map(x => 100-x);
      
      new Chart(winProbCtx, {
        type: 'line',
        data: {
          labels: innings,
          datasets: [
            { label: '主隊勝率', data: homeProb, borderColor: colorHome, backgroundColor: hexA(colorHome,.1), fill: true, tension: 0.3 },
            { label: '客隊勝率', data: awayProb, borderColor: colorAway, backgroundColor: hexA(colorAway,.1), fill: true, tension: 0.3 }
          ]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, grid: { color: getCssVar('--chart-grid') } },
            x: { grid: { color: getCssVar('--chart-grid') } }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    }

    // 投手雷達圖
    const pitcherCtx = qs('#pitcherChart') || qs('#pitcherChart2');
    if(pitcherCtx){
      const colorHome = getCssVar('--chart-home') || '#2563eb';
      new Chart(pitcherCtx, {
        type: 'radar',
        data: {
          labels: ['速球', '變化球', '控球', '耐力', '壓制力'],
          datasets: [{
            data: [85, 78, 82, 80, 88],
            borderColor: colorHome,
            backgroundColor: hexA(colorHome, .15),
            pointBackgroundColor: colorHome,
            pointRadius: 3,
            fill: true
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            r: {
              suggestedMin: 50,
              suggestedMax: 100,
              grid: { color: getCssVar('--chart-grid') },
              pointLabels: { color: getCssVar('--text-dim') }
            }
          }
        }
      });
    }

    // 打者條狀圖
    const batterCtx = qs('#batterChart') || qs('#batterChart2');
    if(batterCtx){
      const colorAway = getCssVar('--chart-away') || '#ef4444';
      new Chart(batterCtx, {
        type: 'bar',
        data: {
          labels: ['打擊率', '上壘率', '長打率', '選球'],
          datasets: [{
            data: [0.285, 0.352, 0.456, 0.324],
            backgroundColor: [
              hexA(colorAway, .8),
              hexA(colorAway, .7),
              hexA(colorAway, .6),
              hexA(colorAway, .5)
            ],
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: getCssVar('--chart-grid') } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  function animateNumber(el, target, suffix = ''){
    if(!el) return;
    const start = parseFloat(el.textContent) || 0;
    const duration = 1200;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (target - start) * eased;
      
      el.textContent = (suffix === '%' ? Math.round(current) : current.toFixed(1)) + suffix;
      
      if(progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  function animateVoteBar(selector, percentage){
    const bar = qs(selector);
    if(!bar) return;
    bar.style.transition = 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    setTimeout(() => {
      bar.style.width = percentage + '%';
    }, 50);
  }

  function updateFooterTime(){
    const d = new Date();
    const s = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    const el = qs('#modelUpdated'); if(el) el.textContent = s;
  }

  // Model toggle
  const modelToggles = Array.from(document.querySelectorAll('.toggle .toggle-btn[data-model]'));
  if(modelToggles.length){
    modelToggles.forEach(btn=> btn.addEventListener('click', ()=>{
      modelToggles.forEach(x=> x.classList.remove('is-active'));
      btn.classList.add('is-active');
      // Recompute charts slightly based on model type
      renderCharts({ mode: document.querySelector('.toggle-btn[data-mode].is-active')?.dataset.mode || 'today' });
      initEnhancedCharts();
      renderExplain();
    }));
  }

  // Explain data + chart
  function currentModel(){ return document.querySelector('.toggle-btn[data-model].is-active')?.dataset.model || 'ens'; }
  function renderExplain(){
    const list = document.getElementById('featList'); const bar = document.getElementById('featBar'); if(!list) return;
    const mod = currentModel();
    const feats = getFeatForModel(mod);
    list.innerHTML = feats.map(f => `<li class="feat-item"><span class="feat-label">${f.name}</span><span class="feat-value ${f.value>=0?'pos':'neg'}">${f.value>0?'+':''}${f.value.toFixed(2)}</span></li>`).join('');
    if(bar && typeof Chart!=='undefined'){
      try{ renderExplain._chart?.destroy(); }catch{}
      renderExplain._chart = new Chart(bar, {
        type:'bar', data:{ labels: feats.map(f=>f.name), datasets:[{ data: feats.map(f=>f.value), backgroundColor: feats.map(f=> f.value>=0 ? '#10b981' : '#ef4444'), borderRadius:6, borderSkipped:false }] },
        options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color: getCssVar('--chart-muted') } } } }
      });
    }
  }

  function getFeatForModel(m){
    if(m==='xgb') return [
      { name:'先發投手 K/9', value: 0.22 },
      { name:'打者 OPS', value: 0.16 },
      { name:'牛棚疲勞', value: -0.09 },
      { name:'主場因子', value: 0.12 },
      { name:'天氣風速', value: -0.05 },
      { name:'對戰歷史', value: 0.07 }
    ];
    if(m==='nn') return [
      { name:'打者揮空率', value: 0.19 },
      { name:'投手變化球值', value: 0.14 },
      { name:'守備效率', value: 0.1 },
      { name:'旅行疲勞', value: -0.06 },
      { name:'主客場差', value: 0.08 },
      { name:'近五場表現', value: 0.11 }
    ];
    return [
      { name:'先發投手 K/9', value: 0.18 },
      { name:'打者 OPS', value: 0.13 },
      { name:'主場因子', value: 0.1 },
      { name:'牛棚疲勞', value: -0.07 },
      { name:'天氣風速', value: -0.04 },
      { name:'近況熱度', value: 0.09 }
    ];
  }

  // Export & Share
  document.getElementById('exportPng')?.addEventListener('click', ()=>{
    const canvas = document.getElementById('featBar'); if(!canvas) return alert('沒有可匯出的圖表');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'model_features.png'; a.click();
  });
  document.getElementById('shareLink')?.addEventListener('click', ()=>{
    const url = location.href + `#model=${currentModel()}`;
    if(navigator.share) navigator.share({ title:'模型解釋', text:'查看模型特徵貢獻', url });
    else { navigator.clipboard?.writeText(url); alert('連結已複製'); }
  });

  // Initial render for explain
  renderExplain();
}); 