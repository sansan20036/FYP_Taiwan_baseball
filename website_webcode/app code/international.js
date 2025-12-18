document.addEventListener('DOMContentLoaded', () => {
  initYear();
  renderUpcoming();
  renderRanking();
  renderVideos();
  initVote();
  initComments();
  renderRecs();
});

// 語言切換（簡化：僅記錄選擇）
(function initLang(){
  const box = document.querySelector('.lang-switch');
  if(!box) return;
  const saved = localStorage.getItem('intl_lang');
  if(saved){
    box.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active', b.dataset.lang===saved));
  }
  box.addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    box.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    localStorage.setItem('intl_lang', btn.dataset.lang);
    toast('已切換語言：' + btn.textContent.trim());
  });
})();

// CTA 提示
['followBtn','ticketBtn','remindBtn'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('click', ()=>{
    el.classList.add('ripple'); setTimeout(()=>el.classList.remove('ripple'), 300);
    const map = { followBtn:'已加入追蹤', ticketBtn:'前往購票（示意）', remindBtn:'已設定提醒' };
    toast(map[id]);
  });
});

// 即將比賽 搜尋/篩選/排序
(function initControls(){
  const list = document.getElementById('upcomingList');
  const q = document.getElementById('ctrlSearch');
  const region = document.getElementById('ctrlFilterRegion');
  const sort = document.getElementById('ctrlSort');
  if(!list || !q || !region || !sort) return;

  const data = getUpcomingData();
  const render = () => {
    const keyword = (q.value||'').toLowerCase();
    const r = region.value;
    let items = data.filter(d =>
      (r==='all' || d.region===r) &&
      (d.home.toLowerCase().includes(keyword) || d.away.toLowerCase().includes(keyword) || d.venue.toLowerCase().includes(keyword))
    );
    if(sort.value==='hot') items.sort((a,b)=>b.hot-a.hot);
    if(sort.value==='time') items.sort((a,b)=>a.order-b.order);
    if(sort.value==='alpha') items.sort((a,b)=> (a.home+a.away).localeCompare(b.home+b.away));
    list.innerHTML = items.map(m => `
      <article class="card tilt">
        <div class="head"><strong>${m.home}</strong> <span class="vs">vs</span> <strong>${m.away}</strong></div>
        <div class="meta"><i class="ri-time-line"></i>${m.time} <span>•</span> <i class="ri-map-pin-2-line"></i>${m.venue} <span class="hot">🔥 ${m.hot}</span></div>
        <div class="actions"><button class="btn btn-primary">追蹤</button> <button class="btn">提醒</button></div>
      </article>
    `).join('');
  };
  [q,region,sort].forEach(el=> el.addEventListener('input', render));
  render();
})();

function getUpcomingData(){
  return [
    { home:'🇩🇴 多明尼加', away:'🇻🇪 委內瑞拉', time:'今晚 19:00', venue:'邁阿密', hot:89, region:'americas', order:2 },
    { home:'🇹🇼 台灣', away:'🇰🇷 韓國', time:'明日 18:30', venue:'台北大巨蛋', hot:95, region:'asia', order:1 },
    { home:'🇯🇵 日本', away:'🇲🇽 墨西哥', time:'週六 17:00', venue:'東京巨蛋', hot:82, region:'asia', order:3 },
    { home:'🇺🇸 美國', away:'🇨🇺 古巴', time:'週日 20:00', venue:'洛杉磯道奇球場', hot:76, region:'americas', order:4 }
  ];
}

// 世界排名：排序與數字動畫
(function enhanceRank(){
  const table = document.getElementById('rankTable');
  if(!table || !table.tBodies[0]) return;
  // 點表頭排序
  table.addEventListener('click', (e)=>{
    const th = e.target.closest('th');
    if(!th) return;
    const idx = [...th.parentNode.children].indexOf(th);
    const rows = [...table.querySelectorAll('tr')].slice(1);
    const asc = !th.classList.contains('asc');
    table.querySelectorAll('th').forEach(x=>x.classList.remove('asc','desc'));
    th.classList.add(asc?'asc':'desc');
    rows.sort((a,b)=>{
      const av = a.children[idx].textContent.replace(/[% ,]/g,'');
      const bv = b.children[idx].textContent.replace(/[% ,]/g,'');
      const na = Number(av), nb = Number(bv);
      if(!Number.isNaN(na) && !Number.isNaN(nb)) return asc? na-nb : nb-na;
      return asc? av.localeCompare(bv) : bv.localeCompare(av);
    });
    rows.forEach(r=>table.tBodies[0].appendChild(r));
  });
  // 勝率數字小動畫
  table.querySelectorAll('tr td:nth-child(3)').forEach(td=>{
    const val = Number(td.textContent.replace('%','')) || 0; td.textContent = '0%';
    animateNumber(td, val, '%');
  });
})();

