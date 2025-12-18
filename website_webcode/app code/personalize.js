document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);
  const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  initYear();
  initLazyImages();
  initProfile();
  initRecommendations();
  initDataWall();
  initInteract();
  initGoals();
  initThemeTools();
  initDiary();
  initAnimations();
  initBaseballEffects();
  initPersonalStadium();
  initHeaderEnhancements();

  function initYear(){ const y = qs('#year'); if(y) y.textContent = new Date().getFullYear(); }

  function initLazyImages(){
    const lazyImgs = qsa('img.lazy');
    const onLoad = (img) => () => img.classList.add('is-loaded');
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            const img = entry.target; const src = img.getAttribute('data-src');
            if(src){ img.src = src; }
            img.addEventListener('load', onLoad(img), { once: true });
            obs.unobserve(img);
          }
        })
      }, { rootMargin: '120px' });
      lazyImgs.forEach(img => io.observe(img));
    } else {
      lazyImgs.forEach(img => { const src = img.getAttribute('data-src'); if(src){ img.src = src; } img.addEventListener('load', onLoad(img), { once:true }); })
    }
  }

  function initProfile(){
    const KEY = 'proball-user-profile';
    const data = safeParse(localStorage.getItem(KEY)) || {
      nickname: '球迷高手',
      slogan: 'Never Strike Out! ⚡',
      favoriteTeam: {
        name: 'New York Yankees',
        logo: 'https://upload.wikimedia.org/wikipedia/en/e/ea/New_York_Yankees_logo.svg',
        colors: { primary: '27, 55, 89', accent: '196, 206, 211' } // 洋基藍與銀
      },
      avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop',
      achievements: { games: 50, players: 10, streak: 7 }
    };

    const nicknameEl = qs('#userNickname');
    const sloganEl = qs('#userSlogan');
    const teamLogoEl = qs('#favTeamLogo');
    const teamNameEl = qs('#favTeamName');
    const avatarEl = qs('#profileAvatar');
    const gamesEl = qs('#achvGames');
    const playersEl = qs('#achvPlayers');
    const streakEl = qs('#achvStreak');

    if(nicknameEl) nicknameEl.textContent = data.nickname;
    if(sloganEl) sloganEl.textContent = data.slogan;
    if(teamLogoEl) teamLogoEl.setAttribute('data-src', data.favoriteTeam.logo);
    if(teamNameEl) teamNameEl.textContent = data.favoriteTeam.name;
    if(avatarEl) avatarEl.setAttribute('data-src', data.avatar);

    // 應用球隊色彩
    applyTeamColors(data.favoriteTeam.colors);

    // 更新 Header 頭像與徽章
    const headerAvatar = qs('#headerAvatar');
    const headerTeamBadge = qs('#headerTeamBadge');
    if(headerAvatar) headerAvatar.src = data.avatar;
    if(headerTeamBadge) headerTeamBadge.src = data.favoriteTeam.logo;

    initLazyImages();
    if(gamesEl) animateCounter(gamesEl, data.achievements.games, 800);
    if(playersEl) animateCounter(playersEl, data.achievements.players, 800);
    if(streakEl) animateCounter(streakEl, data.achievements.streak, 800);
  }

  function animateCounter(el, to, duration=800){
    const from = parseInt(el.textContent || '0', 10) || 0;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const v = Math.round(from + (to - from) * ease(p));
      el.textContent = String(v);
      if(p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initRecommendations(){
    const grid = qs('#recommendGrid');
    if(!grid) return;
    const cards = [
      { title: '為你推薦：本週必看對戰', meta: '依喜好球隊 & 近期表現' },
      { title: '你的球員收藏：最新動態', meta: '3 位球員有新數據' },
      { title: '相似球迷也在看', meta: '熱門精選賽事與分析' }
    ];
    grid.innerHTML = cards.map(c => `
      <article class="recommend-card">
        <div class="title">${c.title}</div>
        <div class="meta">${c.meta}</div>
      </article>
    `).join('');
  }

  function safeParse(s){ try{ return JSON.parse(s || '') } catch{ return null } }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // --- Data Wall ---
  function initDataWall(){
    buildPlayerTrack();
    buildRecentMatches();
    buildTeamWinLine();
    qs('#syncDataBtn')?.addEventListener('click', () => {
      buildPlayerTrack(true); buildRecentMatches(true); buildTeamWinLine(true);
    });
  }
  function buildPlayerTrack(refresh=false){
    const key = 'pb-fav-players';
    const sample = [
      { name:'Sho Tanaka', avatar:'https://images.unsplash.com/photo-1532634732-8b9fb99825fb?q=80&w=300&auto=format&fit=crop', stats:{ AVG:.321, HR:18, ERA:2.85 } },
      { name:'A. Chen', avatar:'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=300&auto=format&fit=crop', stats:{ AVG:.288, HR:12, ERA:3.12 } },
      { name:'K. Lin', avatar:'https://images.unsplash.com/photo-1521417531048-9b7e1b6c6d51?q=80&w=300&auto=format&fit=crop', stats:{ AVG:.275, HR:9, ERA:3.45 } }
    ];
    const data = refresh ? sample : (safeParse(localStorage.getItem(key)) || sample);
    const wrap = qs('#playerTrack'); if(!wrap) return;
    wrap.innerHTML = data.map(p => `
      <article class="player-card-mini" role="listitem">
        <div class="meta">
          <img class="avatar" src="${p.avatar}" alt="${p.name}" />
          <div class="name">${p.name}</div>
        </div>
        <div class="stats">
          <span>AVG <strong>${p.stats.AVG.toFixed(3)}</strong></span>
          <span>HR <strong>${p.stats.HR}</strong></span>
          <span>ERA <strong>${p.stats.ERA.toFixed(2)}</strong></span>
        </div>
      </article>
    `).join('');
    if(refresh) save(key, data);
    // 添加進入動畫
    setTimeout(() => {
      wrap.querySelectorAll('.player-card-mini').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 100);
      });
    }, 50);
  }
  function buildRecentMatches(refresh=false){
    const key = 'pb-recent-matches';
    const sample = [
      { date:'2025-07-21', home:'DRG', away:'TIG', score:'5:4', clip:'8局下二壘安打' },
      { date:'2025-06-02', home:'DRG', away:'TIG', score:'2:3', clip:'再見安打' },
      { date:'2025-05-12', home:'DRG', away:'TIG', score:'7:1', clip:'三支全壘打' }
    ];
    const list = refresh ? sample : (safeParse(localStorage.getItem(key)) || sample);
    const wrap = qs('#recentMatches'); if(!wrap) return;
    wrap.innerHTML = list.map(m => `
      <div class="match-item" role="listitem">
        <div class="teams"><span>${m.home}</span><span class="score">${m.score}</span><span>${m.away}</span></div>
        <div class="meta">${m.date} · ${m.clip}</div>
      </div>
    `).join('');
    if(refresh) save(key, list);
  }
  function buildTeamWinLine(refresh=false){
    const key = 'pb-team-win-line';
    const sample = Array.from({length:14}, (_,i)=> 40 + Math.round(Math.sin(i/2)*15 + i*1.2));
    const data = refresh ? sample : (safeParse(localStorage.getItem(key)) || sample);
    const canvas = qs('#teamWinline'); if(!canvas) return;
    const color = getComputedStyle(document.body).getPropertyValue('--chart-home') || '#2563eb';
    const grid = getComputedStyle(document.body).getPropertyValue('--chart-grid') || 'rgba(0,0,0,.1)';
    // dispose old
    if(canvas._chart){ try{ canvas._chart.destroy(); }catch{} }
    canvas._chart = new Chart(canvas, {
      type:'line', data:{ labels: data.map((_,i)=>`W${i+1}`), datasets:[{ data, borderColor: color.trim(), backgroundColor: 'transparent', tension:.3, fill:false }] },
      options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color: grid.trim() } }, y:{ grid:{ color: grid.trim() } } }, animation:{ duration:700 } }
    });
    if(refresh) save(key, data);
  }

  // --- Interact ---
  function initInteract(){
    const cKey = 'pb-comment-wall';
    const chatKey = 'pb-fan-chat';
    const ptsKey = 'pb-points';
    const badgeKey = 'pb-point-badges';
    const wall = qs('#commentWall');
    const fan = qs('#fanChat');
    const scoreEl = qs('#pointScore');
    const badgesEl = qs('#pointBadges');
    // init
    renderComments(safeParse(localStorage.getItem(cKey)) || []);
    renderChat(safeParse(localStorage.getItem(chatKey)) || []);
    const pts = Number(localStorage.getItem(ptsKey) || '0');
    scoreEl && (scoreEl.textContent = String(pts));
    renderBadges(safeParse(localStorage.getItem(badgeKey)) || []);
    // events
    qs('#sendComment')?.addEventListener('click', () => {
      const input = qs('#commentText'); const text = input.value.trim(); if(!text) return;
      const list = (safeParse(localStorage.getItem(cKey)) || []);
      list.push({ role:'me', text, t: Date.now() }); save(cKey, list); renderComments(list); input.value='';
      addPoints(2);
    });
    qs('#sendChat')?.addEventListener('click', () => {
      const input = qs('#chatText'); const text = input.value.trim(); if(!text) return;
      const list = (safeParse(localStorage.getItem(chatKey)) || []);
      list.push({ fan:true, text, t: Date.now() }); save(chatKey, list); renderChat(list); input.value='';
      addPoints(1);
    });
    qs('#ptWatch')?.addEventListener('click', () => addPoints(5));
    qs('#ptComment')?.addEventListener('click', () => addPoints(2));
    qs('#ptShare')?.addEventListener('click', () => addPoints(3));

    function renderComments(items){
      if(!wall) return;
      wall.innerHTML = items.slice(-50).map(m => commentView(m)).join('');
      wall.scrollTop = wall.scrollHeight;
      // 添加最新留言的動畫
      const lastComment = wall.lastElementChild;
      if(lastComment){
        lastComment.style.opacity = '0';
        lastComment.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          lastComment.style.transition = 'all 0.4s ease';
          lastComment.style.opacity = '1';
          lastComment.style.transform = 'translateX(0)';
        }, 50);
      }
    }
    function renderChat(items){
      if(!fan) return;
      fan.innerHTML = items.slice(-50).map(m => chatView(m)).join('');
      fan.scrollTop = fan.scrollHeight;
      // 添加最新聊天的動畫
      const lastChat = fan.lastElementChild;
      if(lastChat){
        lastChat.style.opacity = '0';
        lastChat.style.transform = 'translateX(20px)';
        setTimeout(() => {
          lastChat.style.transition = 'all 0.4s ease';
          lastChat.style.opacity = '1';
          lastChat.style.transform = 'translateX(0)';
        }, 50);
      }
    }
    function commentView(m){ return `<div class="comment"><div class="avatar">我</div><div class="bubble">${escapeHtml(m.text)}</div></div>`; }
    function chatView(m){ return `<div class="comment"><div class="avatar">粉</div><div class="bubble">${escapeHtml(m.text)}</div></div>`; }
    function addPoints(delta){
      const val = Number(localStorage.getItem(ptsKey) || '0') + delta;
      localStorage.setItem(ptsKey, String(val));
      // 數字動畫更新
      if(scoreEl) animateCounter(scoreEl, val, 600);
      const earned = [];
      if(val >= 10) earned.push('新秀徽章');
      if(val >= 25) earned.push('先發徽章');
      if(val >= 50) earned.push('明星徽章');
      save(badgeKey, earned); renderBadges(earned);
    }
    function renderBadges(arr){ if(!badgesEl) return; badgesEl.innerHTML = arr.map(b => `<span class="badge-chip"><i class="ri-medal-2-line"></i>${b}</span>`).join(''); }
  }

  // --- Goals ---
  function initGoals(){
    const key = 'pb-goals';
    const sample = [
      { id:'g1', title:'本週挑戰：看 3 場比賽', progress:1, total:3 },
      { id:'g2', title:'最愛球員擊出全壘打', progress:0, total:1 },
    ];
    const list = safeParse(localStorage.getItem(key)) || sample;
    const grid = qs('#goalGrid'); if(!grid) return;
    const render = () => { grid.innerHTML = list.map(g => goalView(g)).join(''); };
    render();
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.done'); if(!btn) return; const id = btn.dataset.id;
      const item = list.find(x=>x.id===id); if(!item) return; item.progress = item.total; save(key, list); render(); celebrate();
    });
  }
  function goalView(g){ const done = g.progress >= g.total; const pct = Math.round(100 * g.progress / g.total);
    return `<article class="goal-card"><div class="title">🎯 ${g.title}</div><div class="progress">${pct}%</div>${done?'<span class="badge-chip">完成</span>':`<button class="done" data-id="${g.id}">完成</button>`}</article>`; }
  function celebrate(){
    const c = qs('#celebrate');
    if(!c) return;
    c.removeAttribute('hidden');
    // 添加音效模擬和額外視覺效果
    createFireworks();
    setTimeout(()=> c.setAttribute('hidden',''), 800);
  }

  // --- Theme Tools ---
  function initThemeTools(){
    const sw = qs('#swatches');
    sw?.addEventListener('click', (e) => {
      const b = e.target.closest('.swatch'); if(!b) return;
      const p = b.dataset.primary, s = b.dataset.secondary; if(!p||!s) return;
      document.body.style.setProperty('--primary', p);
      document.body.style.setProperty('--primary-2', s);
    });
    qsa('.backgrounds .btn').forEach(btn => btn.addEventListener('click', ()=> applyBg(btn.dataset.bg)));
    qs('#modeToggle')?.addEventListener('click', () => {
      const dark = document.body.classList.toggle('theme-dark');
      document.body.classList.toggle('theme-light', !dark);
    });
  }
  function applyBg(name){
    const map = {
      grass: 'radial-gradient(1000px 700px at 20% -10%, rgba(34,197,94,.18), transparent 55%)',
      mound: 'radial-gradient(1000px 700px at 20% -10%, rgba(245,158,11,.18), transparent 55%)',
      stands: 'radial-gradient(1000px 700px at 20% -10%, rgba(59,130,246,.18), transparent 55%)'
    };
    document.body.style.setProperty('--bg-accent-1', map[name] ? 'transparent' : '');
    const bg = qs('.bg-canvas'); if(bg){ bg.style.background = `${map[name] || ''}, var(--bg)`; }
  }

  // --- Diary ---
  function initDiary(){
    const key = 'pb-diary';
    const list = safeParse(localStorage.getItem(key)) || [];
    const wrap = qs('#diaryList'); const text = qs('#diaryText'); const file = qs('#diaryImage');
    const render = () => { if(!wrap) return; wrap.innerHTML = list.slice().reverse().map(item => diaryCard(item)).join(''); };
    render();
    qs('#saveDiary')?.addEventListener('click', async () => {
      const content = (text.value || '').trim(); if(!content && !file.files?.length) return;
      let url = '';
      if(file.files && file.files[0]){ url = await toDataUrl(file.files[0]); }
      list.push({ id: Date.now(), content, url, t: new Date().toISOString() }); save(key, list); text.value=''; if(file) file.value=''; render();
    });
  }
  function diaryCard(d){ return `<article class="diary-card">${d.url?`<img src="${d.url}" alt="diary">`:''}<div class="text">${escapeHtml(d.content)}</div></article>`; }
  function toDataUrl(file){ return new Promise(res => { const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(file); }); }

  // --- Animations ---
  function initAnimations(){
    // 頁面載入動畫
    setTimeout(() => {
      document.querySelectorAll('.personal-hero, .wall-block, .panel, .goal-card').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        setTimeout(() => {
          el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * 200);
      });
    }, 300);

    // 滾動觸發動畫
    const observeElements = document.querySelectorAll('.recommend-card, .diary-card');
    if('IntersectionObserver' in window && observeElements.length > 0){
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      observeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
      });
    }

    // 懸停視差效果
    document.querySelectorAll('.profile, .achv-card, .wall-block').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -5;
        const rotateY = (x - centerX) / centerX * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // 點擊漣漪效果
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .chip, .swatch');
      if(!target) return;

      const ripple = document.createElement('span');
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      target.style.position = 'relative';
      target.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
        if(target.querySelectorAll('.ripple').length === 0){
          style.remove();
        }
      }, 600);
    });
  }

  // --- Baseball Effects ---
  function initBaseballEffects(){
    createParticleSystem();
    enhanceBaseballInteractions();
    addStadiumSounds();
  }

  function createParticleSystem(){
    const container = qs('#particleSystem');
    if(!container) return;
    
    // 創建粒子
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // 隨機位置和屬性
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight + 10;
      const size = Math.random() * 3 + 2;
      const duration = Math.random() * 10 + 10;
      const drift = (Math.random() - 0.5) * 200;
      
      particle.style.cssText = `
        left: ${startX}px;
        top: ${startY}px;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        --drift: ${drift}px;
      `;
      
      // 隨機顏色（棒球主題）
      const colors = ['#ffffff', '#22c55e', '#16a34a', '#f59e0b'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      container.appendChild(particle);
      
      // 清理
      setTimeout(() => {
        if(particle.parentNode) particle.remove();
      }, duration * 1000);
    };
    
    // 定期創建粒子
    setInterval(createParticle, 800);
    
    // 初始粒子
    for(let i = 0; i < 10; i++){
      setTimeout(createParticle, i * 200);
    }
  }

  function enhanceBaseballInteractions(){
    // 增強點擊效果
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.achv-card, .goal-card, .player-card-mini');
      if(!target) return;
      
      // 創建棒球爆炸效果
      createBaseballBurst(e.clientX, e.clientY);
    });
    
    // 增強懸停效果
    document.querySelectorAll('.profile, .wall-block, .panel').forEach(card => {
      card.addEventListener('mouseenter', () => {
        createSparkles(card);
      });
    });
  }

  function createBaseballBurst(x, y){
    const burst = document.createElement('div');
    burst.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 9999;
    `;
    
    // 創建多個小球
    for(let i = 0; i < 8; i++){
      const ball = document.createElement('div');
      const angle = (i / 8) * Math.PI * 2;
      const distance = 60;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      
      ball.textContent = '⚾';
      ball.style.cssText = `
        position: absolute;
        font-size: 16px;
        transform: translate(-50%, -50%);
        animation: burstBall 0.8s ease-out forwards;
        --endX: ${endX}px;
        --endY: ${endY}px;
      `;
      
      burst.appendChild(ball);
    }
    
    // 添加樣式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes burstBall {
        0% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translate(calc(-50% + var(--endX)), calc(-50% + var(--endY))) scale(0.3) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(burst);
    
    setTimeout(() => {
      burst.remove();
      style.remove();
    }, 800);
  }

  function createSparkles(element){
    const rect = element.getBoundingClientRect();
    
    for(let i = 0; i < 5; i++){
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.textContent = '✨';
        sparkle.style.cssText = `
          position: fixed;
          left: ${rect.left + Math.random() * rect.width}px;
          top: ${rect.top + Math.random() * rect.height}px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          animation: sparkle 1s ease-out forwards;
        `;
        
        document.body.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
      }, i * 100);
    }
    
    // 添加閃爍動畫
    if(!document.querySelector('#sparkleStyle')){
      const style = document.createElement('style');
      style.id = 'sparkleStyle';
      style.textContent = `
        @keyframes sparkle {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function addStadiumSounds(){
    // 模擬音效（視覺反饋）
    const soundEffects = {
      homerun: () => createSoundWave('🎆'),
      cheer: () => createSoundWave('👏'),
      whistle: () => createSoundWave('💨')
    };
    
    // 綁定音效觸發
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn-accent');
      if(target) soundEffects.homerun();
    });
    
    // 成就完成音效
    const originalCelebrate = window.celebrate;
    if(typeof celebrate === 'function'){
      window.celebrate = function(){
        soundEffects.cheer();
        originalCelebrate();
      };
    }
  }

  function createSoundWave(emoji){
    const wave = document.createElement('div');
    wave.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      pointer-events: none;
      z-index: 9999;
      animation: soundWave 1s ease-out forwards;
    `;
    wave.textContent = emoji;
    
    document.body.appendChild(wave);
    
    // 添加聲波動畫
    if(!document.querySelector('#soundWaveStyle')){
      const style = document.createElement('style');
      style.id = 'soundWaveStyle';
      style.textContent = `
        @keyframes soundWave {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => wave.remove(), 1000);
  }

  function createFireworks(){
    // 創建煙火效果
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
    const fireworksContainer = document.createElement('div');
    fireworksContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(fireworksContainer);

    for(let i = 0; i < 15; i++){
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.style.cssText = `
          position: absolute;
          width: 6px;
          height: 6px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: firework 1s ease-out forwards;
        `;

        fireworksContainer.appendChild(firework);

        setTimeout(() => firework.remove(), 1000);
      }, i * 100);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes firework {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.5) rotate(180deg);
          opacity: 0.8;
        }
        100% {
          transform: scale(0.5) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      fireworksContainer.remove();
      style.remove();
    }, 2000);
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c)); }

  // --- Personal Stadium ---
  function initPersonalStadium(){
    createDynamicWelcomeMessage();
    enhanceStadiumAtmosphere();
  }

  function initHeaderEnhancements(){
    // 跑馬燈插入暱稱
    const marquee = qs('#welcomeMarquee');
    const profile = safeParse(localStorage.getItem('proball-user-profile'));
    const name = profile?.nickname || qs('#userNickname')?.textContent || '球迷高手';
    if(marquee){
      marquee.textContent = `WELCOME TO YOUR PERSONAL STADIUM, ${name}!`;
    }

    // 快速搜尋：支援球隊/球員/賽事（目前 console 導向，可再整合路由）
    const input = qs('#prefSearchInput');
    input?.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){
        const q = input.value.trim();
        if(!q) return;
        // 簡單判定：含 vs 或 : 判斷為賽事；含 # 或 數字為球員背號（示例）
        let type = 'player';
        if(/vs|:/.test(q.toLowerCase())) type = 'match';
        else if(/fc|cpbl|npb|mlb|隊|隊伍|team/i.test(q)) type = 'team';
        console.log('[Search]', { query: q, type });
      }
    });
  }

  function applyTeamColors(colors){
    if(!colors) return;
    
    // 設定 CSS 變數
    document.body.style.setProperty('--team-color-rgb', colors.primary);
    document.body.style.setProperty('--team-accent-rgb', colors.accent);
    
    // 更新圖表顏色
    setTimeout(() => {
      buildTeamWinLine(true);
    }, 500);
  }

  function createDynamicWelcomeMessage(){
    const messages = [
      'WELCOME TO YOUR PERSONAL STADIUM',
      '歡迎來到你的專屬球場',
      'YOUR BASEBALL KINGDOM AWAITS',
      '你的棒球王國等著你',
      'HOME RUN TO YOUR DREAMS',
      '全壘打向你的夢想'
    ];
    
    const scoreboardText = qs('.scoreboard-text');
    if(!scoreboardText) return;
    
    let currentIndex = 0;
    
    // 每次跑馬燈完成後切換訊息
    setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      scoreboardText.textContent = messages[currentIndex];
    }, 20000); // 配合跑馬燈 20 秒週期
  }

  function enhanceStadiumAtmosphere(){
    // 隨機改變粒子顏色
    const originalCreateParticle = createParticleSystem;
    
    // 增強粒子效果
    setInterval(() => {
      const container = qs('#particleSystem');
      if(!container) return;
      
      // 偶爾創建特殊粒子
      if(Math.random() < 0.3){
        createSpecialParticle(container);
      }
    }, 2000);
    
    // 增強球場氛圍音效
    addCrowdCheerEffects();
  }

  function createSpecialParticle(container){
    const particle = document.createElement('div');
    particle.textContent = ['⚾', '🏟️', '⭐', '🎆'][Math.floor(Math.random() * 4)];
    
    const startX = Math.random() * window.innerWidth;
    const startY = window.innerHeight + 10;
    const duration = Math.random() * 8 + 12;
    
    particle.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      font-size: ${Math.random() * 8 + 16}px;
      opacity: 0.8;
      pointer-events: none;
      z-index: -1;
      animation: specialParticleFloat ${duration}s linear forwards;
    `;
    
    container.appendChild(particle);
    
    // 添加特殊粒子動畫
    if(!document.querySelector('#specialParticleStyle')){
      const style = document.createElement('style');
      style.id = 'specialParticleStyle';
      style.textContent = `
        @keyframes specialParticleFloat {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
            transform: scale(1);
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg) scale(1.2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      if(particle.parentNode) particle.remove();
    }, duration * 1000);
  }

  function addCrowdCheerEffects(){
    // 隨機群眾歡呼效果
    setInterval(() => {
      if(Math.random() < 0.1){ // 10% 機率
        createCrowdCheer();
      }
    }, 15000);
  }

  function createCrowdCheer(){
    const cheers = ['👏', '🙌', '🎉', '📣', '🔥'];
    const positions = [
      { x: '15%', y: '25%' },
      { x: '85%', y: '30%' },
      { x: '25%', y: '75%' },
      { x: '75%', y: '70%' },
      { x: '50%', y: '85%' }
    ];
    
    positions.forEach((pos, i) => {
      setTimeout(() => {
        const cheer = document.createElement('div');
        cheer.textContent = cheers[Math.floor(Math.random() * cheers.length)];
        cheer.style.cssText = `
          position: fixed;
          left: ${pos.x};
          top: ${pos.y};
          font-size: 24px;
          pointer-events: none;
          z-index: 1000;
          animation: crowdCheer 2s ease-out forwards;
        `;
        
        document.body.appendChild(cheer);
        setTimeout(() => cheer.remove(), 2000);
      }, i * 200);
    });
    
    // 添加群眾歡呼動畫
    if(!document.querySelector('#crowdCheerStyle')){
      const style = document.createElement('style');
      style.id = 'crowdCheerStyle';
      style.textContent = `
        @keyframes crowdCheer {
          0% {
            transform: scale(0.5) translateY(0);
            opacity: 0;
          }
          20% {
            transform: scale(1.2) translateY(-10px);
            opacity: 1;
          }
          80% {
            transform: scale(1) translateY(-5px);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-20px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}); 