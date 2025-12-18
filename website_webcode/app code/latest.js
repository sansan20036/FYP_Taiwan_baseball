document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  initUserMenu();
  initFooterYear();
  initLatest();

  function initUserMenu() {
    const menuBtn = qs('#userMenuBtn');
    const dropdown = qs('#userDropdown');
    if (!menuBtn || !dropdown) return;
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.hasAttribute('hidden');
      if (isHidden) { dropdown.removeAttribute('hidden'); menuBtn.setAttribute('aria-expanded', 'true'); }
      else { dropdown.setAttribute('hidden', ''); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initFooterYear(){
    const yearEl = qs('#currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function toast(msg){
    const el = document.getElementById('toast');
    if(!el) return alert(msg);
    el.textContent = msg; el.hidden=false;
    requestAnimationFrame(()=> el.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.hidden=true, 240); }, 1600);
  }

  function initLatest(){
    const feedGrid = qs('#feedGrid');
    const search = qs('#latestSearch');
    const typeFilter = qs('#typeFilter');
    const sortBy = qs('#sortBy');
    const quickFilters = qs('#quickFilters');
    const refreshBtn = qs('#refreshBtn');
    const autoRefreshBtn = qs('#autoRefreshBtn');
    const subscribeAllBtn = qs('#subscribeAll');

    let autoTimer = null;

    let items = generateInitialFeed();
    renderFeed(items, feedGrid);

    // 搜尋
    let searchTimer;
    search?.addEventListener('input', (e)=>{
      clearTimeout(searchTimer);
      searchTimer = setTimeout(()=> applyAndRender(), 200);
    });

    // 篩選/排序
    typeFilter?.addEventListener('change', applyAndRender);
    sortBy?.addEventListener('change', applyAndRender);

    // 熱門快速條件（提高 impact）
    quickFilters?.addEventListener('click', ()=>{
      sortBy.value = 'impact';
      typeFilter.value = 'all';
      applyAndRender();
      toast('已套用「熱門」排序');
    });

    // 重新整理（模擬拉新資料）
    refreshBtn?.addEventListener('click', ()=>{
      refreshBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> 載入中...';
      setTimeout(()=>{
        items = mergeWithNewItems(items, generateDeltaFeed());
        applyAndRender();
        refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> 重新整理';
        toast('最新動態已更新');
      }, 900);
    });

    // 自動更新
    autoRefreshBtn?.addEventListener('click', ()=>{
      const on = autoTimer != null;
      if (on) {
        clearInterval(autoTimer); autoTimer = null; autoRefreshBtn.innerHTML = '<i class="ri-time-line"></i> 自動更新：關'; toast('已關閉自動更新');
      } else {
        autoTimer = setInterval(()=>{ items = mergeWithNewItems(items, generateDeltaFeed()); applyAndRender(true); }, 5000);
        autoRefreshBtn.innerHTML = '<i class="ri-time-line"></i> 自動更新：開'; toast('已開啟自動更新');
      }
    });

    // 訂閱所有 LIVE
    subscribeAllBtn?.addEventListener('click', ()=>{
      const live = items.filter(i=> i.type==='live');
      if (live.length===0) return toast('目前沒有 LIVE 可訂閱');
      toast(`已訂閱 ${live.length} 場 LIVE 比賽提醒`);
    });

    function applyAndRender(isSilent=false){
      const kw = (search?.value || '').toLowerCase();
      const type = typeFilter?.value || 'all';
      const sort = sortBy?.value || 'time';

      let filtered = items.filter(i=>
        (type==='all' || i.type===type) &&
        (`${i.title} ${i.desc} ${i.teamA||''} ${i.teamB||''}`.toLowerCase().includes(kw))
      );

      if (sort==='status'){
        const order = { live:0, upcoming:1, final:2, news:3, analysis:4 };
        filtered.sort((a,b)=> (order[a.type]??9) - (order[b.type]??9));
      } else if (sort==='impact'){
        filtered.sort((a,b)=> (b.impact||0) - (a.impact||0));
      } else {
        filtered.sort((a,b)=> (b.time||0) - (a.time||0));
      }

      renderFeed(filtered, feedGrid);
      if(!isSilent) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderFeed(list, container){
      if (!container) return;
      if (list.length===0){
        container.innerHTML = `<div class="card col-12" style="text-align:center; color:var(--text-secondary)"><i class="ri-calendar-event-line" style="font-size:40px; opacity:.6"></i><div style="margin-top:8px">目前沒有符合條件的項目</div></div>`;
        return;
      }

      container.innerHTML = list.map(item => createCardHTML(item)).join('');

      // 倒數計時 for upcoming
      setupCountdowns();

      // 互動綁定
      qsa('.icon-btn[data-action]')
        .forEach(btn => btn.addEventListener('click', (e)=>{
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          const found = list.find(i=> String(i.id)===String(id));
          if (!found) return;
          if (action==='share') shareItem(found);
          if (action==='fav') toggleFav(btn, found);
          if (action==='bell') toggleNotify(btn, found);
        }));

      qsa('.feed-card').forEach(card => {
        card.addEventListener('click', ()=>{
          const id = card.getAttribute('data-id');
          const found = list.find(i=> String(i.id)===String(id));
          if (!found) return;
          openItem(found);
        });
      });
    }

    function createCardHTML(item){
      const badgeClass = `badge ${item.type}`;
      const span = item.span || 'col-6';
      const metaIcon = item.type==='live' ? 'ri-live-line' : item.type==='upcoming' ? 'ri-time-line' : item.type==='final' ? 'ri-check-line' : item.type==='news' ? 'ri-article-line' : 'ri-bar-chart-line';
      const metaTime = new Date(item.time || Date.now()).toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      const statusText = { live:'LIVE', upcoming:'即將開始', final:'已結束', news:'新聞', analysis:'分析' }[item.type];

      return `
        <article class="card feed-card ${item.type} ${span}" data-id="${item.id}">
          <div class="meta">
            <span class="badge ${item.type}"><i class="${metaIcon}"></i>${statusText}</span>
            <span><i class="ri-calendar-line"></i>${metaTime}</span>
            ${item.impact? `<span><i class=\"ri-fire-line\"></i> 熱度 ${item.impact}</span>` : ''}
          </div>
          <h3 class="title">${item.title}</h3>
          <p class="desc">${item.desc || ''}</p>
          ${item.type==='live' || item.type==='upcoming' || item.type==='final' ? `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:10px">
              <div style="display:flex; align-items:center; gap:10px">
                <img src="${item.logoA}" alt="${item.teamA}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;box-shadow:0 1px 3px rgba(0,0,0,.12)" />
                <strong>${item.teamA}</strong>
                <span style="color:var(--text-muted)">vs</span>
                <strong>${item.teamB}</strong>
                <img src="${item.logoB}" alt="${item.teamB}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;box-shadow:0 1px 3px rgba(0,0,0,.12)" />
              </div>
              ${item.type!=='upcoming' ? `<div style=\"font-weight:800;color:var(--primary)\">${item.scoreA ?? '-'} : ${item.scoreB ?? '-'}</div>` : `<div class=\"countdown\" data-eta=\"${item.time}\" style=\"font-size:12px;color:var(--text-secondary)\"></div>`}
            </div>
          `: ''}
          <div class="actions">
            <button class="icon-btn" data-action="share" data-id="${item.id}" data-tooltip="分享"><i class="ri-share-line"></i></button>
            <button class="icon-btn" data-action="fav" data-id="${item.id}" data-tooltip="收藏"><i class="ri-heart-line"></i></button>
            <button class="icon-btn" data-action="bell" data-id="${item.id}" data-tooltip="提醒"><i class="ri-notification-line"></i></button>
          </div>
        </article>`;
    }

    function openItem(item){
      if (item.type==='news') toast(`查看新聞：${item.title}`);
      else if (item.type==='analysis') toast(`查看分析：${item.title}`);
      else toast(`${item.teamA} vs ${item.teamB}`);
    }

    function shareItem(item){
      const shareData = { title: item.title, text: item.desc || item.title, url: location.href };
      if (navigator.share) navigator.share(shareData); else { navigator.clipboard?.writeText(shareData.url); toast('連結已複製'); }
    }

    function toggleFav(btn, item){
      const icon = btn.querySelector('i');
      const liked = icon.classList.contains('ri-heart-fill');
      if (liked) { icon.className='ri-heart-line'; toast('已取消收藏'); }
      else { icon.className='ri-heart-fill'; btn.style.color='#ef4444'; toast('已加入收藏'); setTimeout(()=> btn.style.color='', 600); }
    }

    function toggleNotify(btn, item){
      const icon = btn.querySelector('i');
      const on = icon.classList.contains('ri-notification-fill');
      if (on) { icon.className='ri-notification-line'; toast('已取消提醒'); }
      else { icon.className='ri-notification-fill'; btn.style.color='#f59e0b'; toast('已訂閱提醒'); setTimeout(()=> btn.style.color='', 600); }
    }

    function generateInitialFeed(){
      const now = Date.now();
      const logo = 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg';
      return [
        { id: 1, type: 'live', span:'col-8', title:'Dragons vs Tigers', desc:'第7局下半，攻勢延續', teamA:'Dragons', teamB:'Tigers', scoreA:3, scoreB:2, logoA:logo, logoB:logo, time: now-2*60*1000, impact: 98 },
        { id: 2, type: 'upcoming', span:'col-4', title:'Eagles vs Lions', desc:'今晚 20:00 開打', teamA:'Eagles', teamB:'Lions', logoA:logo, logoB:logo, note:'開賽倒數 45 分', time: now+40*60*1000, impact: 72 },
        { id: 3, type: 'final', span:'col-6', title:'Bears 5 : 3 Monkeys', desc:'九局結束', teamA:'Bears', teamB:'Monkeys', scoreA:5, scoreB:3, logoA:logo, logoB:logo, time: now-3*60*60*1000, impact: 64 },
        { id: 4, type: 'news', span:'col-6', title:'中華隊名單公布', desc:'多名新秀入選，本季戰力分析', time: now-30*60*1000, impact: 77 },
        { id: 5, type: 'analysis', span:'col-6', title:'打擊熱區與配球趨勢', desc:'OPS 與長打率上升原因', time: now-50*60*1000, impact: 81 },
        { id: 6, type: 'news', span:'col-6', title:'球團公告：票務調整', desc:'熱門場次增開座位區', time: now-10*60*1000, impact: 55 }
      ];
    }

    function generateDeltaFeed(){
      const now = Date.now();
      const logo = 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg';
      const dice = Math.random();
      if (dice < .33){
        return [ { id: Date.now(), type:'news', span:'col-6', title:'快訊：投手更換', desc:'主隊更換先發投手', time: now, impact: 60 } ];
      } else if (dice < .66){
        return [ { id: Date.now(), type:'live', span:'col-6', title:'現場更新：攻佔得點圈', desc:'客隊形成一三壘有人', teamA:'Tigers', teamB:'Dragons', scoreA:2, scoreB:3, logoA:logo, logoB:logo, time: now, impact: 90 } ];
      } else {
        return [ { id: Date.now(), type:'analysis', span:'col-6', title:'賽中分析：球速變化', desc:'四縫線均速上升 1.2mph', time: now, impact: 70 } ];
      }
    }

    function mergeWithNewItems(oldList, newItems){
      const merged = [...newItems, ...oldList].slice(0, 24);
      // 模擬 score 變動
      merged.forEach(i=>{
        if (i.type==='live' && Math.random()>.6){
          i.scoreA = (i.scoreA ?? 0) + (Math.random()>.5 ? 1:0);
          i.scoreB = (i.scoreB ?? 0) + (Math.random()>.5 ? 1:0);
          i.title = `${i.teamA||'A'} ${i.scoreA} : ${i.scoreB} ${i.teamB||'B'}`;
        }
      });
      return merged;
    }
  }

  function initPredictions(){
    const grid = document.getElementById('predictionsGrid');
    const shapList = document.getElementById('shapList');
    const slider = document.getElementById('confidenceSlider');
    const sliderVal = document.getElementById('confidenceValue');
    const recalcBtn = document.getElementById('recalcBtn');
    if(!grid || !slider || !sliderVal || !recalcBtn) return;

    // Skeleton
    showPredSkeleton(grid);

    // 模擬抓取預測資料
    setTimeout(()=>{
      const data = generatePredData(Number(slider.value));
      renderPredGrid(data, grid);
      renderSHAP(data, shapList);
    }, 600);

    slider.addEventListener('input', ()=>{
      sliderVal.textContent = `${slider.value}%`;
    });

    recalcBtn.addEventListener('click', ()=>{
      recalcBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> 計算中...';
      showPredSkeleton(grid);
      setTimeout(()=>{
        const data = generatePredData(Number(slider.value));
        renderPredGrid(data, grid);
        renderSHAP(data, shapList);
        recalcBtn.innerHTML = '<i class="ri-refresh-line"></i> 重新計算';
        toast('已更新模型預測');
      }, 700);
    });
  }

  function showPredSkeleton(container){
    const item = (span)=> `<div class="pred-sk ${span}"><div class="sk-title shimmer"></div><div class="sk-line shimmer"></div><div class="sk-line shimmer"></div></div>`;
    container.innerHTML = [item('pcol-6'), item('pcol-6'), item('pcol-4'), item('pcol-4'), item('pcol-4')].join('');
  }

  function generatePredData(conf){
    const clamp = (v)=> Math.max(0, Math.min(100, Math.round(v)));
    const base = [
      { id: 'p1', title: 'Dragons 勝率', meta: '今晚 19:05 | 台北大巨蛋', prob: clamp(58 + (conf-50)/5), teams:['Dragons','Tigers'] },
      { id: 'p2', title: 'Eagles 勝率', meta: '20:00 | 洲際棒球場', prob: clamp(52 + (conf-50)/8), teams:['Eagles','Lions'] },
      { id: 'p3', title: '總分大於 8.5', meta: '模型總分預測', prob: clamp(47 + (conf-50)/6) },
      { id: 'p4', title: '先發投手三振 > 6.5', meta: '投手三振線', prob: clamp(41 + (conf-50)/7) },
      { id: 'p5', title: '單局得分機率 (第1局)', meta: '得點圈轉換', prob: clamp(36 + (conf-50)/9) }
    ];
    return base;
  }

  function renderPredGrid(data, container){
    const logo = 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg';
    container.innerHTML = data.map((d, idx)=> `
      <article class="pred-card ${idx<2?'pcol-6':'pcol-4'}">
        <div class="meta">
          <span><i class="ri-robot-line"></i> 模型 v1.2</span>
          <span><i class="ri-time-line"></i> ${new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        <h3 class="title">${d.title}</h3>
        <div style="font-size:12px; color: var(--text-secondary); margin-bottom:8px">${d.meta}</div>
        <div class="prob" aria-label="機率"><span style="width:${d.prob}%"></span></div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px">
          <strong style="color: var(--primary)">${d.prob}%</strong>
          ${d.teams? `<div style=\"display:flex; align-items:center; gap:8px\"><img src=\"${logo}\" alt=\"${d.teams[0]}\" style=\"width:24px;height:24px;border-radius:6px\" /><span>${d.teams[0]}</span><span style=\"color:var(--text-muted)\">vs</span><span>${d.teams[1]}</span><img src=\"${logo}\" alt=\"${d.teams[1]}\" style=\"width:24px;height:24px;border-radius:6px\" /></div>` : ''}
        </div>
        <div class="pred-chart"><canvas id="chart_${d.id}"></canvas></div>
        <div class="pred-actions">
          <button class="icon-btn" data-tooltip="收藏"><i class="ri-heart-line"></i></button>
          <button class="icon-btn" data-tooltip="分享"><i class="ri-share-line"></i></button>
        </div>
      </article>
    `).join('');

    // 圖表
    data.forEach(d=>{
      const el = document.getElementById(`chart_${d.id}`);
      if (!el || typeof Chart==='undefined') return;
      const ctx = el.getContext('2d');
      const isWinProb = /勝率/.test(d.title);
      if (isWinProb){
        new Chart(ctx, {
          type: 'doughnut',
          data: { labels: ['機率','其餘'], datasets: [{ data: [d.prob, 100-d.prob], backgroundColor: ['#2563eb','#e5e7eb'], borderWidth: 0 }] },
          options: { cutout: '70%', plugins:{ legend:{ display:false }}, animation:{ duration: 500 } }
        });
      } else {
        new Chart(ctx, {
          type: 'bar',
          data: { labels: ['模型'], datasets: [{ label: '機率', data: [d.prob], backgroundColor: '#f59e0b' }] },
          options: { plugins:{ legend:{ display:false }}, scales:{ y:{ beginAtZero:true, max:100 } }, animation:{ duration: 500 } }
        });
      }
    });
  }

  function renderSHAP(data, listEl){
    if(!listEl) return;
    const feats = [
      { name: '先發投手近期 K/9', val: '+0.18' },
      { name: '打者 OPS 三場均值', val: '+0.12' },
      { name: '主客場差異 (主)', val: '+0.08' },
      { name: '牛棚疲勞程度', val: '-0.05' },
      { name: '天氣風速 > 6m/s', val: '+0.03' },
      { name: '對戰歷史 (近10場)', val: '-0.02' }
    ];
    listEl.innerHTML = feats.map(f=> `<li class="shap-item"><span>${f.name}</span><span class="${f.val.startsWith('-')?'neg':'pos'}">${f.val}</span></li>`).join('');
  }

  // 載入動畫 CSS（spinner）
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;
  document.head.appendChild(style);

  // --- UI/UX Enhancements JS ---
  function showSkeleton(container){
    if(!container) return;
    const make = (span)=> `<div class="card skeleton-card ${span}"><div class="sk-meta shimmer"></div><div class="sk-title shimmer"></div><div class="sk-line shimmer"></div><div class="sk-line shimmer"></div></div>`;
    container.innerHTML = [make('col-8'), make('col-4'), make('col-6'), make('col-6'), make('col-6'), make('col-6')].join('');
  }

  function setupThemeToggle(){
    const btn = document.getElementById('themeToggle');
    if(!btn) return;
    const saved = localStorage.getItem('latestTheme') || 'light';
    const apply = (mode)=> document.body.classList.toggle('theme-dark', mode==='dark');
    apply(saved);
    btn.setAttribute('aria-pressed', saved==='dark' ? 'true' : 'false');
    btn.querySelector('i').className = saved==='dark' ? 'ri-sun-line' : 'ri-moon-line';
    btn.addEventListener('click', ()=>{
      const isDark = document.body.classList.toggle('theme-dark');
      localStorage.setItem('latestTheme', isDark ? 'dark' : 'light');
      btn.setAttribute('aria-pressed', isDark ? 'true':'false');
      btn.querySelector('i').className = isDark ? 'ri-sun-line' : 'ri-moon-line';
    });
  }

  function setupStickyControls(){
    const controls = document.querySelector('.latest-controls');
    if(!controls) return;
    const onScroll = ()=>{
      const top = controls.getBoundingClientRect().top;
      controls.classList.toggle('is-stuck', top <= 80);
      // 視差：根據滾動輕微移動 orbs
      const sc = Math.min(1, window.scrollY / 600);
      document.querySelectorAll('.orb').forEach((o, i)=>{
        const dir = i%2===0 ? 1 : -1;
        o.style.transform = `translate3d(${dir*sc*12}px, ${-sc*24}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function attachRippleHandlers(){
    document.querySelectorAll('.icon-btn, .btn, .chip').forEach(el=>{
      if(el._rippleBound) return; el._rippleBound=true;
      el.addEventListener('click', ()=>{ el.classList.add('ripple'); setTimeout(()=> el.classList.remove('ripple'), 350); });
    });
  }

  function setupTypeChips(){
    const chips = document.getElementById('typeChips');
    const typeFilter = document.getElementById('typeFilter');
    if(!chips || !typeFilter) return;
    chips.addEventListener('click', (e)=>{
      const btn = e.target.closest('.chip');
      if(!btn) return;
      Array.from(chips.querySelectorAll('.chip')).forEach(c=>{ c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
      btn.classList.add('is-active'); btn.setAttribute('aria-selected','true');
      typeFilter.value = btn.getAttribute('data-type') || 'all';
      typeFilter.dispatchEvent(new Event('change'));
    });
  }

  function setupKeyboardAccess(){
    const feed = document.getElementById('feedGrid');
    if(!feed) return;
    const obs = new MutationObserver(()=>{
      document.querySelectorAll('.feed-card').forEach(c=>{
        c.setAttribute('tabindex','0');
        c.setAttribute('role','button');
        const title = c.querySelector('.title')?.textContent || '項目';
        c.setAttribute('aria-label', title);
      });
      attachRippleHandlers();
    });
    obs.observe(feed, { childList: true, subtree: true });

    feed.addEventListener('keydown', (e)=>{
      const card = e.target.closest('.feed-card');
      if(!card) return;
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); card.click(); }
    });
  }

  function setupCountdowns(){
    const els = document.querySelectorAll('.countdown');
    els.forEach(el=>{
      const eta = Number(el.getAttribute('data-eta')) || Date.now();
      update();
      const t = setInterval(update, 1000);
      el._t = t;
      function update(){
        const now = Date.now();
        let diff = Math.max(0, eta - now);
        const h = Math.floor(diff/3600000); diff%=3600000;
        const m = Math.floor(diff/60000); diff%=60000;
        const s = Math.floor(diff/1000);
        el.textContent = h>0 ? `倒數 ${h}時${m}分${s}秒` : `倒數 ${m}分${s}秒`;
      }
    });
  }

  // Initial skeleton flash then render
  const feedGrid = document.getElementById('feedGrid');
  if(feedGrid){
    showSkeleton(feedGrid);
    setTimeout(()=>{
      const typeFilter = document.getElementById('typeFilter');
      typeFilter && typeFilter.dispatchEvent(new Event('change'));
    }, 500);
  }

  setupThemeToggle();
  setupStickyControls();
  setupTypeChips();
  setupKeyboardAccess();
  attachRippleHandlers();
}); 