function animateNumber(el, target, suffix=''){
  const start = performance.now();
  const dur = 800; const from = 0;
  const tick = (t)=>{
    const p = Math.min(1, (t-start)/dur);
    const v = Math.round((from + (target-from)*p)*10)/10;
    el.textContent = v + (suffix||'');
    if(p<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 投票進度動畫（保留原有邏輯，加入平滑 bar 動畫與鎖定）
(function enhanceVote(){
  const box = document.getElementById('voteOptions');
  const result = document.getElementById('voteResult');
  if(!box || !result) return;
  let locked = false;
  box.addEventListener('click', (e)=>{
    if(locked) return;
    const btn = e.target.closest('button'); if(!btn) return;
    locked = true; [...box.querySelectorAll('button')].forEach(b=>b.disabled=true);
    // 觸發原本點擊（由 initVote 綁定）。若不存在，這段可視為冗餘保護
    btn.click && btn.click();
  }, true);

  // 監聽結果區域變化，為 bar 加上轉場
  const mo = new MutationObserver(()=>{
    const bar = result.querySelector('.vote__bar');
    if(bar){ bar.style.transition = 'width .6s ease'; }
  });
  mo.observe(result, { childList:true });
})();

// Toast
function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg; el.hidden=false;
  requestAnimationFrame(()=> el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.hidden=true, 250); }, 1800);
}

function initYear(){
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
}

function renderUpcoming(){
  const list = document.getElementById('upcomingList');
  if(!list) return;
  const matches = [
    { home:'🇩🇴 多明尼加', away:'🇻🇪 委內瑞拉', time:'今晚 19:00', venue:'邁阿密', hot:89 },
    { home:'🇹🇼 台灣', away:'🇰🇷 韓國', time:'明日 18:30', venue:'台北大巨蛋', hot:95 },
    { home:'🇯🇵 日本', away:'🇲🇽 墨西哥', time:'週六 17:00', venue:'東京巨蛋', hot:82 },
    { home:'🇺🇸 美國', away:'🇨🇺 古巴', time:'週日 20:00', venue:'洛杉磯道奇球場', hot:76 }
  ];
  list.innerHTML = matches.map(m => `
    <article class="card">
      <div class="head"><strong>${m.home}</strong> <span class="vs">vs</span> <strong>${m.away}</strong></div>
      <div class="meta"><i class="ri-time-line"></i>${m.time} <span>•</span> <i class="ri-map-pin-2-line"></i>${m.venue} <span class="hot">🔥 ${m.hot}</span></div>
      <div class="actions"><button class="btn btn-primary">追蹤</button> <button class="btn">提醒</button></div>
    </article>
  `).join('');
}

function renderRanking(){
  const table = document.getElementById('rankTable');
  if(!table) return;
  const ranks = [
    { flag:'🇯🇵', country:'日本', win:0.78, pts:2980 },
    { flag:'🇺🇸', country:'美國', win:0.74, pts:2890 },
    { flag:'🇰🇷', country:'韓國', win:0.70, pts:2710 },
    { flag:'🇲🇽', country:'墨西哥', win:0.69, pts:2640 },
    { flag:'🇻🇪', country:'委內瑞拉', win:0.66, pts:2588 },
    { flag:'🇩🇴', country:'多明尼加', win:0.65, pts:2541 },
    { flag:'🇹🇼', country:'中華台北', win:0.62, pts:2480 },
    { flag:'🇨🇺', country:'古巴', win:0.60, pts:2422 },
    { flag:'🇳🇱', country:'荷蘭', win:0.58, pts:2370 },
    { flag:'🇵🇷', country:'波多黎各', win:0.57, pts:2325 }
  ];
  const header = `<tr><th>#</th><th>國家</th><th>勝率</th><th>積分</th></tr>`;
  const rows = ranks.map((r, i) => `<tr>
    <td>${i+1}</td>
    <td><span class="rank-flag">${r.flag}</span>${r.country}</td>
    <td>${(r.win*100).toFixed(1)}%</td>
    <td>${r.pts.toLocaleString()}</td>
  </tr>`).join('');
  table.innerHTML = header + rows;
}

