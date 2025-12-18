// Splash Screen Control
(function initSplash(){
  const splash = document.getElementById('splash');
  if(!splash) return;
  const root = document.documentElement;
  const main = document.querySelector('main');
  if(main){ main.classList.add('page-enter'); }

  let cleared = false;
  const clearSplash = ()=>{
    if(cleared) return; cleared = true;
    splash.classList.add('hidden');
    setTimeout(()=>{ splash.remove(); if(main){ main.classList.add('ready'); } }, 550);
  };

  // 計時 1.5 秒關閉（延長棒球 SVG 顯示）
  const t = setTimeout(clearSplash, 1500);

  // 點擊或按鍵可跳過
  ['click','keydown','touchstart'].forEach(evt => splash.addEventListener(evt, ()=>{ clearTimeout(t); clearSplash(); }, { once:true, passive:true }));
})();

document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  function getCssVar(name){
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }
  function hexToRgba(hex, alpha){
    if(!hex) return `rgba(0,0,0,${alpha})`;
    const m = hex.replace('#','');
    const bigint = parseInt(m.length === 3 ? m.split('').map(x=>x+x).join('') : m, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Initialize theme first so that subsequent components render with the right colors
  initTheme();

  initYear();
  initLazyImages();
  initCountdown();
  // 圖表由主題初始化時統一建立與重建
  initToggles();
  initTimeline();
  initSearch();

  function initYear(){
    const yearEl = qs('#year');
    if(yearEl){ yearEl.textContent = new Date().getFullYear(); }
  }

  function initLazyImages(){
    const lazyImgs = qsa('img.lazy');
    const onLoad = (img) => () => img.classList.add('is-loaded');
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if(src){ img.src = src; }
            img.addEventListener('load', onLoad(img), { once: true });
            obs.unobserve(img);
          }
        })
      }, { rootMargin: '100px' })
      lazyImgs.forEach(img => io.observe(img));
    } else {
      lazyImgs.forEach(img => {
        const src = img.getAttribute('data-src');
        if(src){ img.src = src; }
        img.addEventListener('load', onLoad(img), { once: true });
      })
    }
  }

  function initCountdown(){
    const el = qs('#countdownText');
    if(!el) return;
    const startTime = Date.now() + 1000 * 60 * 25;
    const tick = () => {
      const delta = Math.max(0, startTime - Date.now());
      const mins = Math.floor(delta / 60000);
      const secs = Math.floor((delta % 60000) / 1000).toString().padStart(2, '0');
      if(delta <= 0){
        animateSwap(el, '比賽進行中');
        clearInterval(timer);
        return;
      }
      animateSwap(el, `開球倒數 ${mins}:${secs}`);
    }
    tick();
    const timer = setInterval(tick, 1000);
  }

  function animateSwap(el, text){
    if(el._text === text) return; el._text = text;
    el.style.transition = 'transform .18s ease, opacity .18s ease';
    el.style.transform = 'translateY(4px)'; el.style.opacity = '.6';
    setTimeout(()=>{ el.textContent = text; el.style.transform=''; el.style.opacity='1'; }, 90);
  }

  // 粒子效果（Hero 背景裝飾）
  (function heroParticles(){
    const hero = document.querySelector('.hero');
    if(!hero) return;
    let layer = hero.querySelector('.particles');
    if(!layer){ layer = document.createElement('div'); layer.className = 'particles'; hero.appendChild(layer); }
    const n = 26;
    for(let i=0;i<n;i++){
      const s = document.createElement('span');
      s.style.position='absolute';
      s.style.width=s.style.height = `${6+Math.random()*6}px`;
      s.style.borderRadius='50%';
      s.style.background='rgba(255,255,255,.18)';
      s.style.left = `${Math.random()*100}%`;
      s.style.top = `${Math.random()*100}%`;
      s.style.filter='blur(0.5px)';
      s.style.animation = `float${i%3} ${6+Math.random()*4}s ease-in-out ${Math.random()*2}s infinite`;
      layer.appendChild(s);
    }
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float0{ 0%,100%{ transform: translateY(-2px) } 50%{ transform: translateY(4px) } }
      @keyframes float1{ 0%,100%{ transform: translateX(-2px) } 50%{ transform: translateX(3px) } }
      @keyframes float2{ 0%,100%{ transform: translate(0,0) } 50%{ transform: translate(2px,-3px) } }
    `;
    document.head.appendChild(style);
  })();

  function initWinProbabilityChart(){
    const ctx = qs('#winProbChart');
    if(!ctx) return;
    const home = 62; // example
    const away = 38;
    const colorHome = getCssVar('--chart-home');
    const colorAway = getCssVar('--chart-away');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Dragons', 'Tigers'],
        datasets: [{
          data: [home, away],
          backgroundColor: [colorHome, colorAway],
          borderWidth: 0,
          hoverOffset: 6,
          cutout: '72%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.formattedValue}%`
            }
          }
        },
        animation: { duration: 900 }
      }
    });
  }

  function initRadarChart(){
    const ctx = qs('#pitchRadarChart');
    if(!ctx) return;
    const colorHome = getCssVar('--chart-home');
    const colorAway = getCssVar('--chart-away');
    const grid = getCssVar('--chart-grid');
    const tick = getCssVar('--chart-tick');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['速球威力', '控球', '變化', '伸卡', '壓迫', '耐力'],
        datasets: [
          {
            label: 'Dragons SP',
            data: [85, 78, 74, 68, 82, 80],
            fill: true,
            backgroundColor: hexToRgba(colorHome, .18),
            borderColor: colorHome,
            pointBackgroundColor: colorHome,
            pointRadius: 2
          },
          {
            label: 'Tigers SP',
            data: [78, 82, 80, 74, 75, 77],
            fill: true,
            backgroundColor: hexToRgba(colorAway, .16),
            borderColor: colorAway,
            pointBackgroundColor: colorAway,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            angleLines: { color: grid },
            grid: { color: grid },
            pointLabels: { color: tick },
            suggestedMin: 50,
            suggestedMax: 100,
            ticks: { display: false }
          }
        }
      }
    });
  }

  function initTeamBars(){
    const left = qs('#teamLeftBar');
    const right = qs('#teamRightBar');
    if(!left || !right) return;

    const labels = ['打擊率', '全壘打', '上壘率', '守備率'];
    const leftData = [0.268, 112, 0.335, 0.986];
    const rightData = [0.254, 98, 0.319, 0.981];

    const grid = getCssVar('--chart-grid');
    const tick = getCssVar('--chart-tick');

    const makeBar = (canvas, data, color) => new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c } = chart;
            const gradient = c.createLinearGradient(0, 0, chart.width, 0);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, getCssVar('--chart-muted'));
            return gradient;
          },
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tick } },
          y: { grid: { color: grid }, ticks: { color: tick } }
        },
        animation: { duration: 800 }
      }
    });

    makeBar(left, leftData, getCssVar('--chart-home'));
    makeBar(right, rightData, getCssVar('--chart-away'));
  }

  function initModelGauge(){
    const ctx = qs('#modelGauge');
    if(!ctx) return;
    const prob = 0.64;
    const value = Math.round(prob * 100);

    const colorHome = getCssVar('--chart-home');
    const colorMuted = getCssVar('--chart-muted');

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['勝率', '其餘'],
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: [colorHome, colorMuted],
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        rotation: -90,
        circumference: 180,
        animation: { duration: 900 }
      },
      plugins: [{
        id: 'centerText',
        afterDraw(chart){
          const { ctx, chartArea } = chart;
          const x = (chartArea.left + chartArea.right) / 2;
          const y = (chartArea.top + chartArea.bottom) / 2 + 8;
          ctx.save();
          ctx.fillStyle = getCssVar('--text');
          ctx.font = '700 28px Inter, Noto Sans TC, Roboto';
          ctx.textAlign = 'center';
          ctx.fillText(`${value}%`, x, y);
          ctx.restore();
        }
      }]
    });

    const confidenceText = qs('#confidenceText');
    if(confidenceText){ confidenceText.textContent = value >= 60 ? '高' : value >= 45 ? '中' : '低'; }
  }

  function initToggles(){
    const reportBtn = qs('#toggleReport');
    const report = qs('#reportPanel');
    const paramsBtn = qs('#toggleParams');
    const params = qs('#paramsPanel');

    if(reportBtn && report){
      reportBtn.addEventListener('click', () => {
        const isHidden = report.hasAttribute('hidden');
        if(isHidden) report.removeAttribute('hidden'); else report.setAttribute('hidden','');
      })
    }
    if(paramsBtn && params){
      paramsBtn.addEventListener('click', () => {
        const isHidden = params.hasAttribute('hidden');
        if(isHidden) params.removeAttribute('hidden'); else params.setAttribute('hidden','');
      })
    }
    const predictBtn = qs('#predictBtn');
    if(predictBtn){
      predictBtn.addEventListener('click', () => {
        window.scrollTo({ top: qs('#models').offsetTop - 64, behavior: 'smooth' });
      })
    }
  }

  function initTimeline(){
    qsa('.toggle-more').forEach(btn => {
      const more = btn.parentElement.querySelector('.more');
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if(more){
          if(more.hasAttribute('hidden')) more.removeAttribute('hidden'); else more.setAttribute('hidden','');
        }
      })
    })
  }

  function initSearch(){
    const input = qs('#teamSearchInput');
    const suggest = qs('#searchSuggest');
    if(!input) return;

    const shortcuts = [
      { label:'前往 賽事', icon:'ri-calendar-event-line', href:'matches.html' },
      { label:'前往 模型預測', icon:'ri-line-chart-line', href:'models.html' },
      { label:'前往 個人化', icon:'ri-user-heart-line', href:'personalize.html' }
    ];
    const players = ['Ohtani Shohei','Mike Trout','王威晨','林立'];

    function renderSuggest(q=''){
      if(!suggest) return;
      const items = [];
      if(q){
        const hit = players.filter(p => p.toLowerCase().includes(q.toLowerCase())).slice(0,4);
        hit.forEach(p => items.push(`<a href="#" data-type="player"><i class="ri-user-line"></i>${p}</a>`));
        items.push(`<a href="#" data-type="query"><i class="ri-search-2-line"></i>搜尋「${q}」</a>`);
      }
      shortcuts.forEach(s => items.push(`<a href="${s.href}"><i class="${s.icon}"></i>${s.label}</a>`));
      suggest.innerHTML = items.join('');
      suggest.hidden = items.length === 0;
    }

    input.addEventListener('input', e => {
      const q = e.target.value.trim();
      renderSuggest(q);
    });
    input.addEventListener('focus', () => renderSuggest(input.value.trim()));
    document.addEventListener('click', (e)=>{
      if(!suggest.contains(e.target) && e.target !== input){ suggest.hidden = true; }
    });

    suggest?.addEventListener('click', (e)=>{
      const a = e.target.closest('a'); if(!a) return; e.preventDefault();
      if(a.hasAttribute('href') && a.getAttribute('href') !== '#'){
        a.classList.add('ripple'); setTimeout(()=>a.classList.remove('ripple'), 300);
        window.location.href = a.getAttribute('href');
        return;
      }
      const type = a.dataset.type;
      const text = a.textContent.trim();
      if(type === 'player'){ showHomeToast(`前往球員頁：${text}`); }
      if(type === 'query'){ showHomeToast(`搜尋：${input.value.trim()}`); }
      suggest.hidden = true;
    });

    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){
        const q = input.value.trim();
        if(!q) return;
        showHomeToast(`搜尋：${q}`);
      }
    })
  }

  function showHomeToast(msg){
    const el = document.getElementById('homeToast') || document.getElementById('themeToast');
    if(!el) return alert(msg);
    el.textContent = msg; el.hidden = false;
    requestAnimationFrame(()=> el.classList.add('show'));
    clearTimeout(showHomeToast._t);
    showHomeToast._t = setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.hidden=true, 220); }, 1400);
  }

  // Theme management
  const THEME_KEY = 'proball-theme';
  function getCurrentTheme(){
    return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  }
  function applyTheme(theme){
    document.body.classList.add('theme-animating');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    // toggle icon and a11y state
    const btn = qs('#themeToggleBtn');
    if(btn){
      const icon = btn.querySelector('i');
      if(icon){ icon.className = theme === 'dark' ? 'ri-moon-line' : 'ri-sun-line'; }
      btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark' ? '切換為日間模式' : '切換為夜間模式');
      btn.title = theme === 'dark' ? '切換為日間模式' : '切換為夜間模式';
    }
    // visual toast
    const toast = qs('#themeToast');
    if(toast){
      toast.textContent = theme === 'dark' ? '夜間模式' : '日間模式';
      toast.removeAttribute('hidden');
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); toast.setAttribute('hidden',''); }, 900);
    }
    // rebuild charts to update colors (延後至下一個事件循環，避免 TDZ 問題)
    setTimeout(() => rebuildCharts(), 0);
    // enforce chat input color after theme change
    setTimeout(() => {
      const chatInput = qs('#chatText');
      if(chatInput){
        // Use the existing enforceChatInputStyle function logic
        const isDark = document.body.classList.contains('theme-dark');
        if(isDark){
          chatInput.style.background = '#0f1730';
          chatInput.style.color = '#ffffff';
          chatInput.style.caretColor = '#ffffff';
          chatInput.style.border = '1px solid rgba(255,255,255,.18)';
          chatInput.style.webkitTextFillColor = '#ffffff';
        } else {
          chatInput.style.background = '#ffffff';
          chatInput.style.color = '#000000';
          chatInput.style.caretColor = '#000000';
          chatInput.style.border = '1px solid #dddddd';
          chatInput.style.webkitTextFillColor = '#000000';
          chatInput.style.textFillColor = '#000000';
          // Force remove any conflicting styles
          chatInput.style.removeProperty('-webkit-text-fill-color');
          chatInput.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          chatInput.style.setProperty('color', '#000000', 'important');
        }
      }
    }, 0);
    // remove animation flag
    setTimeout(() => document.body.classList.remove('theme-animating'), 260);
  }
  function initTheme(){
    // 初始化為 HTML 當前主題，綁定切換事件
    applyTheme(getCurrentTheme());
    const btn = qs('#themeToggleBtn') || qs('[data-theme-toggle]');
    if(btn){
      btn.addEventListener('click', () => {
        const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      }, { once: false });
    }
  }

  // Store chart instances for rebuild
  const charts = {
    winProb: null,
    radar: null,
    leftBar: null,
    rightBar: null,
    gauge: null,
  };

  function rebuildCharts(){
    // 如果 Chart 尚未載入，直接略過，避免阻斷主題切換
    if (typeof Chart === 'undefined') return;
    // destroy and recreate
    try { charts.winProb?.destroy(); } catch{}
    try { charts.radar?.destroy(); } catch{}
    try { charts.leftBar?.destroy(); } catch{}
    try { charts.rightBar?.destroy(); } catch{}
    try { charts.gauge?.destroy(); } catch{}

    charts.winProb = buildWinProbabilityChart();
    charts.radar = buildRadarChart();
    const bars = buildTeamBars();
    charts.leftBar = bars?.left || null;
    charts.rightBar = bars?.right || null;
    charts.gauge = buildModelGauge();
  }

    // Call after DOM is ready (已在前方初始化，避免重複呼叫)
  // Wrap previous builders to return instances
  function buildWinProbabilityChart(){
    const ctx = qs('#winProbChart');
    if(!ctx) return null;
    const home = 62, away = 38;
    const colorHome = getCssVar('--chart-home');
    const colorAway = getCssVar('--chart-away');
    return new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Dragons', 'Tigers'], datasets: [{ data: [home, away], backgroundColor: [colorHome, colorAway], borderWidth: 0, hoverOffset: 6, cutout: '72%' }] },
      options: { responsive: true, maintainAspectRatio:false, aspectRatio:1, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.formattedValue}%` } } }, animation: { duration: 900 } }
    });
  }
  function buildRadarChart(){
    const ctx = qs('#pitchRadarChart');
    if(!ctx) return null;
    const colorHome = getCssVar('--chart-home');
    const colorAway = getCssVar('--chart-away');
    const grid = getCssVar('--chart-grid');
    const tick = getCssVar('--chart-tick');
    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['速球威力', '控球', '變化', '伸卡', '壓迫', '耐力'],
        datasets: [
          { label: 'Dragons SP', data: [85, 78, 74, 68, 82, 80], fill: true, backgroundColor: hexToRgba(colorHome,.18), borderColor: colorHome, pointBackgroundColor: colorHome, pointRadius: 2 },
          { label: 'Tigers SP', data: [78, 82, 80, 74, 75, 77], fill: true, backgroundColor: hexToRgba(colorAway,.16), borderColor: colorAway, pointBackgroundColor: colorAway, pointRadius: 2 }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { r: { angleLines: { color: grid }, grid: { color: grid }, pointLabels: { color: tick }, suggestedMin: 50, suggestedMax: 100, ticks: { display:false } } } }
    });
  }
  function buildTeamBars(){
    const left = qs('#teamLeftBar');
    const right = qs('#teamRightBar');
    if(!left || !right) return null;
    const labels = ['打擊率', '全壘打', '上壘率', '守備率'];
    const leftData = [0.268, 112, 0.335, 0.986];
    const rightData = [0.254, 98, 0.319, 0.981];
    const grid = getCssVar('--chart-grid');
    const tick = getCssVar('--chart-tick');
    const makeBar = (canvas, data, color) => new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: (ctx) => { const { chart } = ctx; const { ctx: c } = chart; const g = c.createLinearGradient(0,0,chart.width,0); g.addColorStop(0, color); g.addColorStop(1, getCssVar('--chart-muted')); return g; }, borderRadius: 10, borderSkipped: false }] },
      options: { responsive: true, plugins: { legend: { display:false }, tooltip: { enabled:true } }, scales: { x: { grid: { display:false }, ticks: { color: tick } }, y: { grid: { color: grid }, ticks: { color: tick } } }, animation: { duration:800 } }
    });
    return { left: makeBar(left, leftData, getCssVar('--chart-home')), right: makeBar(right, rightData, getCssVar('--chart-away')) };
  }
  function buildModelGauge(){
    const ctx = qs('#modelGauge');
    if(!ctx) return null;
    const prob = 0.64; const value = Math.round(prob * 100);
    const colorHome = getCssVar('--chart-home');
    const colorMuted = getCssVar('--chart-muted');
    return new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['勝率','其餘'], datasets: [{ data: [value, 100-value], backgroundColor: [colorHome, colorMuted], borderWidth: 0, cutout: '70%' }] },
      options: { plugins: { legend: { display:false } }, rotation: -90, circumference: 180, animation: { duration:900 } },
      plugins: [{ id:'centerText', afterDraw(chart){ const { ctx, chartArea } = chart; const x=(chartArea.left+chartArea.right)/2; const y=(chartArea.top+chartArea.bottom)/2+8; ctx.save(); ctx.fillStyle=getCssVar('--text'); ctx.font='700 28px Inter, Noto Sans TC, Roboto'; ctx.textAlign='center'; ctx.fillText(`${value}%`, x, y); ctx.restore(); } }]
    });
  }

  // Interactive UX
  initScrollProgress();
  initScrollTopFab();
  initRipple();
  initHoverTilt();
  initSmoothAnchors();
  initScrollSpy();
  initParallax();
  initHotkeys();
  initChatbot();

  function initScrollProgress(){
    const bar = qs('.scroll-progress span');
    if(!bar) return;
    const update = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      bar.style.width = `${Math.max(0, Math.min(1, scrolled)) * 100}%`;
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initScrollTopFab(){
    const btn = qs('#scrollTopBtn');
    if(!btn) return;
    const onScroll = () => {
      const show = window.scrollY > 400;
      if(show) btn.removeAttribute('hidden'); else btn.setAttribute('hidden','');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  }

  function initRipple(){
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .icon-btn, .fab');
      if(!target) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size/2}px`;
      ripple.style.top = `${e.clientY - rect.top - size/2}px`;
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  function initHoverTilt(){
    const tiltTargets = qsa('.team-card, .player-card, .match-center, .compare-side, .report, .gauge, .game-card');
    const handle = (el, e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -6; // rotateX
      const ry = ((x / rect.width) - 0.5) * 6;  // rotateY
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
      el.classList.add('hover-tilt');
    };
    const reset = (el) => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.classList.remove('hover-tilt'); };
    tiltTargets.forEach(el => {
      el.addEventListener('mousemove', (e) => handle(el, e));
      el.addEventListener('mouseleave', () => reset(el));
    });
  }

  function initSmoothAnchors(){
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if(!id || id === '#') return;
        const target = qs(id);
        if(target){ e.preventDefault(); window.scrollTo({ top: target.offsetTop - 70, behavior:'smooth' }); }
      })
    })
  }

  function initScrollSpy(){
    const links = qsa('.navbar__nav .nav__link');
    const map = links.map(l => ({ link: l, id: l.getAttribute('href') })).filter(x => x.id && x.id.startsWith('#'));
    const handler = () => {
      const y = window.scrollY + 80;
      let active = null;
      for(const m of map){
        const sec = qs(m.id);
        if(sec && sec.offsetTop <= y) active = m;
      }
      links.forEach(l => l.classList.remove('is-active'));
      if(active) active.link.classList.add('is-active');
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
  }

  function initParallax(){
    const bg = qs('.bg-canvas');
    if(!bg) return;
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      bg.style.transform = `translate(${x}px, ${y}px)`;
    })
  }

  function initHotkeys(){
    document.addEventListener('keydown', (e) => {
      if(e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)){
        e.preventDefault(); qs('#teamSearchInput')?.focus();
      }
    })
  }

  // --- Chatbot ---
  function initChatbot(){
    const fab = qs('#chatFab');
    const panel = qs('#chatbot');
    const body = qs('#chatBody');
    const input = qs('#chatText');
    const send = qs('#chatSend');
    const close = qs('#chatClose');
    if(!fab || !panel || !body || !input || !send) return;

    const KEY = 'proball-chat-history';
    const history = JSON.parse(localStorage.getItem(KEY) || '[]');
    history.forEach(m => appendMessage(m.role, m.text, {instant:true}));

    function open(){ panel.removeAttribute('hidden'); enforceChatInputStyle(); input.focus(); fab.setAttribute('hidden',''); }
    function hide(){ panel.setAttribute('hidden',''); fab.removeAttribute('hidden'); }

    fab.addEventListener('click', open);
    close?.addEventListener('click', () => {
      // Clear all chat history and reset to initial state
      localStorage.removeItem(KEY);
      body.innerHTML = '';
      // Remove chat panel but keep FAB for restarting conversation
      panel.remove();
      // Ensure FAB is visible for restarting chat
      fab.removeAttribute('hidden');
      // Update FAB click handler to recreate chat functionality
      fab.onclick = () => recreateChatPanel();
    });

    send.addEventListener('click', onSend);
    input.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ onSend(); } });
    // enforce style at key moments
    input.addEventListener('focus', enforceChatInputStyle);
    input.addEventListener('input', enforceChatInputStyle);
    enforceChatInputStyle();

    function onSend(){
      const text = input.value.trim();
      if(!text) return;
      input.value = '';
      appendMessage('user', text, {instant:true});
      save('user', text);
      const reply = generateReply(text);
      showTypingThenAnimate(reply);
    }

    function appendMessage(role, text, opts={}){
      const wrap = document.createElement('div');
      wrap.className = `message ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      if(opts.instant){ bubble.textContent = text; }
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = role === 'ai' ? 'AI' : '你';
      wrap.appendChild(avatar);
      wrap.appendChild(bubble);
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
      return bubble;
    }

    function showTypingThenAnimate(text){
      const bubble = appendMessage('ai', '', {instant:false});
      // typing indicator
      const typing = document.createElement('span');
      typing.className = 'typing';
      typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      bubble.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        typing.remove();
        animateDottedText(text, bubble);
      }, 450);
    }

    function animateDottedText(text, bubble){
      // construct dotted text composition with character spans + dot animation
      const chars = Array.from(text);
      let delayAcc = 0;
      chars.forEach(ch => {
        const span = document.createElement('span');
        span.className = 'dot-char dot-text';
        span.style.animationDelay = `${delayAcc}ms`;
        span.textContent = ch;
        bubble.appendChild(span);
        delayAcc += 20 + Math.random()*28;
      });
      body.scrollTop = body.scrollHeight;
      setTimeout(() => save('ai', text), delayAcc + 60);
    }

    function sanitize(s){
      return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function save(role, text){
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      data.push({ role, text });
      localStorage.setItem(KEY, JSON.stringify(data.slice(-100)));
    }

    function generateReply(q){
      const lower = q.toLowerCase();
      if(/賽事|比賽|今日|today/.test(lower)) return '今天重點：Dragons vs Tigers 19:05 台北大巨蛋；另外 2 場例行賽 18:35 開打。';
      if(/勝率|預測|ai/.test(lower)) return '模型勝率目前預估主隊 64%，信心水準：高。可至「AI 模型預測」區塊查看詳細報告。';
      if(/球員|stats|數據/.test(lower)) return '可至「球員」頁查看生涯/賽季/單場數據，並使用右上角搜尋快速找到球員。';
      return '我已收到你的問題！你可以問我：今日賽程、勝率預測、球員數據、或網站導覽。';
    }

    function enforceChatInputStyle(){
      if(!input) return;
      const isDark = document.body.classList.contains('theme-dark');
      if(isDark){
        input.style.background = '#0f1730';
        input.style.color = '#ffffff';
        input.style.caretColor = '#ffffff';
        input.style.border = '1px solid rgba(255,255,255,.18)';
        input.style.webkitTextFillColor = '#ffffff';
      } else {
        input.style.background = '#ffffff';
        input.style.color = '#000000';
        input.style.caretColor = '#000000';
        input.style.border = '1px solid #dddddd';
        input.style.webkitTextFillColor = '#000000';
        input.style.textFillColor = '#000000';
        // Force remove any conflicting styles
        input.style.removeProperty('-webkit-text-fill-color');
        input.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
        input.style.setProperty('color', '#000000', 'important');
      }
    }

    function recreateChatPanel(){
      // Create new chat panel HTML
      const newChatPanel = document.createElement('section');
      newChatPanel.id = 'chatbot';
      newChatPanel.className = 'chatbot';
      newChatPanel.setAttribute('aria-label', 'AI 聊天助理');
      newChatPanel.innerHTML = `
        <header class="chat-header">
          <div class="chat-title"><i class="ri-robot-2-line"></i> ProBall AI 助理</div>
          <div class="chat-actions">
            <button id="chatClose" class="icon-btn" aria-label="清除對話" data-tooltip="清除對話"><i class="ri-close-line"></i></button>
          </div>
        </header>
        <div id="chatBody" class="chat-body" role="log" aria-live="polite"></div>
        <div class="chat-input">
          <input id="chatText" type="text" placeholder="輸入訊息，例如：今天有哪些賽事？" aria-label="輸入訊息" />
          <button id="chatSend" class="btn btn-accent" aria-label="送出"><i class="ri-send-plane-2-line"></i></button>
        </div>
      `;
      
      // Insert new panel into DOM
      document.body.appendChild(newChatPanel);
      
      // Hide FAB and show new panel
      fab.setAttribute('hidden', '');
      
      // Reinitialize chatbot with new elements
      initChatbot();
    }
  }

  // 關注球隊（首頁 Hero）
  ;(function initFollow(){
    const map = [ ['followDragons','Dragons'], ['followTigers','Tigers'] ];
    map.forEach(([id, team]) => {
      const btn = document.getElementById(id); if(!btn) return;
      const key = `fav_${team}`;
      const saved = localStorage.getItem(key) === '1';
      update(btn, saved);
      btn.addEventListener('click', () => {
        const next = !(localStorage.getItem(key) === '1');
        localStorage.setItem(key, next ? '1' : '0');
        update(btn, next);
        showHomeToast(`${next ? '已關注' : '已取消'}：${team}`);
      });
    });
    function update(btn, on){
      btn.classList.toggle('btn-accent', on);
      const i = btn.querySelector('i'); if(i) i.className = on ? 'ri-star-fill' : 'ri-star-line';
    }
  })();


});
