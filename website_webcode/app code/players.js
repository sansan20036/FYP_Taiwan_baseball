document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  initUserMenu();
  initHero();
  initStatsOverview();
  initTabs();
  initSeasonPanel();
  initGamesPanel();
  initCareerPanel();
  initCareerTimeline();
  initNewsSocial();
  initFooter();

  // 圖表模式切換（同步分頁）
  bindChartModeSwitch();
  // 數據卡互動（hover 已用 CSS；點擊開 modal）
  bindStatCardInteractions();
  // 統計模態窗
  initStatModal();

  function initUserMenu() {
    const btn = qs('#userMenuBtn');
    const menu = qs('#userDropdown');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const hidden = menu.hasAttribute('hidden');
      hidden ? menu.removeAttribute('hidden') : menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', String(hidden));
    });
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) menu.setAttribute('hidden', '');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') menu.setAttribute('hidden', '');
    });
  }

  function initHero() {
    const favBtn = qs('#favoritePlayerBtn');
    favBtn?.addEventListener('click', () => {
      const isFav = favBtn.classList.toggle('is-fav');
      favBtn.innerHTML = isFav
        ? '<i class="ri-star-fill"></i> 已收藏'
        : '<i class="ri-star-line"></i> 收藏球員';
    });

    // 將球隊配色注入 CSS 變數（示例：依隊名簡易映射）
    const teamName = (qs('#teamName')?.textContent || '').toLowerCase();
    const teamColorMap = {
      tigers: '#F77F00',
      dragons: '#c81e1e',
      lions: '#0ea5e9',
      eagles: '#16a34a'
    };
    const color = teamColorMap[teamName] || getComputedStyle(document.documentElement).getPropertyValue('--accent');
    document.documentElement.style.setProperty('--team-color', color.trim());

    qs('#viewStatsBtn')?.addEventListener('click', () => {
      document.querySelector('[data-tab="season"]').click();
      window.scrollTo({ top: qs('.performance').offsetTop - 60, behavior: 'smooth' });
    });
  }

  function initStatsOverview() {
    const grid = qs('#statsGrid');
    if (!grid) return;
    // 依位置顯示不同指標（示例同時展示）
    const stats = [
      { label: 'AVG', value: '.312', best: true },
      { label: 'HR', value: '28' },
      { label: 'RBI', value: '86' },
      { label: 'OBP', value: '.392' },
      { label: 'ERA', value: '2.84', best: true },
      { label: 'K', value: '176' },
      { label: 'W', value: '15' }
    ];
    grid.innerHTML = stats.map(s => `
      <div class="stat-card ${s.best ? 'best' : ''}">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
        <div class="stat-trend">較上季 +${Math.floor(Math.random()*10)}%</div>
      </div>
    `).join('');
  }

  function initTabs() {
    const btns = qsa('.tab-btn');
    const panels = qsa('.tab-panel');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        btns.forEach(b => b.classList.toggle('active', b === btn));
        panels.forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
      });
    });
  }

  function initSeasonPanel() {
    const tbody = qs('#seasonTableBody');
    if (!tbody) return;

    const seasons = [
      { year: '2023', AVG: .298, HR: 22, RBI: 78, OBP: .365, ERA: 3.12, K: 152, W: 12 },
      { year: '2024', AVG: .305, HR: 26, RBI: 81, OBP: .378, ERA: 2.95, K: 168, W: 14 },
      { year: '2025', AVG: .312, HR: 28, RBI: 86, OBP: .392, ERA: 2.84, K: 176, W: 15 }
    ];

    tbody.innerHTML = seasons.map(s => `
      <tr>
        <td>${s.year}</td>
        <td>${s.AVG.toFixed(3)}</td>
        <td>${s.HR}</td>
        <td>${s.RBI}</td>
        <td>${s.OBP.toFixed(3)}</td>
        <td>${s.ERA.toFixed(2)}</td>
        <td>${s.K}</td>
        <td>${s.W}</td>
      </tr>
    `).join('');

    // Chart: Trend lines
    const ctx = qs('#seasonChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: seasons.map(s => s.year),
          datasets: [
            { label: 'AVG', data: seasons.map(s => s.AVG), borderColor: '#1e3a8a', backgroundColor: 'rgba(30,58,138,.2)', tension: .3, yAxisID: 'y1' },
            { label: 'HR', data: seasons.map(s => s.HR), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.2)', tension: .3, yAxisID: 'y2' },
            { label: 'K', data: seasons.map(s => s.K), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.2)', tension: .3, yAxisID: 'y2' }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y1: { type: 'linear', position: 'left', beginAtZero: false },
            y2: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
          },
          plugins: { legend: { position: 'top' } }
        }
      });
    }
  }

  function initGamesPanel() {
    const monthSelect = qs('#monthSelect');
    const listEl = qs('#gamesList');
    const chartEl = qs('#gamesChart');
    const quickEl = qs('#gamesQuickStats');
    const tableBody = qs('#gamesTableBody');
    if (!monthSelect || !listEl || !chartEl) return;

    let games = generateGames();

    function renderList() {
      const month = monthSelect.value;
      const filtered = games.filter(g => month === 'all' || g.month === Number(month));
      listEl.innerHTML = filtered.map(g => `
        <div class="game-item" role="listitem">
          <div class="date">${g.date}</div>
          <div class="match">${g.opponent}｜${g.home ? '主' : '客'}｜${g.result} (${g.score})</div>
          <div class="stat">${g.type === 'batter' ? `HR ${g.HR}｜RBI ${g.RBI}` : `IP ${g.IP}｜K ${g.K}`}</div>
        </div>
      `).join('');
    }

    let chart;
    function renderChart() {
      const month = monthSelect.value;
      const filtered = games.filter(g => month === 'all' || g.month === Number(month));
      const labels = filtered.map(g => g.date.slice(5));
      const data = filtered.map(g => g.type === 'batter' ? g.HR : g.K);
      if (chart) chart.destroy();
      chart = new Chart(chartEl, {
        type: 'bar',
        data: { labels, datasets: [{ label: month === 'all' ? '單場表現' : `${month}月表現`, data, backgroundColor: 'rgba(30,58,138,.6)' }] },
        options: { responsive: true, plugins: { tooltip: { enabled: true } } }
      });
    }

    function renderQuickStats() {
      if (!quickEl || !tableBody) return;
      const month = monthSelect.value;
      const filtered = games.filter(g => month === 'all' || g.month === Number(month));
      const totals = filtered.reduce((acc, g) => {
        acc.games += 1;
        acc.HR += g.HR || 0;
        acc.RBI += g.RBI || 0;
        acc.K += g.K || 0;
        acc.W += g.result === 'W' ? 1 : 0;
        return acc;
      }, { games: 0, HR: 0, RBI: 0, K: 0, W: 0 });
      quickEl.innerHTML = `
        <div class="mini-stat"><div class="label">場次</div><div class="value">${totals.games}</div></div>
        <div class="mini-stat"><div class="label">HR</div><div class="value">${totals.HR}</div></div>
        <div class="mini-stat"><div class="label">RBI</div><div class="value">${totals.RBI}</div></div>
        <div class="mini-stat"><div class="label">K</div><div class="value">${totals.K}</div></div>
        <div class="mini-stat"><div class="label">勝場</div><div class="value">${totals.W}</div></div>
      `;

      tableBody.innerHTML = filtered.map(g => `
        <tr>
          <td>${g.date}</td>
          <td>${g.opponent}</td>
          <td>${g.home ? '主' : '客'}</td>
          <td>${g.result}</td>
          <td>${g.HR}</td>
          <td>${g.RBI}</td>
          <td>${g.IP}</td>
          <td>${g.K}</td>
        </tr>
      `).join('');
    }

    monthSelect.addEventListener('change', () => { renderList(); renderChart(); renderQuickStats(); });
    renderList();
    renderChart();
    renderQuickStats();

    function generateGames() {
      // 模擬 20 場
      const arr = [];
      for (let i = 1; i <= 20; i++) {
        const month = 4 + Math.floor(Math.random()*4);
        const day = 1 + Math.floor(Math.random()*28);
        const batter = Math.random() > 0.5;
        arr.push({
          date: `2025-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
          month,
          opponent: ['TIG','DRG','LIO','EAG'][Math.floor(Math.random()*4)],
          home: Math.random() > 0.5,
          result: Math.random() > 0.5 ? 'W' : 'L',
          score: `${Math.floor(Math.random()*8)+1}-${Math.floor(Math.random()*8)+1}`,
          type: batter ? 'batter' : 'pitcher',
          HR: batter ? Math.floor(Math.random()*2) : 0,
          RBI: batter ? Math.floor(Math.random()*4) : 0,
          IP: batter ? 0 : (Math.random()*7+1).toFixed(1),
          K: batter ? 0 : Math.floor(Math.random()*10)
        });
      }
      return arr.sort((a,b) => a.date.localeCompare(b.date));
    }
  }

  function initCareerPanel() {
    const ctx = qs('#careerChart');
    const totalsEl = qs('#careerTotals');
    const milestonesEl = qs('#milestones');
    if (!ctx) return;
    const seasons = ['2021','2022','2023','2024','2025'];
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['AVG','HR','RBI','OBP','ERA','K','W'],
        datasets: seasons.map((y, idx) => ({
          label: y,
          data: [rand(0.25, .33,3), randInt(10,30), randInt(40,100), rand(0.30,.42,2), rand(2.2,4.1,2), randInt(80,190), randInt(5,18)],
          borderColor: `hsl(${(idx*60)%360} 70% 45%)`,
          backgroundColor: `hsl(${(idx*60)%360} 70% 45% / .15)`
        }))
      },
      options: { responsive: true, scales: { r: { ticks: { display: false } } }, plugins: { legend: { position: 'bottom' } } }
    });

    // 生涯總覽（示例匯總）
    if (totalsEl) {
      const totals = { HR: 126, RBI: 385, K: 782, W: 59, AVG: .307, ERA: 2.96 };
      totalsEl.innerHTML = `
        <div class="total-item"><div class="label">AVG</div><div class="value">${totals.AVG.toFixed(3)}</div></div>
        <div class="total-item"><div class="label">HR</div><div class="value">${totals.HR}</div></div>
        <div class="total-item"><div class="label">RBI</div><div class="value">${totals.RBI}</div></div>
        <div class="total-item"><div class="label">ERA</div><div class="value">${totals.ERA.toFixed(2)}</div></div>
        <div class="total-item"><div class="label">K</div><div class="value">${totals.K}</div></div>
        <div class="total-item"><div class="label">W</div><div class="value">${totals.W}</div></div>
      `;
    }

    // 里程碑進度
    if (milestonesEl) {
      const ms = [
        { name: '生涯 150 HR', current: 126, target: 150 },
        { name: '生涯 1000 K', current: 782, target: 1000 },
        { name: '生涯 70 勝', current: 59, target: 70 }
      ];
      milestonesEl.innerHTML = ms.map(m => {
        const pct = Math.min(100, Math.round((m.current / m.target) * 100));
        return `
          <div class="milestone">
            <div class="name">${m.name}</div>
            <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
            <div class="count">${m.current} / ${m.target}</div>
          </div>
        `;
      }).join('');
    }

    function rand(min, max, fixed=2){ return Number((Math.random()*(max-min)+min).toFixed(fixed)); }
    function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
  }

  function initCareerTimeline() {
    const wrap = qs('#careerTimeline');
    if (!wrap) return;
    const items = [
      { year: '2019', icon: 'ri-user-add-line', title: '加入職棒', desc: '完成選秀進入一軍' },
      { year: '2021', icon: 'ri-trophy-line', title: '年度獎項', desc: '奪得最佳新人' },
      { year: '2023', icon: 'ri-star-smile-line', title: '里程碑', desc: '生涯第 100 轟/500 K' },
      { year: '2024', icon: 'ri-award-line', title: '榮譽入選', desc: '明星賽先發' }
    ];

    wrap.innerHTML = items.map(i => `
      <div class="timeline-item" role="listitem">
        <div class="badge"><i class="${i.icon}"></i></div>
        <div class="content">
          <div class="meta"><strong>${i.year}</strong></div>
          <div class="title">${i.title}</div>
          <div class="desc">${i.desc}</div>
        </div>
      </div>
    `).join('');

    enableHorizontalDrag(wrap);
  }

  function enableHorizontalDrag(el) {
    let isDown = false; let startX = 0; let scrollLeft = 0;
    el.addEventListener('mousedown', (e) => { isDown = true; el.classList.add('is-dragging'); startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; });
    el.addEventListener('mouseleave', () => { isDown = false; el.classList.remove('is-dragging'); });
    el.addEventListener('mouseup', () => { isDown = false; el.classList.remove('is-dragging'); });
    el.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; const walk = (x - startX); el.scrollLeft = scrollLeft - walk; });
    // Touch
    el.addEventListener('touchstart', (e) => { isDown = true; el.classList.add('is-dragging'); startX = e.touches[0].pageX - el.offsetLeft; scrollLeft = el.scrollLeft; }, { passive: true });
    el.addEventListener('touchend', () => { isDown = false; el.classList.remove('is-dragging'); }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (!isDown) return; const x = e.touches[0].pageX - el.offsetLeft; const walk = (x - startX); el.scrollLeft = scrollLeft - walk; }, { passive: false });
  }

  function initNewsSocial() {
    const newsEl = qs('#playerNews');
    const socialEl = qs('#socialLinks');
    const commentsEl = qs('#comments');
    if (newsEl) {
      const news = [
        { title: '單場雙響砲！', date: '2025-07-08' },
        { title: '本季第 15 勝達成', date: '2025-07-02' },
        { title: '六月最佳球員', date: '2025-06-30' }
      ];
      newsEl.innerHTML = news.map(n => `
        <article class="news-card">
          <div class="meta"><span>${n.date}</span></div>
          <h4>${n.title}</h4>
        </article>
      `).join('');
    }

    if (socialEl) {
      const links = [
        { icon: 'ri-twitter-x-line', label: 'Twitter', href: '#' },
        { icon: 'ri-instagram-line', label: 'Instagram', href: '#' },
        { icon: 'ri-at-line', label: 'Threads', href: '#' }
      ];
      socialEl.innerHTML = links.map(l => `
        <a href="${l.href}" target="_blank" rel="noopener"><i class="${l.icon}"></i>${l.label}</a>
      `).join('');
    }

    if (commentsEl) {
      const seed = [
        { user: '棒球迷A', text: '球技太猛了！' },
        { user: '數據控D', text: '本季 K/9 明顯提升' }
      ];
      commentsEl.innerHTML = seed.map(c => renderComment(c.user, c.text)).join('');
      qs('#sendComment')?.addEventListener('click', () => {
        const input = qs('#commentText');
        const text = input.value.trim();
        if (!text) return;
        commentsEl.insertAdjacentHTML('beforeend', renderComment('你', text));
        input.value = '';
        commentsEl.scrollTop = commentsEl.scrollHeight;
      });
    }

    function renderComment(user, text) {
      const initials = user.slice(0,1).toUpperCase();
      return `
        <div class="comment">
          <div class="avatar">${initials}</div>
          <div class="body">
            <div class="user" style="font-weight:700;">${user}</div>
            <div class="text" style="color:var(--text-secondary);">${text}</div>
          </div>
        </div>
      `;
    }
  }

  function initFooter() {
    const year = qs('#currentYear');
    if (year) year.textContent = new Date().getFullYear();
  }

  // --- 統計模態窗 ---
  let statModalChart;
  function initStatModal() {
    const modal = qs('#statModal');
    const closeBtn = qs('#statModalClose');
    const overlay = qs('#statModalOverlay');
    closeBtn?.addEventListener('click', closeStatModal);
    overlay?.addEventListener('click', closeStatModal);
  }

  function openStatModal(title) {
    const modal = qs('#statModal');
    if (!modal) return;
    qs('#statModalTitle').textContent = title;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // 初始化模態內圖表與模式切換
    const toolbarBtns = qsa('#statModal .mode-btn');
    toolbarBtns.forEach((b, i) => b.classList.toggle('active', i === 0));
    toolbarBtns.forEach(b => b.addEventListener('click', () => {
      toolbarBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderStatModalChart(b.dataset.mode);
    }));
    renderStatModalChart('season');
  }

  function closeStatModal() {
    const modal = qs('#statModal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (statModalChart) { statModalChart.destroy(); statModalChart = null; }
  }

  function renderStatModalChart(mode) {
    const ctx = qs('#statModalChart');
    if (!ctx) return;
    if (statModalChart) statModalChart.destroy();

    if (mode === 'season') {
      // 重用 season 面板資料或生成示例
      const labels = ['4月','5月','6月','7月'];
      const avg = [0.298,0.305,0.312,0.318];
      statModalChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [ { label: 'AVG', data: avg, borderColor: '#0D1B2A', backgroundColor: 'rgba(13,27,42,.15)', tension:.3 } ] }, options: { responsive:true } });
    } else if (mode === 'career') {
      const years = ['2021','2022','2023','2024','2025'];
      const W = [8,10,12,14,15];
      statModalChart = new Chart(ctx, { type: 'bar', data: { labels: years, datasets: [ { label: 'W', data: W, backgroundColor: 'rgba(247,127,0,.7)' } ] }, options: { responsive:true } });
    } else {
      const games = Array.from({length: 15}, (_,i)=> i+1);
      const k9 = games.map(()=> Math.floor(Math.random()*10));
      statModalChart = new Chart(ctx, { type: 'bar', data: { labels: games, datasets: [ { label: '單場K', data: k9, backgroundColor: 'rgba(16,185,129,.6)' } ] }, options: { responsive:true } });
    }
  }

  function bindChartModeSwitch(){
    const modeBtns = qsa('.mode-btn');
    if(!modeBtns.length) return;
    modeBtns.forEach(btn => btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.toggle('active', b === btn));
      const tab = btn.dataset.mode || 'season';
      // 若在主面板，切換對應分頁
      const panelBtn = qs(`.tab-btn[data-tab="${tab}"]`);
      panelBtn?.click();
    }));
  }

  function bindStatCardInteractions(){
    const grid = qs('#statsGrid');
    if(!grid) return;
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.stat-card');
      if(!card) return;
      const label = card.querySelector('.label')?.textContent || '詳細統計';
      openStatModal(label);
    });
  }
}); 