function renderVideos(){
  const wrap = document.getElementById('videoList');
  if(!wrap) return;
  const data = [
    { thumb:'https://images.unsplash.com/photo-1509475826633-fed577a2c71b?q=80&w=600&auto=format&fit=crop', title:'本場最佳打擊', len:'01:12' },
    { thumb:'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=600&auto=format&fit=crop', title:'投手三振 Highlight', len:'00:54' }
  ];
  wrap.innerHTML = data.map(v => `
    <div class="video-item">
      <img class="video-thumb" src="${v.thumb}" alt="${v.title}" />
      <div class="video-meta">
        <div>${v.title}</div>
        <small>${v.len}</small>
      </div>
    </div>
  `).join('');
}

function initVote(){
  const box = document.getElementById('voteOptions');
  const result = document.getElementById('voteResult');
  if(!box || !result) return;
  const candidates = [ '🇺🇸 Trout', '🇯🇵 大谷翔平', '🇹🇼 王' ];
  box.innerHTML = candidates.map((c,i)=> `<button data-i="${i}">${c}<span>0%</span></button>`).join('');
  const votes = [0,0,0];
  box.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const i = +btn.dataset.i; votes[i]++;
    const sum = votes.reduce((a,b)=>a+b,0);
    [...box.querySelectorAll('button')].forEach((b,idx)=>{
      const p = sum? Math.round(votes[idx]/sum*100):0;
      b.querySelector('span').textContent = p + '%';
    });
    const top = Math.max(...votes);
    const topIdx = votes.indexOf(top);
    const percent = sum? Math.round(top/sum*100):0;
    result.innerHTML = `<div class="vote__bar" style="width:${percent}%"></div>`;
  });
}

function initComments(){
  const list = document.getElementById('commentList');
  const input = document.getElementById('commentInput');
  const send = document.getElementById('sendComment');
  if(!list || !input || !send) return;
  const i18n = txt => txt; // 預留：多國語言自動翻譯
  const seed = [ '期待精彩對決！', '日本先發太猛了🔥', 'USA 打線爆發吧！' ];
  seed.forEach(t => pushComment(list, i18n(t)));
  send.addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v) return; pushComment(list, i18n(v)); input.value='';
  });
}
function pushComment(list, text){
  const div = document.createElement('div');
  div.textContent = text;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

function renderRecs(){
  const grid = document.getElementById('recGrid');
  if(!grid) return;
  const cards = [
    { title:'🇯🇵 日本 vs 🇲🇽 墨西哥', win:64, reason:'你常關注日本隊 + 強投對決' },
    { title:'🇹🇼 台灣 vs 🇰🇷 韓國', win:58, reason:'你追蹤的球員先發' },
    { title:'🇺🇸 美國 vs 🇨🇺 古巴', win:52, reason:'歷史交手勝率略優' }
  ];
  grid.innerHTML = cards.map((c,i)=> `
    <div class="rec-card">
      <div class="rec-head">${c.title}</div>
      <div class="rec-win" id="recNum${i}">${c.win}%</div>
      <canvas class="rec-chart" id="recChart${i}"></canvas>
      <div class="rec-reason">${c.reason}</div>
    </div>
  `).join('');
  // 迷你圓餅圖
  cards.forEach((c,i)=>{
    const ctx = document.getElementById(`recChart${i}`);
    if(!ctx) return;
    new Chart(ctx, { type:'doughnut', data:{
      labels:['勝','負'], datasets:[{ data:[c.win, 100-c.win], backgroundColor:['#2dd4bf','#ef4444'], borderWidth:0 }] },
      options:{ plugins:{ legend:{ display:false } }, cutout:'62%' }
    });
  });
} 