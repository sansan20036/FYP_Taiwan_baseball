document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  // 初始化所有功能
  initHeroCarousel();
  initScheduleList();
  initUserMenu();
  initSearch();
  initScrollTop();
  initNavigation();
  initButtons();
  initRecommendations();
  initFooter();

  // 通用：啟用水平滑動（按鈕/拖曳/觸控/鍵盤）
  enableHorizontalScroll('#dateScroll', '#datePrev', '#dateNext');
  enableHorizontalScroll('#newsCarousel', '#newsPrev', '#newsNext');
  enableHorizontalScroll('#analysisCarousel', '#analysisPrev', '#analysisNext');
  enableHorizontalScroll('#rankingsCarousel', '#rankingsPrev', '#rankingsNext');

  function enableHorizontalScroll(scrollSelector, prevBtnSelector, nextBtnSelector) {
    const el = qs(scrollSelector);
    if (!el) return;

    const prevBtn = prevBtnSelector ? qs(prevBtnSelector) : null;
    const nextBtn = nextBtnSelector ? qs(nextBtnSelector) : null;

    // 動態更新按鈕狀態
    const updateButtons = () => {
      if (!prevBtn || !nextBtn) return;
      const maxScrollLeft = el.scrollWidth - el.clientWidth - 1;
      prevBtn.disabled = el.scrollLeft <= 0;
      nextBtn.disabled = el.scrollLeft >= maxScrollLeft;
    };

    // 平滑捲動距離（卡片寬度或容器寬度）
    const getStep = () => Math.max(200, Math.floor(el.clientWidth * 0.8));

    prevBtn?.addEventListener('click', () => {
      el.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    nextBtn?.addEventListener('click', () => {
      el.scrollBy({ left: getStep(), behavior: 'smooth' });
    });

    // 拖曳/觸控滑動
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      isDown = true;
      hasMoved = false;
      el.classList.add('is-dragging');
      startX = (e.touches ? e.touches[0].pageX : e.pageX) - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const x = (e.touches ? e.touches[0].pageX : e.pageX) - el.offsetLeft;
      const walk = (x - startX) * 1; // 拖曳速度倍率
      if (Math.abs(walk) > 2) hasMoved = true;
      el.scrollLeft = scrollLeft - walk;
      e.preventDefault();
    };

    const onPointerUp = () => {
      isDown = false;
      el.classList.remove('is-dragging');
    };

    el.addEventListener('mousedown', onPointerDown, { passive: true });
    el.addEventListener('mousemove', onPointerMove, { passive: false });
    el.addEventListener('mouseleave', onPointerUp, { passive: true });
    el.addEventListener('mouseup', onPointerUp, { passive: true });

    el.addEventListener('touchstart', onPointerDown, { passive: true });
    el.addEventListener('touchmove', onPointerMove, { passive: false });
    el.addEventListener('touchend', onPointerUp, { passive: true });

    // 鍵盤左右鍵支援（聚焦在容器時）
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        el.scrollBy({ left: -getStep(), behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        el.scrollBy({ left: getStep(), behavior: 'smooth' });
      }
    });

    // 監聽滾動更新按鈕
    el.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();

    // 避免點擊拖曳造成點擊事件誤觸（給卡片容器）
    el.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  // 用戶選單下拉功能
  function initUserMenu() {
    const menuBtn = qs('#userMenuBtn');
    const dropdown = qs('#userDropdown');
    
    if (!menuBtn || !dropdown) return;

    // 點擊頭像切換下拉選單
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.hasAttribute('hidden');
      
      if (isHidden) {
        dropdown.removeAttribute('hidden');
        menuBtn.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // 點擊外部關閉下拉選單
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // ESC 鍵關閉下拉選單
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown.hasAttribute('hidden')) {
        dropdown.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 搜尋功能
  function initSearch() {
    const searchInput = qs('#matchSearchInput');
    
    if (!searchInput) return;

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          console.log('搜尋賽事:', query);
          // 這裡可以實作搜尋邏輯
          performSearch(query);
        }
      }
    });

    // 即時搜尋（可選）
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      searchTimeout = setTimeout(() => {
        if (query.length >= 2) {
          console.log('即時搜尋:', query);
          // 這裡可以實作即時搜尋邏輯
        }
      }, 300);
    });
  }

  // 執行搜尋
  function performSearch(query) {
    // 這裡可以實作實際的搜尋邏輯
    // 例如：過濾賽事卡片、發送 API 請求等
    const matchCards = qsa('.match-card');
    
    matchCards.forEach(card => {
      const teamNames = qsa('.team-name', card);
      const leagueName = qs('.league-name', card);
      
      const text = [
        ...teamNames.map(el => el.textContent),
        leagueName?.textContent
      ].join(' ').toLowerCase();
      
      const isMatch = text.includes(query.toLowerCase());
      card.style.display = isMatch ? 'block' : 'none';
    });
  }

  // 回到頂端按鈕
  function initScrollTop() {
    const scrollBtn = qs('#scrollTopBtn');
    
    if (!scrollBtn) return;

    // 監聽滾動事件
    const onScroll = () => {
      const show = window.scrollY > 400;
      if (show) {
        scrollBtn.removeAttribute('hidden');
      } else {
        scrollBtn.setAttribute('hidden', '');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // 點擊回到頂端
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 導航選單功能
  function initNavigation() {
    const navLinks = qsa('.nav__link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        // 只攔截 # 開頭的站內分類連結，其餘讓瀏覽器正常導頁
        if (href.startsWith('#')) {
          e.preventDefault();

          // 移除所有 active 狀態
          navLinks.forEach(l => l.classList.remove('is-active'));

          // 添加當前 active 狀態
          link.classList.add('is-active');

          // 分類切換
          const category = href.substring(1);
          console.log('切換到分類:', category);
          loadMatchesByCategory(category);
        } else {
          // 非錨點連結（例如 international.html）不攔截
          return;
        }
      });
    });
  }

  // 載入指定分類的賽事
  function loadMatchesByCategory(category) {
    // 這裡可以實作載入不同分類賽事的邏輯
    console.log('載入分類賽事:', category);
    
    // 範例：顯示載入狀態
    const matchesGrid = qs('.matches-grid');
    if (matchesGrid) {
      matchesGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="ri-loader-4-line" style="font-size: 24px; animation: spin 1s linear infinite;"></i>
          <p>載入 ${category} 賽事中...</p>
        </div>
      `;
      
      // 模擬載入延遲
      setTimeout(() => {
        // 這裡可以載入實際的賽事資料
        loadSampleMatches(matchesGrid, category);
      }, 1000);
    }
  }

  // 載入範例賽事資料
  function loadSampleMatches(container, category) {
    const sampleMatches = {
      league: [
        { league: '中華職棒', type: '例行賽', home: 'Dragons', away: 'Tigers', homeScore: 3, awayScore: 2, status: 'live', inning: '8局下', venue: '台北大巨蛋' },
        { league: '中華職棒', type: '例行賽', home: 'Lions', away: 'Monkeys', homeScore: 1, awayScore: 4, status: 'finished', inning: '比賽結束', venue: '台南球場' }
      ],
      international: [
        { league: '世界棒球經典賽', type: '預賽', home: '中華隊', away: '日本隊', homeScore: 0, awayScore: 5, status: 'finished', inning: '比賽結束', venue: '東京巨蛋' }
      ],
      recent: [
        { league: '中華職棒', type: '例行賽', home: 'Dragons', away: 'Tigers', homeScore: 3, awayScore: 2, status: 'finished', inning: '比賽結束', venue: '台北大巨蛋' }
      ],
      upcoming: [
        { league: '中華職棒', type: '例行賽', home: 'Lions', away: 'Monkeys', homeScore: '-', awayScore: '-', status: 'upcoming', inning: '今晚 19:30', venue: '台南球場' }
      ]
    };

    const matches = sampleMatches[category] || sampleMatches.league;
    
    container.innerHTML = matches.map(match => `
      <article class="match-card">
        <div class="match-header">
          <div class="league-info">
            <span class="league-name">${match.league}</span>
            <span class="match-type">${match.type}</span>
          </div>
          <div class="match-status ${match.status}">
            <i class="ri-${match.status === 'live' ? 'radio-button-line' : match.status === 'finished' ? 'check-line' : 'time-line'}"></i>
            ${match.status === 'live' ? 'LIVE' : match.status === 'finished' ? '結束' : '即將開始'}
          </div>
        </div>
        
        <div class="match-teams">
          <div class="team home">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg" alt="${match.home}" class="team-logo" />
            <div class="team-info">
              <h3 class="team-name">${match.home}</h3>
              <span class="team-score">${match.homeScore}</span>
            </div>
          </div>
          
          <div class="match-vs">
            <span class="vs-text">VS</span>
            <div class="match-time">
              <span class="inning">${match.inning}</span>
              <span class="time">${match.status === 'upcoming' ? '19:30' : '19:30'}</span>
            </div>
          </div>
          
          <div class="team away">
            <div class="team-info">
              <h3 class="team-name">${match.away}</h3>
              <span class="team-score">${match.awayScore}</span>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg" alt="${match.away}" class="team-logo" />
          </div>
        </div>
        
        <div class="match-footer">
          <div class="venue">
            <i class="ri-map-pin-2-line"></i>
            ${match.venue}
          </div>
          <button class="btn btn-sm btn-outline">查看詳情</button>
        </div>
      </article>
    `).join('');
  }

  // 按鈕功能
  function initButtons() {
    // 篩選按鈕
    const filterBtn = qs('#filterBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        console.log('開啟篩選面板');
        // 這裡可以實作篩選功能
      });
    }

    // 重新整理按鈕
    const refreshBtn = qs('#refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('重新整理賽事資料');
        refreshBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> 載入中...';
        
        setTimeout(() => {
          refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> 重新整理';
          // 這裡可以實作重新載入邏輯
        }, 2000);
      });
    }

    // 查看詳情按鈕
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-outline')) {
        console.log('查看賽事詳情');
        // 這裡可以實作跳轉到詳情頁面的邏輯
      }
    });
  }

  // Hero 輪播功能
  function initHeroCarousel() {
    const carousel = qs('#heroCarousel');
    const prevBtn = qs('#heroPrev');
    const nextBtn = qs('#heroNext');
    const dotsContainer = qs('#heroDots');
    
    if (!carousel || !prevBtn || !nextBtn || !dotsContainer) return;

    // 使用統一的比賽資料
    const heroMatches = getHeroMatches();

    let currentSlide = 0;
    const totalSlides = heroMatches.length;

    // 建立輪播軌道
    const track = document.createElement('div');
    track.className = 'hero-track';
    track.style.width = `${totalSlides * 100}%`;
    track.style.transform = 'translateX(0)';
    
    // 生成輪播卡片
    heroMatches.forEach((match, index) => {
      const slide = createHeroSlide(match, index);
      track.appendChild(slide);
    });

    carousel.appendChild(track);

    // 生成導航點
    heroMatches.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    // 更新導航按鈕狀態
    function updateNavButtons() {
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    // 更新導航點
    function updateDots() {
      const dots = qsa('.hero-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
      });
    }

    // 切換到指定幻燈片
    function goToSlide(index) {
      currentSlide = index;
      track.style.transform = `translateX(-${(index / totalSlides) * 100}%)`;
      updateNavButtons();
      updateDots();
    }

    // 下一張
    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      }
    }

    // 上一張
    function prevSlide() {
      if (currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }

    // 綁定按鈕事件
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // 鍵盤導航
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    });

    // 滑動手勢（滑鼠/觸控）
    let swipeStartX = 0;
    let swipeMoved = false;
    const swipeThreshold = 40; // 觸發切換的距離

    const onSwipeStart = (e) => {
      swipeMoved = false;
      stopAutoplay();
      swipeStartX = e.touches ? e.touches[0].clientX : e.clientX;
    };

    const onSwipeMove = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      if (Math.abs(x - swipeStartX) > 3) swipeMoved = true;
    };

    const onSwipeEnd = (e) => {
      const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const dx = endX - swipeStartX;
      if (Math.abs(dx) >= swipeThreshold) {
        if (dx < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      startAutoplay();
    };

    carousel.addEventListener('touchstart', onSwipeStart, { passive: true });
    carousel.addEventListener('touchmove', onSwipeMove, { passive: true });
    carousel.addEventListener('touchend', onSwipeEnd, { passive: true });
    carousel.addEventListener('mousedown', (e) => { onSwipeStart(e); });
    carousel.addEventListener('mousemove', (e) => { if (e.buttons === 1) onSwipeMove(e); });
    carousel.addEventListener('mouseup', onSwipeEnd);
    carousel.addEventListener('mouseleave', (e) => { if (e.buttons === 1) onSwipeEnd(e); });

    // 自動播放（可選）
    let autoplayInterval;
    function startAutoplay() {
      autoplayInterval = setInterval(() => {
        if (currentSlide < totalSlides - 1) {
          nextSlide();
        } else {
          goToSlide(0);
        }
      }, 5000);
    }

    function stopAutoplay() {
      clearInterval(autoplayInterval);
    }

    // 滑鼠懸停時暫停自動播放
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // 初始化
    updateNavButtons();
    startAutoplay();
  }

  // 建立 Hero 輪播卡片
  function createHeroSlide(match, index) {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.style.width = `${100 / 3}%`; // 3張卡片

    const statusText = {
      'live': 'LIVE',
      'finished': '結束',
      'upcoming': '即將開始'
    };

    const statusIcon = {
      'live': 'ri-radio-button-line',
      'finished': 'ri-check-line',
      'upcoming': 'ri-time-line'
    };

    slide.innerHTML = `
      <div class="hero-team home">
        <img src="${match.homeLogo}" alt="${match.home}" class="hero-team-logo" />
        <h3 class="hero-team-name">${match.home}</h3>
        <div class="hero-team-score">${match.homeScore}</div>
      </div>
      
      <div class="hero-vs">
        <div class="hero-vs-text">VS</div>
        <div class="hero-match-info">
          <div class="hero-match-time">${match.time}</div>
          <div class="hero-match-venue">${match.venue}</div>
          <div class="hero-match-status ${match.status}">
            <i class="${statusIcon[match.status]}"></i>
            ${statusText[match.status]}
          </div>
        </div>
      </div>
      
      <div class="hero-team away">
        <img src="${match.awayLogo}" alt="${match.away}" class="hero-team-logo" />
        <h3 class="hero-team-name">${match.away}</h3>
        <div class="hero-team-score">${match.awayScore}</div>
      </div>
      
      <div class="hero-actions">
        <button class="hero-btn hero-btn-primary" onclick="viewMatchDetail(${index})">
          <i class="ri-eye-line"></i>
          查看比賽詳情
        </button>
        <button class="hero-btn hero-btn-secondary" onclick="subscribeMatch(${index})">
          <i class="ri-notification-line"></i>
          訂閱提醒
        </button>
      </div>
    `;

    return slide;
  }

  // 查看比賽詳情
  window.viewMatchDetail = function(index) {
    console.log('查看比賽詳情:', index);
    // 獲取比賽資料並開啟模態框
    const matches = getHeroMatches();
    if (matches[index]) {
      openMatchDetailModal(matches[index]);
    }
  };

  // 訂閱比賽提醒
  window.subscribeMatch = function(index) {
    console.log('訂閱比賽提醒:', index);
    // 這裡可以實作訂閱提醒的邏輯
    alert(`已訂閱第 ${index + 1} 場比賽提醒`);
  };

  // 賽事列表功能
  function initScheduleList() {
    const dateScroll = qs('#dateScroll');
    const datePrev = qs('#datePrev');
    const dateNext = qs('#dateNext');
    const scheduleList = qs('#scheduleList');
    const currentDateEl = qs('#currentDate');
    const totalMatchesEl = qs('#totalMatches');
    const liveMatchesEl = qs('#liveMatches');
    
    if (!dateScroll || !scheduleList) return;

    // 控制列元素
    const schedSearch = qs('#schedSearch');
    const schedStatus = qs('#schedStatus');
    const schedSort = qs('#schedSort');

    // 生成日期選項（前後7天）
    const dates = generateDateOptions();
    let currentDateIndex = 7; // 今天

    // 建立日期選項
    dates.forEach((date, index) => {
      const dateOption = createDateOption(date, index);
      dateScroll.appendChild(dateOption);
    });

    // 載入今日賽事
    loadScheduleForDateIndex(currentDateIndex);

    // 日期導航事件
    datePrev.addEventListener('click', () => {
      if (currentDateIndex > 0) {
        currentDateIndex--;
        updateDateSelection();
        loadScheduleForDateIndex(currentDateIndex);
      }
    });

    dateNext.addEventListener('click', () => {
      if (currentDateIndex < dates.length - 1) {
        currentDateIndex++;
        updateDateSelection();
        loadScheduleForDateIndex(currentDateIndex);
      }
    });

    // 更新日期選擇狀態
    function updateDateSelection() {
      const dateOptions = qsa('.date-option');
      dateOptions.forEach((option, index) => {
        option.classList.toggle('active', index === currentDateIndex);
      });
      datePrev.disabled = currentDateIndex === 0;
      dateNext.disabled = currentDateIndex === dates.length - 1;
    }

    // 載入指定日期的賽事（加入搜尋/篩選/排序）
    function loadScheduleForDateIndex(dateIndex) {
      const date = dates[dateIndex];
      const source = getMatchesForDate(date);

      // 篩選 + 搜尋
      const keyword = (schedSearch?.value || '').toLowerCase();
      const status = schedStatus?.value || 'all';
      let matches = source.filter(m =>
        (status === 'all' || m.status === status) &&
        (`${m.home} ${m.away} ${m.venue}`.toLowerCase().includes(keyword))
      );

      // 排序
      const sortBy = schedSort?.value || 'time';
      if (sortBy === 'status') {
        const order = { live: 0, upcoming: 1, finished: 2 };
        matches.sort((a,b)=> (order[a.status] ?? 9) - (order[b.status] ?? 9));
      } else if (sortBy === 'alpha') {
        matches.sort((a,b)=> (a.home+a.away).localeCompare(b.home+b.away));
      } else { // time
        matches.sort((a,b)=> (a.time||'').localeCompare(b.time||''));
      }
      
      // 更新標題和統計
      currentDateEl.textContent = formatDateTitle(date);
      totalMatchesEl.textContent = matches.length;
      liveMatchesEl.textContent = matches.filter(m => m.status === 'live').length;
      
      // 清空並重新載入賽事列表
      scheduleList.innerHTML = '';
      
      if (matches.length === 0) {
        scheduleList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="ri-calendar-event-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>該條件下沒有賽事</p>
          </div>
        `;
        return;
      }
      
      matches.forEach(match => {
        const card = createScheduleCard(match);
        card.addEventListener('mousedown', ()=> card.style.transform='scale(.995)');
        card.addEventListener('mouseup',   ()=> card.style.transform='');
        scheduleList.appendChild(card);
      });
    }

    // 控制列即時反應
    [schedSearch, schedStatus, schedSort].forEach(el => {
      el && el.addEventListener('input', () => loadScheduleForDateIndex(currentDateIndex));
      el && el.addEventListener('change', () => loadScheduleForDateIndex(currentDateIndex));
    });

    // 初始化
    updateDateSelection();
  }

  // Toast 工具
  function toast(msg){
    const el = document.getElementById('toast');
    if(!el) return alert(msg);
    el.textContent = msg; el.hidden=false;
    requestAnimationFrame(()=> el.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.hidden=true, 240); }, 1600);
  }

  // 修改功能圖示點擊，加入 ripple 與 toast
  function handleScheduleFeatureClick(feature, match) {
    switch (feature) {
      case 'live':
        toast(`前往直播：${match.home} vs ${match.away}`);
        break;
      case 'ticket':
        toast(`前往購票：${match.home} vs ${match.away}`);
        break;
      case 'stats':
        toast(`查看統計：${match.home} vs ${match.away}`);
        break;
    }
  }

  // 生成日期選項
  function generateDateOptions() {
    const dates = [];
    const today = new Date();
    
    // 前7天到後7天
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // 建立日期選項元素
  function createDateOption(date, index) {
    const option = document.createElement('div');
    option.className = `date-option ${index === 7 ? 'active' : ''}`;
    
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const day = dayNames[date.getDay()];
    const dateNum = date.getDate();
    const month = date.getMonth() + 1;
    
    // 模擬比賽數量
    const matchesCount = Math.floor(Math.random() * 5);
    
    option.innerHTML = `
      <div class="day">${day}</div>
      <div class="date">${month}/${dateNum}</div>
      ${matchesCount > 0 ? `<div class="matches-count">${matchesCount}</div>` : ''}
    `;
    
    option.addEventListener('click', () => {
      // 移除所有 active 狀態
      qsa('.date-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // 載入該日期的賽事
      loadScheduleForDateIndex(index);
    });
    
    return option;
  }

  // 格式化日期標題
  function formatDateTitle(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今日賽事';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明日賽事';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日賽事';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日賽事`;
    }
  }

  // 獲取指定日期的賽事資料
  function getMatchesForDate(date) {
    // 模擬不同日期的賽事資料
    const dateStr = date.toDateString();
    const today = new Date().toDateString();
    
    if (dateStr === today) {
      return [
        {
          home: 'Dragons',
          away: 'Tigers',
          homeScore: 3,
          awayScore: 2,
          status: 'live',
          time: '19:30',
          venue: '台北大巨蛋',
          inning: '8局下',
          progress: 75,
          homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          features: ['live', 'stats']
        },
        {
          home: 'Lions',
          away: 'Monkeys',
          homeScore: 1,
          awayScore: 4,
          status: 'finished',
          time: '18:00',
          venue: '台南球場',
          inning: '比賽結束',
          homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          features: ['stats']
        },
        {
          home: '中華隊',
          away: '日本隊',
          homeScore: 0,
          awayScore: 5,
          status: 'upcoming',
          time: '19:00',
          venue: '東京巨蛋',
          inning: '今晚開打',
          homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          features: ['ticket', 'stats']
        }
      ];
    } else {
      // 其他日期隨機生成賽事
      const count = Math.floor(Math.random() * 4);
      const matches = [];
      
      for (let i = 0; i < count; i++) {
        const statuses = ['upcoming', 'live', 'finished'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        matches.push({
          home: `Team ${i + 1}`,
          away: `Team ${i + 2}`,
          homeScore: status === 'upcoming' ? '-' : Math.floor(Math.random() * 10),
          awayScore: status === 'upcoming' ? '-' : Math.floor(Math.random() * 10),
          status: status,
          time: `${18 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6)}0`,
          venue: `球場 ${i + 1}`,
          inning: status === 'live' ? `${Math.floor(Math.random() * 9) + 1}局${Math.random() > 0.5 ? '上' : '下'}` : '比賽結束',
          progress: status === 'live' ? Math.floor(Math.random() * 100) : 100,
          homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
          features: ['stats']
        });
      }
      
      return matches;
    }
  }

  // 建立賽事卡片
  function createScheduleCard(match) {
    const card = document.createElement('div');
    card.className = `schedule-card ${match.status}`;
    
    const statusText = {
      'live': 'LIVE',
      'upcoming': '即將開始',
      'finished': '已結束'
    };
    
    const statusIcon = {
      'live': 'ri-radio-button-line',
      'upcoming': 'ri-time-line',
      'finished': 'ri-check-line'
    };

    const featureConfig = {
      'live': { icon: 'ri-live-line', tooltip: '直播中' },
      'ticket': { icon: 'ri-ticket-line', tooltip: '購票' },
      'stats': { icon: 'ri-bar-chart-line', tooltip: '賽事統計' }
    };

    card.innerHTML = `
      <div class="team-info home">
        <img src="${match.homeLogo}" alt="${match.home}" class="team-logo" />
        <div class="team-details">
          <h4 class="team-name">${match.home}</h4>
          <div class="team-record">32勝 18負</div>
        </div>
      </div>
      
      <div class="match-status-area">
        <div class="match-time">${match.time}</div>
        <div class="match-status ${match.status}">
          <i class="${statusIcon[match.status]}"></i>
          ${statusText[match.status]}
        </div>
        
        ${match.status === 'live' ? `
          <div class="score-area">
            <span class="score">${match.homeScore}</span>
            <span class="score-divider">:</span>
            <span class="score">${match.awayScore}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${match.progress}%"></div>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">${match.inning}</div>
        ` : ''}
        
        ${match.status === 'upcoming' ? `
          <div style="font-size: 12px; color: var(--text-secondary);">${match.inning}</div>
        ` : ''}
        
        ${match.status === 'finished' ? `
          <div class="score-area">
            <span class="score">${match.homeScore}</span>
            <span class="score-divider">:</span>
            <span class="score">${match.awayScore}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="team-info away">
        <div class="team-details">
          <h4 class="team-name">${match.away}</h4>
          <div class="team-record">29勝 21負</div>
        </div>
        <img src="${match.awayLogo}" alt="${match.away}" class="team-logo" />
      </div>
      
      <div class="match-features">
        ${match.features.map(feature => `
          <div class="feature-icon ${feature}" data-tooltip="${featureConfig[feature].tooltip}">
            <i class="${featureConfig[feature].icon}"></i>
          </div>
        `).join('')}
      </div>
    `;
    
    // 綁定功能圖示事件
    const featureElements = card.querySelectorAll('.feature-icon');
    featureElements.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const feature = icon.classList.contains('live') ? 'live' : 
                       icon.classList.contains('ticket') ? 'ticket' : 'stats';
        handleScheduleFeatureClick(feature, match);
      });
    });
    
    // 點擊卡片查看詳情
    card.addEventListener('click', (e) => {
      // 如果點擊的是功能圖示，不觸發卡片點擊
      if (e.target.closest('.feature-icon')) {
        return;
      }
      viewScheduleMatchDetail(match);
    });
    
    return card;
  }

  // 查看比賽詳情
  function viewScheduleMatchDetail(match) {
    console.log('查看比賽詳情:', match);
    if (match) {
      openMatchDetailModal(match);
    } else {
      console.error('比賽資料為空');
    }
  }

  // 獲取 Hero 輪播的比賽資料
  function getHeroMatches() {
    return [
      {
        home: 'Dragons',
        away: 'Tigers',
        homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        homeScore: '3',
        awayScore: '1',
        time: '今晚 19:05',
        venue: '台北大巨蛋',
        status: 'live',
        inning: '7局下',
        progress: 78
      },
      {
        home: 'Eagles',
        away: 'Lions',
        homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        homeScore: '2',
        awayScore: '2',
        time: '今晚 20:00',
        venue: '台中洲際棒球場',
        status: 'upcoming',
        inning: '未開始',
        progress: 0
      },
      {
        home: 'Bears',
        away: 'Monkeys',
        homeLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        awayLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        homeScore: '5',
        awayScore: '3',
        time: '下午 14:30',
        venue: '桃園國際棒球場',
        status: 'finished',
        inning: '9局結束',
        progress: 100
      }
    ];
  }

  // 開啟比賽詳情模態框
  function openMatchDetailModal(match) {
    const modal = qs('#matchDetailModal');
    if (!modal) return;

    // 填充模態框內容
    fillMatchDetailModal(match);
    
    // 顯示模態框
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    
    // 初始化模態框功能
    initModalFunctionality(match);
  }

  // 填充比賽詳情模態框
  function fillMatchDetailModal(match) {
    // 填充球隊資訊
    qs('#homeTeamLogo').src = match.homeLogo;
    qs('#homeTeamLogo').alt = match.home;
    qs('#homeTeamName').textContent = match.home;
    qs('#homeTeamScore').textContent = match.homeScore || '0';
    
    qs('#awayTeamLogo').src = match.awayLogo;
    qs('#awayTeamLogo').alt = match.away;
    qs('#awayTeamName').textContent = match.away;
    qs('#awayTeamScore').textContent = match.awayScore || '0';
    
    // 填充比賽狀態
    const statusHeader = qs('#matchStatusHeader');
    statusHeader.textContent = getStatusText(match.status);
    statusHeader.className = `match-status-header ${match.status}`;
    
    // 填充時間和場地
    qs('#matchTimeHeader').textContent = match.time;
    qs('#matchVenueHeader').textContent = match.venue || '台北大巨蛋';
    
    // 填充進度
    const progressHeader = qs('#matchProgressHeader');
    if (match.status === 'live') {
      progressHeader.textContent = `${match.inning} - ${match.progress}%`;
    } else if (match.status === 'upcoming') {
      progressHeader.textContent = '即將開始';
    } else {
      progressHeader.textContent = '比賽結束';
    }
  }

  // 初始化模態框功能
  function initModalFunctionality(match) {
    // 關閉模態框
    const closeModal = qs('#closeModal');
    const modalOverlay = qs('#modalOverlay');
    
    closeModal.addEventListener('click', closeMatchDetailModal);
    modalOverlay.addEventListener('click', closeMatchDetailModal);
    
    // ESC 鍵關閉
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMatchDetailModal();
      }
    });
    
    // Tab 切換
    initTabNavigation();
    
    // 操作按鈕
    initModalActions(match);
    
    // 初始化圖表
    initModalCharts();
    
    // 初始化球員列表
    initPlayersList(match);
    
    // 初始化事件時間軸
    initEventsTimeline(match);
    
    // 初始化聊天功能
    initLiveChat();
  }

  // 關閉比賽詳情模態框
  function closeMatchDetailModal() {
    const modal = qs('#matchDetailModal');
    if (modal) {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
  }

  // 初始化 Tab 導航
  function initTabNavigation() {
    const tabBtns = qsa('.tab-btn');
    const tabPanels = qsa('.tab-panel');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // 移除所有 active 狀態
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        // 添加 active 狀態
        btn.classList.add('active');
        qs(`#${targetTab}Panel`).classList.add('active');
      });
    });
  }

  // 初始化模態框操作按鈕
  function initModalActions(match) {
    // 分享按鈕
    qs('#shareBtn').addEventListener('click', () => {
      shareMatch(match);
    });
    
    // 收藏按鈕
    qs('#favoriteBtn').addEventListener('click', () => {
      toggleFavorite(match);
    });
    
    // 訂閱按鈕
    qs('#subscribeBtn').addEventListener('click', () => {
      subscribeMatch(match);
    });
  }

  // 分享比賽
  function shareMatch(match) {
    const shareData = {
      title: `${match.home} vs ${match.away}`,
      text: `觀看 ${match.home} 對戰 ${match.away} 的精彩比賽！`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // 複製到剪貼簿
      navigator.clipboard.writeText(shareData.url);
      alert('連結已複製到剪貼簿！');
    }
  }

  // 切換收藏狀態
  function toggleFavorite(match) {
    const btn = qs('#favoriteBtn');
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('ri-heart-line')) {
      icon.className = 'ri-heart-fill';
      btn.style.color = '#ef4444';
      alert(`已收藏 ${match.home} vs ${match.away} 比賽`);
    } else {
      icon.className = 'ri-heart-line';
      btn.style.color = '';
      alert(`已取消收藏 ${match.home} vs ${match.away} 比賽`);
    }
  }

  // 訂閱比賽提醒
  function subscribeMatch(match) {
    const btn = qs('#subscribeBtn');
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('ri-notification-line')) {
      icon.className = 'ri-notification-fill';
      btn.style.color = '#f59e0b';
      alert(`已訂閱 ${match.home} vs ${match.away} 比賽提醒`);
    } else {
      icon.className = 'ri-notification-line';
      btn.style.color = '';
      alert(`已取消訂閱 ${match.home} vs ${match.away} 比賽提醒`);
    }
  }

  // 初始化模態框圖表
  function initModalCharts() {
    // 打擊表現圖表
    const battingCtx = qs('#battingChart');
    if (battingCtx && typeof Chart !== 'undefined') {
      new Chart(battingCtx, {
        type: 'bar',
        data: {
          labels: ['打擊率', '上壘率', '長打率', 'OPS'],
          datasets: [{
            label: '主隊',
            data: [0.268, 0.335, 0.456, 0.791],
            backgroundColor: '#2563eb'
          }, {
            label: '客隊',
            data: [0.254, 0.319, 0.432, 0.751],
            backgroundColor: '#ef4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 1
            }
          }
        }
      });
    }
    
    // 投手表現圖表
    const pitchingCtx = qs('#pitchingChart');
    if (pitchingCtx && typeof Chart !== 'undefined') {
      new Chart(pitchingCtx, {
        type: 'radar',
        data: {
          labels: ['ERA', 'WHIP', 'SO/9', 'BB/9', 'HR/9'],
          datasets: [{
            label: '主隊先發',
            data: [2.81, 0.98, 10.4, 2.1, 0.8],
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderColor: '#2563eb',
            pointBackgroundColor: '#2563eb'
          }, {
            label: '客隊先發',
            data: [3.12, 1.05, 9.1, 2.8, 1.2],
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#ef4444',
            pointBackgroundColor: '#ef4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 12
            }
          }
        }
      });
    }
    
    // 局數進度
    initInningProgress();
    
    // 關鍵數據
    initKeyStats();
  }

  // 初始化局數進度
  function initInningProgress() {
    const inningGrid = qs('#inningGrid');
    if (!inningGrid) return;
    
    inningGrid.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
      const inningItem = document.createElement('div');
      inningItem.className = 'inning-item';
      
      if (i <= 6) {
        inningItem.classList.add('completed');
      } else if (i === 7) {
        inningItem.classList.add('current');
      }
      
      inningItem.innerHTML = `
        <div class="inning-number">${i}</div>
        <div class="inning-score">${i <= 6 ? '2-1' : i === 7 ? '進行中' : ''}</div>
      `;
      
      inningGrid.appendChild(inningItem);
    }
  }

  // 初始化關鍵數據
  function initKeyStats() {
    const keyStats = qs('#keyStats');
    if (!keyStats) return;
    
    const stats = [
      { label: '安打', value: '8-6' },
      { label: '全壘打', value: '1-0' },
      { label: '三振', value: '7-9' },
      { label: '保送', value: '3-2' },
      { label: '失誤', value: '0-1' },
      { label: '盜壘', value: '2-1' }
    ];
    
    keyStats.innerHTML = stats.map(stat => `
      <div class="key-stat-item">
        <span class="key-stat-label">${stat.label}</span>
        <span class="key-stat-value">${stat.value}</span>
      </div>
    `).join('');
  }

  // 初始化球員列表
  function initPlayersList(match) {
    const homePlayers = qs('#homeTeamPlayers');
    const awayPlayers = qs('#awayTeamPlayers');
    
    if (homePlayers) {
      qs('#homeTeamPlayersTitle').textContent = `${match.home} 球員名單`;
      homePlayers.innerHTML = generatePlayersList('home');
    }
    
    if (awayPlayers) {
      qs('#awayTeamPlayersTitle').textContent = `${match.away} 球員名單`;
      awayPlayers.innerHTML = generatePlayersList('away');
    }
  }

  // 生成球員列表
  function generatePlayersList(team) {
    const players = team === 'home' ? [
      { name: 'A. Chen', position: '投手', number: '18', avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=100&auto=format&fit=crop' },
      { name: 'L. Wang', position: '捕手', number: '22', avatar: 'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=100&auto=format&fit=crop' },
      { name: 'J. Lin', position: '一壘手', number: '25', avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=100&auto=format&fit=crop' },
      { name: 'K. Wu', position: '二壘手', number: '7', avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=100&auto=format&fit=crop' },
      { name: 'M. Chang', position: '三壘手', number: '33', avatar: 'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=100&auto=format&fit=crop' }
    ] : [
      { name: 'R. Tanaka', position: '投手', number: '11', avatar: 'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=100&auto=format&fit=crop' },
      { name: 'K. Sato', position: '捕手', number: '27', avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=100&auto=format&fit=crop' },
      { name: 'T. Ito', position: '一壘手', number: '5', avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=100&auto=format&fit=crop' },
      { name: 'H. Yamamoto', position: '二壘手', number: '9', avatar: 'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=100&auto=format&fit=crop' },
      { name: 'Y. Suzuki', position: '三壘手', number: '15', avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=100&auto=format&fit=crop' }
    ];
    
    return players.map(player => `
      <div class="player-item" onclick="openPlayerCard('${player.name}', '${player.position}', '${player.number}', '${player.avatar}')">
        <img src="${player.avatar}" alt="${player.name}" class="player-avatar-small" />
        <div class="player-info-small">
          <h5 class="player-name-small">${player.name}</h5>
          <p class="player-position-small">${player.position}</p>
        </div>
        <div class="player-number">${player.number}</div>
      </div>
    `).join('');
  }

  // 開啟球員卡片
  window.openPlayerCard = function(name, position, number, avatar) {
    const modal = qs('#playerCardModal');
    if (!modal) return;
    
    // 填充球員資訊
    qs('#playerAvatar').src = avatar;
    qs('#playerAvatar').alt = name;
    qs('#playerName').textContent = name;
    qs('#playerPosition').textContent = `${position} #${number}`;
    qs('#playerTeam').textContent = '球隊名稱';
    
    // 填充球員統計
    const playerStats = qs('#playerStats');
    const stats = [
      { label: '打擊率', value: '0.285' },
      { label: '全壘打', value: '12' },
      { label: '打點', value: '45' },
      { label: '盜壘', value: '8' },
      { label: 'OPS', value: '0.845' },
      { label: 'WAR', value: '2.8' }
    ];
    
    playerStats.innerHTML = stats.map(stat => `
      <div class="key-stat-item">
        <span class="key-stat-label">${stat.label}</span>
        <span class="key-stat-value">${stat.value}</span>
      </div>
    `).join('');
    
    // 顯示球員卡片
    modal.removeAttribute('hidden');
    
    // 關閉球員卡片
    qs('#closePlayerModal').addEventListener('click', () => {
      modal.setAttribute('hidden', '');
    });
    
    qs('#playerModalOverlay').addEventListener('click', () => {
      modal.setAttribute('hidden', '');
    });
  };

  // 初始化事件時間軸
  function initEventsTimeline(match) {
    const eventsTimeline = qs('#eventsTimeline');
    if (!eventsTimeline) return;
    
    const events = [
      { time: '19:05', title: '比賽開始', description: '第一局上半，客隊先攻', icon: 'ri-play-circle-line' },
      { time: '19:12', title: '第一支安打', description: '客隊第一棒擊出中外野安打', icon: 'ri-baseball-bat-line' },
      { time: '19:18', title: '三振出局', description: '主隊投手三振客隊第三棒', icon: 'ri-close-circle-line' },
      { time: '19:25', title: '第一局結束', description: '客隊 0 分，主隊準備進攻', icon: 'ri-time-line' },
      { time: '19:32', title: '主隊得分', description: '主隊第四棒擊出二壘安打，送回跑者', icon: 'ri-star-line' },
      { time: '19:45', title: '全壘打', description: '主隊第六棒擊出左外野全壘打', icon: 'ri-fire-line' },
      { time: '20:15', title: '換投手', description: '客隊更換投手', icon: 'ri-exchange-line' },
      { time: '20:30', title: '失誤', description: '客隊游擊手失誤，主隊得分', icon: 'ri-error-warning-line' }
    ];
    
    eventsTimeline.innerHTML = events.map(event => `
      <div class="event-item">
        <div class="event-time">${event.time}</div>
        <div class="event-icon">
          <i class="${event.icon}"></i>
        </div>
        <div class="event-content">
          <h5 class="event-title">${event.title}</h5>
          <p class="event-description">${event.description}</p>
        </div>
      </div>
    `).join('');
  }

  // 初始化直播聊天
  function initLiveChat() {
    const chatMessages = qs('#chatMessages');
    const chatInput = qs('#chatInput');
    const sendBtn = qs('.send-btn');
    
    if (!chatMessages || !chatInput || !sendBtn) return;
    
    // 模擬聊天訊息
    const messages = [
      { username: '棒球迷A', text: '比賽開始了！', time: '19:05', type: 'user' },
      { username: '龍迷B', text: '加油！主隊必勝！', time: '19:06', type: 'user' },
      { username: '虎迷C', text: '客隊加油！', time: '19:07', type: 'user' },
      { username: '系統', text: '歡迎來到直播聊天室！', time: '19:08', type: 'system' },
      { username: '數據控D', text: '投手表現不錯，球速很快', time: '19:09', type: 'user' },
      { username: '棒球迷A', text: '這球打得好！', time: '19:10', type: 'user' },
      { username: '龍迷B', text: '主隊加油！', time: '19:11', type: 'user' },
      { username: '虎迷C', text: '客隊也要加油！', time: '19:12', type: 'user' }
    ];
    
    // 清空聊天室
    chatMessages.innerHTML = '';
    
    // 添加歡迎訊息
    addSystemMessage('歡迎來到直播聊天室！請遵守聊天規則。');
    
    // 添加歷史訊息
    messages.forEach(msg => {
      addChatMessage(msg.username, msg.text, msg.time, msg.type);
    });
    
    // 發送訊息
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // 自動滾動到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 添加聊天訊息
  function addChatMessage(username, text, time, type = 'user') {
    const chatMessages = qs('#chatMessages');
    if (!chatMessages) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${type === 'system' ? 'system' : ''} ${username === '我' ? 'own-message' : ''}`;
    
    if (type === 'system') {
      messageEl.innerHTML = `
        <div class="chat-avatar">
          <i class="ri-information-line"></i>
        </div>
        <div class="chat-content">
          <div class="chat-username">
            ${username}
            <span class="chat-time">${time}</span>
          </div>
          <p class="chat-text">${text}</p>
        </div>
      `;
    } else {
      messageEl.innerHTML = `
        <div class="chat-avatar">${username.charAt(0)}</div>
        <div class="chat-content">
          <div class="chat-username">
            ${username}
            <span class="chat-time">${time}</span>
          </div>
          <p class="chat-text">${text}</p>
        </div>
      `;
    }
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 添加系統訊息
  function addSystemMessage(text) {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    addChatMessage('系統', text, time, 'system');
  }

  // 發送聊天訊息
  function sendMessage() {
    const chatInput = qs('#chatInput');
    const chatMessages = qs('#chatMessages');
    
    if (!chatInput || !chatMessages || !chatInput.value.trim()) return;
    
    const text = chatInput.value.trim();
    const now = new Date();
    const time = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    
    // 添加用戶訊息
    addChatMessage('我', text, time, 'user');
    
    // 清空輸入框
    chatInput.value = '';
    
    // 模擬其他用戶回覆
    setTimeout(() => {
      const responses = [
        { username: '棒球迷A', text: '說得好！' },
        { username: '龍迷B', text: '同意你的觀點' },
        { username: '虎迷C', text: '比賽很精彩' },
        { username: '數據控D', text: '數據分析很準確' }
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const responseTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      addChatMessage(randomResponse.username, randomResponse.text, responseTime, 'user');
    }, 1000 + Math.random() * 2000);
  }

  // 初始化推薦區
  function initRecommendations() {
    initNewsCarousel();
    initAnalysisCarousel();
    initRankingsCarousel();
  }

  // 初始化新聞輪播
  function initNewsCarousel() {
    const carousel = qs('#newsCarousel');
    if (!carousel) return;

    const news = [
      {
        title: '中華隊在世界棒球經典賽中表現亮眼',
        excerpt: '中華隊在本次經典賽中展現出色的團隊合作精神，多位球員表現優異...',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400&auto=format&fit=crop',
        category: '國際賽事',
        date: '2024-03-15'
      },
      {
        title: '中職新球季開幕戰精彩回顧',
        excerpt: '本季開幕戰由衛冕軍對戰挑戰者，雙方激戰九局，最終以再見安打結束...',
        image: 'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=400&auto=format&fit=crop',
        category: '國內賽事',
        date: '2024-03-14'
      },
      {
        title: '投手防禦率排行榜最新統計',
        excerpt: '本週投手防禦率排行榜出爐，多位年輕投手表現突出，值得關注...',
        image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=400&auto=format&fit=crop',
        category: '數據分析',
        date: '2024-03-13'
      },
      {
        title: '棒球規則更新：本壘衝撞新規定',
        excerpt: 'MLB 宣布新的本壘衝撞規則，將於下個球季開始實施，影響深遠...',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400&auto=format&fit=crop',
        category: '規則更新',
        date: '2024-03-12'
      }
    ];

    carousel.innerHTML = news.map(item => `
      <div class="news-card" onclick="viewNews('${item.title}')">
        <img src="${item.image}" alt="${item.title}" class="news-image" />
        <div class="news-meta">
          <span class="news-category">${item.category}</span>
          <span>${item.date}</span>
        </div>
        <h4 class="news-title">${item.title}</h4>
        <p class="news-excerpt">${item.excerpt}</p>
      </div>
    `).join('');
  }

  // 初始化分析輪播
  function initAnalysisCarousel() {
    const carousel = qs('#analysisCarousel');
    if (!carousel) return;

    const analyses = [
      {
        title: '投手球種分析',
        description: '深入分析各隊投手的球種配比與效果',
        icon: 'ri-baseball-bat-line',
        stats: [
          { value: '85%', label: '準確率' },
          { value: '12.5', label: 'K/9' }
        ]
      },
      {
        title: '打擊熱區分析',
        description: '分析打者的擊球熱區與投手配球策略',
        icon: 'ri-target-line',
        stats: [
          { value: '0.285', label: '打擊率' },
          { value: '0.845', label: 'OPS' }
        ]
      },
      {
        title: '守備效率分析',
        description: '評估各隊守備效率與失誤率統計',
        icon: 'ri-shield-check-line',
        stats: [
          { value: '0.986', label: '守備率' },
          { value: '12', label: '助殺' }
        ]
      },
      {
        title: '跑壘速度分析',
        description: '分析球員跑壘速度與盜壘成功率',
        icon: 'ri-speed-up-line',
        stats: [
          { value: '3.2s', label: '一壘時間' },
          { value: '85%', label: '盜壘率' }
        ]
      }
    ];

    carousel.innerHTML = analyses.map(item => `
      <div class="analysis-card" onclick="viewAnalysis('${item.title}')">
        <div class="analysis-icon">
          <i class="${item.icon}"></i>
        </div>
        <h4 class="analysis-title">${item.title}</h4>
        <p class="analysis-description">${item.description}</p>
        <div class="analysis-stats">
          ${item.stats.map(stat => `
            <div class="analysis-stat">
              <div class="analysis-stat-value">${stat.value}</div>
              <div class="analysis-stat-label">${stat.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // 初始化排行輪播
  function initRankingsCarousel() {
    const carousel = qs('#rankingsCarousel');
    if (!carousel) return;

    const rankings = [
      {
        position: 1,
        team: 'Dragons',
        record: '32勝 18負',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        stats: [
          { value: '0.268', label: '打擊率' },
          { value: '112', label: '全壘打' },
          { value: '0.986', label: '守備率' }
        ]
      },
      {
        position: 2,
        team: 'Tigers',
        record: '29勝 21負',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        stats: [
          { value: '0.254', label: '打擊率' },
          { value: '98', label: '全壘打' },
          { value: '0.981', label: '守備率' }
        ]
      },
      {
        position: 3,
        team: 'Eagles',
        record: '27勝 23負',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        stats: [
          { value: '0.261', label: '打擊率' },
          { value: '105', label: '全壘打' },
          { value: '0.983', label: '守備率' }
        ]
      },
      {
        position: 4,
        team: 'Lions',
        record: '25勝 25負',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Baseball_%28crop%29.jpg',
        stats: [
          { value: '0.248', label: '打擊率' },
          { value: '89', label: '全壘打' },
          { value: '0.978', label: '守備率' }
        ]
      }
    ];

    carousel.innerHTML = rankings.map(item => `
      <div class="ranking-card" onclick="viewTeamRanking('${item.team}')">
        <div class="ranking-header">
          <div class="ranking-position ${item.position === 1 ? 'gold' : item.position === 2 ? 'silver' : item.position === 3 ? 'bronze' : ''}">
            ${item.position}
          </div>
          <div class="team-info-ranking">
            <h4 class="team-name-ranking">${item.team}</h4>
            <p class="team-record-ranking">${item.record}</p>
          </div>
          <img src="${item.logo}" alt="${item.team}" class="team-logo" style="width: 32px; height: 32px; border-radius: 50%;" />
        </div>
        <div class="ranking-stats">
          ${item.stats.map(stat => `
            <div class="ranking-stat">
              <div class="ranking-stat-value">${stat.value}</div>
              <div class="ranking-stat-label">${stat.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // 初始化頁尾
  function initFooter() {
    // 設定年份
    const yearEl = qs('#currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  // 查看新聞詳情
  window.viewNews = function(title) {
    console.log('查看新聞:', title);
    alert(`查看新聞：${title}`);
  };

  // 查看分析詳情
  window.viewAnalysis = function(title) {
    console.log('查看分析:', title);
    alert(`查看分析：${title}`);
  };

  // 查看球隊排行詳情
  window.viewTeamRanking = function(team) {
    console.log('查看球隊排行:', team);
    alert(`查看 ${team} 球隊詳情`);
  };

  // 載入動畫 CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}); 