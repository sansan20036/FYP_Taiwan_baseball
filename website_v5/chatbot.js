// const { all } = require("axios");

// Flag for legacy pages that still load app.js (which has its own initChatbot).
// If this flag is true, app.js should skip its legacy chatbot init to avoid UI conflicts.
try { window.__PROBALL_CHATBOT_WIDGET__ = true; } catch(_e) {}

// === Get all names from members_details.json ===
async function getAllNames() {
  try {
    const response = await fetch('members_details.json');
    const data = await response.json();

    let players = [];
    if (Array.isArray(data)) {
      players = data;
    } else if (typeof data === 'object') {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          players.push(data[key]);
        }
      }
    }

    // Extract player names
    const allNames = players
      .map(player => player.name)
      .filter(name => name && name.trim() !== "");

    console.log("✅ All Player Names Loaded:", allNames.length);
    return allNames;
  } catch (error) {
    console.error("❌ Failed to load names:", error);
    return [];
  }
}

// === Get all players from members_details.json (for profile summary + navigation) ===
async function getAllPlayers() {
  try {
    const response = await fetch('members_details.json');
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const players = [];
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          players.push(data[key]);
        }
      }
      return players;
    }
    return [];
  } catch (error) {
    console.error("❌ Failed to load players:", error);
    return [];
  }
}

const allPlayersPromise = getAllPlayers();
const allPlayerNamesPromise = allPlayersPromise.then((players) =>
  (Array.isArray(players) ? players : [])
    .map((p) => p && p.name)
    .filter((name) => typeof name === 'string' && name.trim() !== '')
);

document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);

  function shouldEnableScrollTopOnThisPage(){
    const p = String(window.location.pathname || '').toLowerCase();
    // Only enable on player-related pages (avoid adding arrow on homepage).
    return (
      p.endsWith('/players.html') ||
      p.endsWith('/all_players_render.html') ||
      p.endsWith('/show_player_profile.html') ||
      p.endsWith('/player_compare.html')
    );
  }

  // Avoid double widgets when a page is embedded via iframe (e.g. players.html -> all_players_render.html).
  // If embedded and the page doesn't explicitly provide #chatFab markup, skip auto-injection entirely.
  let isEmbedded = false;
  try { isEmbedded = window.self !== window.top; } catch (_e) { isEmbedded = true; }
  const hasExplicitChatFab = !!qs('#chatFab');
  if (isEmbedded && !hasExplicitChatFab) {
    return;
  }

  // Theme bootstrap: only set a default theme if the page doesn't already define one.
  if (!document.body.classList.contains('theme-light') && !document.body.classList.contains('theme-dark')) {
    document.body.classList.add('theme-light');
  }

  // --- Auto-inject chatbot widget into ANY page that loads chatbot.js ---
  function ensureWidgetCss(){
    if (document.querySelector('link[data-proball-chatbot-widget="1"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'chatbot_widget.css';
    link.setAttribute('data-proball-chatbot-widget', '1');
    document.head.appendChild(link);
  }

  function ensureRemixIconCss(){
    const hasRemix = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some((l) => /remixicon/i.test(String(l.getAttribute('href') || '')));
    if (hasRemix) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css';
    document.head.appendChild(link);
  }

  function ensureChatbotWidgetStyles(){
    // Unified UI across ALL pages: always load our scoped widget CSS.
    // (Do not rely on chatbot.css/app.css differences per page.)
    ensureWidgetCss();
    return;

    if (document.getElementById('proball-chatbot-widget-style')) return;
    const style = document.createElement('style');
    style.id = 'proball-chatbot-widget-style';
    style.textContent = `
      /* Minimal scoped styles: only chatbot widget (avoid overriding page styles) */
      /* enforce hidden for chatbot elements (some pages override [hidden]) */
      #chatbot[hidden]{ display:none !important; }
      #scrollTopBtn[hidden]{ display:none !important; }
      /* fallback theme tokens (match homepage palette) */
      :root{
        --proball-fab-accent: var(--accent, #b5179e);
        --proball-fab-primary: var(--primary, #4cc9f0);
      }
      #scrollTopBtn.fab{
        position: fixed;
        right: 20px;
        bottom: 24px;
        z-index: 900;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 0;
        background: linear-gradient(135deg, var(--proball-fab-primary), var(--proball-fab-accent));
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 10px 24px rgba(2,6,23,.25);
      }
      #scrollTopBtn.fab i{ font-size: 20px; line-height: 1; }
      #scrollTopBtn.fab:hover{ filter: brightness(1.05); }
      #chatFab.fab.chat-fab{
        position: fixed;
        right: 20px;
        bottom: 80px;
        z-index: 900;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 0;
        background: linear-gradient(135deg, var(--proball-fab-accent), var(--proball-fab-primary));
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 10px 28px rgba(0,0,0,.18);
      }
      #chatFab.fab.chat-fab i{ font-size: 20px; line-height: 1; }
      #chatFab.fab.chat-fab:hover{ filter: brightness(1.05); }

      #chatbot.chatbot{
        position: fixed;
        right: 18px;
        bottom: 86px;
        z-index: 9999;
        width: min(380px, calc(100vw - 32px));
        height: min(520px, calc(100vh - 140px));
        background: rgba(255,255,255,.98);
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(0,0,0,.18);
        overflow: hidden;
        color: #111827;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      body.theme-dark #chatbot.chatbot{
        background: rgba(13,20,41,.98);
        border-color: rgba(255,255,255,.12);
        color: #e8eefc;
      }
      #chatbot .chat-header{
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0,0,0,.08);
        background: rgba(248,250,252,.9);
      }
      body.theme-dark #chatbot .chat-header{
        border-bottom-color: rgba(255,255,255,.10);
        background: rgba(15,23,48,.8);
      }
      #chatbot .chat-title{ font-weight: 800; font-size: 14px; }
      #chatbot .chat-body{
        height: calc(100% - 104px);
        overflow:auto;
        padding: 10px 10px 6px;
      }
      #chatbot .chat-input{
        display:flex;
        gap: 8px;
        padding: 10px;
        border-top: 1px solid rgba(0,0,0,.08);
        background: rgba(248,250,252,.9);
      }
      body.theme-dark #chatbot .chat-input{
        border-top-color: rgba(255,255,255,.10);
        background: rgba(15,23,48,.8);
      }
      #chatbot #chatText{
        flex:1;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(0,0,0,.14);
        outline: none;
      }
      body.theme-dark #chatbot #chatText{
        background: #0f1730;
        color: #fff;
        border-color: rgba(255,255,255,.18);
      }
      #chatbot #chatSend{
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(37,99,235,.35);
        background: linear-gradient(135deg, #2563eb, #60a5fa);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
      }
      #chatbot .message{ display:flex; gap:8px; margin: 8px 0; }
      #chatbot .message .avatar{
        width: 28px; height: 28px; border-radius: 999px;
        display:grid; place-items:center;
        font-size: 12px; font-weight: 800;
        background: rgba(37,99,235,.14);
        color: #1d4ed8;
        flex: 0 0 auto;
      }
      body.theme-dark #chatbot .message .avatar{
        background: rgba(96,165,250,.18);
        color: #dbeafe;
      }
      #chatbot .message.user{ flex-direction: row-reverse; }
      #chatbot .message.user .avatar{ background: rgba(16,185,129,.14); color: #047857; }
      body.theme-dark #chatbot .message.user .avatar{ background: rgba(16,185,129,.18); color: #a7f3d0; }
      #chatbot .message .bubble{
        max-width: 78%;
        padding: 9px 11px;
        border-radius: 12px;
        background: rgba(0,0,0,.04);
        border: 1px solid rgba(0,0,0,.06);
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 13px;
      }
      body.theme-dark #chatbot .message .bubble{
        background: rgba(255,255,255,.06);
        border-color: rgba(255,255,255,.10);
      }
      #chatbot .message.user .bubble{
        background: rgba(16,185,129,.10);
        border-color: rgba(16,185,129,.16);
      }
      body.theme-dark #chatbot .message.user .bubble{
        background: rgba(16,185,129,.12);
        border-color: rgba(16,185,129,.18);
      }
    `;
    document.head.appendChild(style);
  }

  function ensureChatbotWidgetMarkup(){
    // Scroll-to-top button (below chatbot)
    let topBtn = qs('#scrollTopBtn');
    const enableScrollTop = shouldEnableScrollTopOnThisPage();
    if (!enableScrollTop) {
      // If we previously injected one on this page, remove it (do not touch hand-written buttons).
      if (topBtn && topBtn.dataset && topBtn.dataset.proballInjected === '1') {
        topBtn.remove();
      }
    } else if (!topBtn) {
      topBtn = document.createElement('button');
      topBtn.id = 'scrollTopBtn';
      topBtn.className = 'fab';
      topBtn.setAttribute('aria-label', '回到頂端');
      topBtn.hidden = true;
      topBtn.innerHTML = '<i class="ri-arrow-up-line" aria-hidden="true"></i>';
      topBtn.dataset.proballInjected = '1';
      document.body.appendChild(topBtn);
    }

    // FAB
    let fab = qs('#chatFab');
    if(!fab){
      fab = document.createElement('button');
      fab.id = 'chatFab';
      fab.className = 'fab chat-fab';
      fab.setAttribute('aria-label', '開啟 AI 助理');
      fab.innerHTML = '<i class="ri-robot-2-line" aria-hidden="true"></i>';
      fab.dataset.proballInjected = '1';
      document.body.appendChild(fab);
    } else {
      // If this is an injected/legacy button without the robot icon, normalize to homepage icon.
      const hasIcon = !!fab.querySelector && !!fab.querySelector('i.ri-robot-2-line');
      if(!hasIcon && (fab.dataset.proballInjected === '1' || fab.textContent.trim() === 'AI')){
        fab.innerHTML = '<i class="ri-robot-2-line" aria-hidden="true"></i>';
        fab.dataset.proballInjected = '1';
      }
    }
    // Panel
    let panel = qs('#chatbot');
    if(!panel){
      panel = document.createElement('section');
      panel.id = 'chatbot';
      panel.className = 'chatbot';
      panel.setAttribute('aria-label', 'AI 聊天助理');
      panel.hidden = true;
      panel.innerHTML = `
        <header class="chat-header">
          <div class="chat-title"><i class="ri-robot-2-line" aria-hidden="true"></i> ProBall AI 助理</div>
          <div class="chat-actions">
            <button id="chatClose" class="icon-btn" aria-label="關閉">×</button>
          </div>
        </header>
        <div class="chat-quickbar" role="toolbar" aria-label="快捷功能">
          <a class="qb-item" href="matches.html" aria-label="賽事"><i class="ri-calendar-event-line" aria-hidden="true"></i><span>賽事</span></a>
          <a class="qb-item" href="players.html" aria-label="球員"><i class="ri-user-star-line" aria-hidden="true"></i><span>球員</span></a>
          <a class="qb-item" href="team.html" aria-label="球隊"><i class="ri-team-line" aria-hidden="true"></i><span>球隊</span></a>
        </div>
        <div id="chatBody" class="chat-body" role="log" aria-live="polite"></div>
        <div class="chat-input">
          <button id="quickMenuBtn" class="icon-btn" aria-label="快速設定">☰</button>
          <input id="chatText" type="text" placeholder="輸入訊息…" aria-label="輸入訊息" />
          <button id="chatSend" class="btn btn-accent" aria-label="送出"><i class="ri-arrow-right-line" aria-hidden="true"></i></button>
        </div>
      `;
      document.body.appendChild(panel);
    } else {
      // Normalize existing panel to match unified UI
      const title = panel.querySelector && panel.querySelector('.chat-title');
      if (title) {
        // Keep title text consistent
        if (!/ProBall AI 助理/.test(title.textContent || '')) {
          title.textContent = 'ProBall AI 助理';
        }
      }
      const inputEl = panel.querySelector && panel.querySelector('#chatText');
      if (inputEl && inputEl.placeholder !== '輸入訊息…') inputEl.placeholder = '輸入訊息…';
      const sendEl = panel.querySelector && panel.querySelector('#chatSend');
      if (sendEl) {
        sendEl.setAttribute('aria-label', '送出');
        sendEl.innerHTML = '<i class="ri-arrow-right-line" aria-hidden="true"></i>';
      }
      const closeEl = panel.querySelector && panel.querySelector('#chatClose');
      if (closeEl) {
        closeEl.setAttribute('aria-label', '關閉');
        closeEl.textContent = '×';
      }
      // Ensure quick menu button exists (UI + hotkeys entry)
      if (!panel.querySelector('#quickMenuBtn')) {
        const row = panel.querySelector('.chat-input');
        if (row) {
          const btn = document.createElement('button');
          btn.id = 'quickMenuBtn';
          btn.className = 'icon-btn';
          btn.setAttribute('aria-label', '快速設定');
          btn.textContent = '☰';
          row.insertBefore(btn, row.firstChild);
        }
      }

      // Ensure quickbar exists AND is fixed (not inside chat body)
      const bodyEl = panel.querySelector('#chatBody');
      const existingInBody = bodyEl && bodyEl.querySelector ? bodyEl.querySelector('.chat-quickbar') : null;
      let quickbar = panel.querySelector('.chat-quickbar');
      if (existingInBody) {
        // Move quickbar out of the scroll area to keep it fixed
        existingInBody.remove();
        quickbar = existingInBody;
      }
      if (!quickbar) {
        quickbar = document.createElement('div');
        quickbar.className = 'chat-quickbar';
        quickbar.setAttribute('role', 'toolbar');
        quickbar.setAttribute('aria-label', '快捷功能');
        quickbar.innerHTML = [
          '<a class="qb-item" href="matches.html" aria-label="賽事"><i class="ri-calendar-event-line" aria-hidden="true"></i><span>賽事</span></a>',
          '<a class="qb-item" href="players.html" aria-label="球員"><i class="ri-user-star-line" aria-hidden="true"></i><span>球員</span></a>',
          '<a class="qb-item" href="team.html" aria-label="球隊"><i class="ri-team-line" aria-hidden="true"></i><span>球隊</span></a>',
        ].join('');
      }
      // Insert quickbar right after header, before chat body
      if (quickbar && bodyEl) {
        const headerEl = panel.querySelector('.chat-header');
        if (headerEl && headerEl.nextSibling !== quickbar) {
          panel.insertBefore(quickbar, bodyEl);
        }
      }
    }

    // Command palette (hidden by default; only appears when opened via hotkeys/quick menu)
    let cmd = qs('#cmdPalette');
    if(!cmd){
      cmd = document.createElement('div');
      cmd.id = 'cmdPalette';
      cmd.className = 'cmd-palette';
      cmd.hidden = true;
      cmd.setAttribute('role','dialog');
      cmd.setAttribute('aria-modal','true');
      cmd.setAttribute('aria-label','指令面板');
      cmd.innerHTML = `
        <div class="cmd-inner">
          <input id="cmdInput" class="cmd-input" type="text" placeholder="搜尋指令…" aria-label="搜尋指令" />
          <div id="cmdList" class="cmd-list" role="listbox"></div>
        </div>
      `;
      document.body.appendChild(cmd);
    }
  }

  ensureRemixIconCss();
  ensureChatbotWidgetStyles();
  ensureChatbotWidgetMarkup();

  const fab = qs('#chatFab');
  const panel = qs('#chatbot');
  const body = qs('#chatBody');
  const input = qs('#chatText');
  const send = qs('#chatSend');
  const close = qs('#chatClose');
  const scrollTopBtn = qs('#scrollTopBtn');
  const quickBtn = qs('#quickMenuBtn');
  const quickMenu = qs('#quickMenu');
  if(!fab || !panel || !body || !input || !send) return;

  // Scroll-to-top behavior (only if button exists; some pages already implement via app.js)
  (function initScrollTopFab(){
    if(!scrollTopBtn) return;
    if(!shouldEnableScrollTopOnThisPage()) return;
    // If page's own JS manages it, don't double-bind (we mark injected buttons)
    if(scrollTopBtn.dataset.bound === '1') return;

    const path = String(window.location.pathname || '').toLowerCase();
    const isPlayersWrapper = path.endsWith('/players.html');

    const setVisible = (show) => {
      if (show) scrollTopBtn.removeAttribute('hidden');
      else scrollTopBtn.setAttribute('hidden','');
    };

    // Case A: players.html uses an iframe for the actual scrolling content.
    if (isPlayersWrapper) {
      const iframe = document.querySelector('iframe[src*="all_players_render.html"]');
      if (iframe && iframe.contentWindow) {
        const bindToIframe = () => {
          try {
            const w = iframe.contentWindow;
            const onScroll = () => setVisible((w.scrollY || w.document.documentElement.scrollTop || 0) > 400);
            onScroll();
            w.addEventListener('scroll', onScroll, { passive: true });
            scrollTopBtn.addEventListener('click', () => w.scrollTo({ top: 0, behavior: 'smooth' }));
            scrollTopBtn.dataset.bound = '1';
          } catch (_e) {
            // fallback to window if cross-origin or blocked
          }
        };
        // If iframe not fully loaded yet, wait for load.
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
          bindToIframe();
          return;
        }
        iframe.addEventListener('load', bindToIframe, { once: true });
        // While waiting, keep it hidden.
        setVisible(false);
        scrollTopBtn.dataset.bound = '1';
        return;
      }
    }

    // Case B: normal pages (scroll happens on this window)
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollTopBtn.dataset.bound = '1';
  })();

  // Resolve chat API endpoint: prefer Cloudflare Worker proxy if configured
  const CHAT_API = (() => {
    const meta = document.querySelector('meta[name="poe-proxy"]');
    const cfg = (window.POE_PROXY_URL || (meta && meta.content) || '').trim();
    return cfg || '/api/chat';
  })();

  // Ensure quick menu button exists even if HTML template misses it
  (function ensureQuickMenuPresence(){
    try{
      let btn = quickBtn;
      let menu = quickMenu;
      const wrap = input.closest('.chat-input');
      if(wrap && !btn){
        btn = document.createElement('button');
        btn.id = 'quickMenuBtn';
        btn.className = 'icon-btn';
        btn.setAttribute('aria-label','快速設定');
        btn.setAttribute('data-tooltip','快速設定');
        btn.textContent = '☰';
        wrap.insertBefore(btn, wrap.firstChild);
      }
      if(wrap && !menu){
        menu = document.createElement('div');
        menu.id = 'quickMenu';
        menu.className = 'quick-menu';
        menu.setAttribute('role','menu');
        menu.setAttribute('aria-label','快速設定');
        menu.hidden = true;
        menu.innerHTML = [
          '<button class="quick-item" data-action="theme-toggle" role="menuitem"><i class="ri-contrast-2-line"></i> 切換主題</button>',
          '<button class="quick-item" data-action="open-cmd" role="menuitem"><i class="ri-command-line"></i> 指令面板</button>',
          '<button class="quick-item" data-action="show-history" role="menuitem"><i class="ri-time-line"></i> 歷史紀錄</button>',
          '<button class="quick-item" data-action="preferences" role="menuitem"><i class="ri-settings-3-line"></i> 偏好設定</button>',
          '<div class="quick-divider" aria-hidden="true"></div>',
          '<button class="quick-item danger" data-action="clear" role="menuitem"><i class="ri-delete-bin-6-line"></i> 清除對話</button>'
        ].join('');
        wrap.appendChild(menu);
      }
      if(btn && !btn.dataset.cmd){
        btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openCommandPalette(); });
        btn.dataset.cmd = '1';
      }
    }catch(_e){ /* no-op */ }
  })();

  const KEY = 'proball-chat-history-standalone';
  // Chatbot -> Matches intent key (used to pass user input to matches.html before navigation)
  const MATCH_INTENT_KEY = 'proball-match-intent';

  const MATCH_TEAM_ALIASES = [
    { canon: '中信兄弟', aliases: ['兄弟', '中信', '中信兄弟', '象'] },
    { canon: '統一', aliases: ['統一', '統一獅', '統一7', '統一7-elevens獅', '7-elevens', '7eleven'] },
    { canon: '富邦', aliases: ['富邦', '悍將', '富邦悍將'] },
    { canon: '味全', aliases: ['味全', '味全龍', '龍'] },
    { canon: '樂天', aliases: ['樂天', '桃猿', '樂天桃猿'] },
    { canon: '台鋼', aliases: ['台鋼', '雄鷹', '台鋼雄鷹'] },
  ];

  function extractTeamsFromText(text){
    const q = String(text || '');
    const found = [];
    MATCH_TEAM_ALIASES.forEach((t) => {
      if (t.aliases.some((a) => a && q.includes(a))) {
        found.push(t.canon);
      }
    });
    return Array.from(new Set(found));
  }

  function extractDateKeyFromText(text){
    const q = String(text || '');
    const now = new Date();
    const toKey = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    if (q.includes('今天')) return toKey(now);
    if (q.includes('明天')) return toKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    if (q.includes('後天')) return toKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));

    const full = q.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (full) {
      const y = Number(full[1]);
      const m = Number(full[2]);
      const d = Number(full[3]);
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        return toKey(new Date(y, m - 1, d));
      }
    }
    const md = q.match(/(?:^|[^\d])(\d{1,2})[\/\-](\d{1,2})(?:$|[^\d])/);
    if (md) {
      const m = Number(md[1]);
      const d = Number(md[2]);
      if (Number.isFinite(m) && Number.isFinite(d)) {
        return toKey(new Date(now.getFullYear(), m - 1, d));
      }
    }
    return '';
  }

  function buildMatchIntent(text){
    const raw = String(text || '').trim();
    if (!raw) return null;
    const teams = extractTeamsFromText(raw);
    const dateKey = extractDateKeyFromText(raw);
    const hasMatchKeyword = /(賽程|賽事|比賽|對戰|對決|交手|賽果|戰績|schedule|match|today)/i.test(raw);
    // Avoid matching common Chinese "對" (too noisy). Use explicit vs / 對戰 / 對決 instead.
    const hasVs = /\b(vs|v\.s\.|vs\.)\b/i.test(raw) || /(對戰|對決)/.test(raw);
    const should = hasMatchKeyword || hasVs || !!dateKey || teams.length >= 2;
    if (!should) return null;
    return {
      kind: 'matches',
      raw,
      teams,
      dateKey,
      createdAt: new Date().toISOString(),
    };
  }
  const history = JSON.parse(localStorage.getItem(KEY) || '[]'); 
  history.forEach(m => appendMessage(m.role, m.text, { instant:true }));

  function openChatPanel(){
    const p = document.getElementById('chatbot');
    const f = document.getElementById('chatFab');
    const top = document.getElementById('scrollTopBtn');
    if(p){ p.removeAttribute('hidden'); }
    if(f){ f.setAttribute('hidden',''); }
    if(top){ top.setAttribute('hidden',''); }
    enforceChatInputStyle();
    qs('#chatText')?.focus();
  }
  function closeChatPanel(){
    const p = document.getElementById('chatbot');
    const f = document.getElementById('chatFab');
    const top = document.getElementById('scrollTopBtn');
    if(p && !p.hasAttribute('hidden')){ p.setAttribute('hidden',''); }
    if(f){ f.removeAttribute('hidden'); }
    if(top && shouldEnableScrollTopOnThisPage()){ top.removeAttribute('hidden'); }
  }

  async function findPlayerNameIntent(text){
    const q = String(text || '').trim();
    if(!q) return '';
    const allNames = await allPlayerNamesPromise;
    if(!Array.isArray(allNames) || !allNames.length) return '';

    function normalizeNameQuery(input){
      // Remove common wrappers/punctuations so `「黃龍義」` can match `黃龍義`
      let s = String(input || '').trim();
      // strip leading/trailing quotes/brackets repeatedly
      const WRAP_RE = /^[\s「」『』"“”'‘’()（）\[\]【】<>《》]+|[\s「」『』"“”'‘’()（）\[\]【】<>《》]+$/g;
      for(let i=0;i<3;i++){
        const next = s.replace(WRAP_RE, '').trim();
        if(next === s) break;
        s = next;
      }
      // collapse spaces (including full-width)
      s = s.replace(/[\u3000\s]+/g, '');
      return s;
    }

    const clean = normalizeNameQuery(q);

    // 1) Exact name input: "王威晨" / "「王威晨」"
    const exact = allNames.find((name) => name === q) || allNames.find((name) => name === clean);
    if (exact) return exact;

    // 2) Otherwise, only try substring matching when user likely refers to players; avoids random matches.
    const looksLikePlayerQuery = /(球員|選手|player|資料|數據|成績|打擊|投球|守備|背號|身高|生日|守位)/i.test(q);
    // If it looks like user only typed a name (short CJK string), allow matching without keywords.
    const looksLikeNameOnly = /^[\u4e00-\u9fff·・]{2,10}$/.test(clean);
    if(!looksLikePlayerQuery && !looksLikeNameOnly) return '';

    // Prefer the longest match to avoid matching short names inside longer ones.
    const sorted = [...allNames].sort((a,b)=> String(b).length - String(a).length);
    return sorted.find((name) => name && (q.includes(name) || clean.includes(name) || name.includes(clean))) || '';
  }

  async function getPlayerByName(name){
    const players = await allPlayersPromise;
    if(!Array.isArray(players) || !players.length) return null;
    return players.find((p) => p && p.name === name) || null;
  }

  function formatPlayerSummary(player){
    if(!player) return '';
    const lines = [];
    const name = player.name || '';
    const number = player.number ? `#${player.number}` : '';
    const team = player.team ? `${player.team}` : '';
    const position = player.position ? `${player.position}` : '';
    lines.push(`球員：${[name, number].filter(Boolean).join(' ')}`.trim());
    if (team) lines.push(`- 球隊：${team}`);
    if (position) lines.push(`- 守位：${position}`);
    if (player.batting_hand) lines.push(`- 投打：${player.batting_hand}`);
    if (player.height) lines.push(`- 身高：${player.height} cm`);
    if (player.birthday) lines.push(`- 生日：${player.birthday}`);
    if (player.first_game) lines.push(`- 初登板/初出賽：${player.first_game}`);
    if (player.education) lines.push(`- 學歷：${player.education}`);
    if (player.birthplace) lines.push(`- 國籍/出生地：${player.birthplace}`);
    if (player.web_url) lines.push(`\n已為你開啟球員頁面（完整資料）：${player.web_url}`);
    return lines.join('\n');
  }

  function buildNavIntent(text){
    const raw = String(text || '').trim();
    if(!raw) return null;
    const lower = raw.toLowerCase();

    // Personalization
    if(/個人化|個人頁|我的|personal|profile/i.test(raw)){
      return { kind:'nav', target:'personal.html', reason:'personal' };
    }

    // Model / prediction
    if(/模型|預測|勝率|prediction|model/i.test(raw)){
      return { kind:'nav', target:'simulation.html', reason:'simulation' };
    }

    // Teams
    if(/球隊|隊伍|team/i.test(raw)){
      return { kind:'nav', target:'team.html', reason:'team' };
    }

    // Players (list)
    if(/球員|選手|players?\b/i.test(lower)){
      return { kind:'nav', target:'players.html', reason:'players' };
    }

    return null;
  }

  // 以指令控制開關：點擊按鈕時走指令通道
  fab.addEventListener('click', () => { openChatPanel(); });
  close?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeChatPanel(); });
  // 防止任何情況失效：委派監聽（含重新建立 DOM 或點擊到圖示）
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('#chatClose');
    if(btn){ e.preventDefault(); e.stopPropagation(); closeChatPanel(); }
  });

  send.addEventListener('click', onSend);
  input.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ onSend(); } });
  input.addEventListener('focus', enforceChatInputStyle);
  input.addEventListener('input', enforceChatInputStyle);
  enforceChatInputStyle();
  initHotkeys();
  initSlashSuggest();
  initQuickMenu();

  async function onSend(){
    const text = input.value.trim();
    if(!text) return;
    input.value = '';
    appendMessage('user', text, { instant:true });
    save('user', text);
    try{
      // 指令優先
      const cmd = await handleAppCommand(text);
      if(cmd && cmd.handled){
        showTypingThenAnimate(cmd.message || '已完成');
        return;
      }

      // ✅ 賽事輸入：直接跳轉到賽事頁面（matches.html）
      const matchIntent = buildMatchIntent(text);
      if(matchIntent){
        try{ localStorage.setItem(MATCH_INTENT_KEY, JSON.stringify(matchIntent)); }catch(_e){}
        // If already on matches page, just refresh the focus/highlight via custom event.
        if(/matches\.html$/i.test(window.location.pathname)){
          try{
            window.dispatchEvent(new CustomEvent('proball:match-intent', { detail: matchIntent }));
            showToast('已更新賽事頁面');
          }catch(_e){
            // Fallback: reload matches page
            window.location.reload();
          }
          return;
        }
        window.location.assign(`matches.html?from=chatbot&ts=${Date.now()}`);
        return;
      }

      // ✅ 球員姓名：直接跳轉到球員個人頁
      const matchedName = await findPlayerNameIntent(text);
      if(matchedName){
        const player = await getPlayerByName(matchedName);
        const summary = formatPlayerSummary(player) || `已為你找到球員：${matchedName}`;
        // Open full profile page in a NEW TAB so chatbot can still show the summary.
        window.open(`show_player_profile.html?player_name=${encodeURIComponent(matchedName)}`, '_blank');
        showTypingThenAnimate(summary);
        return;
      }

      // ✅ 關鍵字導頁：球員/球隊/模型預測/個人化
      const navIntent = buildNavIntent(text);
      if(navIntent?.target){
        window.location.assign(`${navIntent.target}?from=chatbot&ts=${Date.now()}`);
        return;
      }

      const messages = buildMessagesFromHistory(text);
      const ai = await callChatApi(messages);
      const reply = (ai && typeof ai === 'string' && ai.trim())
        ? ai.trim()
        : await generateReply(text); // ⬅️ 改成 await
      showTypingThenAnimate(reply);
    }catch(e){
      showToast('AI 連線失敗，已使用本地回覆');
      const reply = await generateReply(text); // ⬅️ 改成 await
      showTypingThenAnimate(reply);
    }
  }

  function buildMessagesFromHistory(latestUserText){
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    const items = raw.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: String(m.text || '') }));
    items.push({ role: 'user', content: String(latestUserText || '') });
    return items;
  }

  async function callChatApi(messages){
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try{
      const isAbsolute = /^https?:\/\//i.test(CHAT_API);
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: ctrl.signal,
        mode: isAbsolute ? 'cors' : undefined,
        credentials: 'omit'
      });
      if(!res.ok){
        let errMsg = 'Server error';
        try{ const j = await res.json(); errMsg = j?.error || errMsg; }catch{}
        showToast(`AI 連線失敗：${String(errMsg).slice(0,180)}`);
        throw new Error(errMsg);
      }
      const data = await res.json();
      // Support both our backend shape { reply } and OpenAI-compatible { choices: [...] }
      const fromProxy = data?.choices?.[0]?.message?.content;
      return (typeof data?.reply === 'string' && data.reply) ? data.reply : (fromProxy || '');
    } finally{
      clearTimeout(t);
    }
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
    const bubble = appendMessage('ai', '', { instant:false });
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
    const chars = Array.from(text);
    let delayAcc = 0;
    chars.forEach(ch => {
      if(ch === '\n'){ bubble.appendChild(document.createElement('br')); delayAcc += 40; return; }
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

  function save(role, text){
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    data.push({ role, text });
    localStorage.setItem(KEY, JSON.stringify(data.slice(-100)));
  }

  // === Main chatbot response logic (改為 async，整合你的需求) ===
  async function generateReply(q) {
    const allNames = await allPlayerNamesPromise; // wait for names to load
    const matchedName = allNames.find(name => q.includes(name));

    if (matchedName) {
      console.log(`🔗 Opening player page for: ${matchedName}`);
      window.open(
        `show_player_profile.html?player_name=${encodeURIComponent(matchedName)}`,
        "_blank"
      );
      return `已為您開啟 ${matchedName} 的個人資料頁面。`;
    }

    const lower = q.toLowerCase();

    if (/賽事|比賽|今日|today/.test(lower)) {
      // Fallback behavior if AI is offline and match intent wasn't caught above.
      window.location.assign("matches.html");
      return '已為你跳轉到賽事頁面。';
    }

    if (/勝率|預測|ai/.test(lower)) {
      // window.open("model.html", "_blank");
      return '模型勝率目前預估主隊 64%，信心水準：高。可至「AI 模型預測」區塊查看詳細報告。';
    }

    if (/球員|stats|數據/.test(lower)) {
      window.open("players.html", "_blank");
      return '可至「球員」頁查看生涯/賽季/單場數據，並使用右上角搜尋快速找到球員。';
    }

    if (/球隊|team/.test(lower)) {
      window.open("team.html", "_blank");
      return '可至「球隊」頁查看各隊戰績排行及近期賽事結果。';
    }

    return '目前僅支援本棒球網站相關內容。你可以詢問：今日賽程、勝率預測、球員數據、模型解釋或網站操作。';
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
      input.style.removeProperty('-webkit-text-fill-color');
      input.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
      input.style.setProperty('color', '#000000', 'important');
    }
  }

  function recreateChatPanel(){
    const newChatPanel = document.createElement('section');
    newChatPanel.id = 'chatbot';
    newChatPanel.className = 'chatbot';
    newChatPanel.setAttribute('aria-label', 'AI 聊天助理');
    newChatPanel.innerHTML = `
      <header class="chat-header">
        <div class="chat-title"><i class=\"ri-robot-2-line\"></i> ProBall AI 助理</div>
        <div class="chat-actions">
          <button id=\"chatClose\" class=\"icon-btn\" aria-label=\"清除對話\" data-tooltip=\"清除對話\"><i class=\"ri-close-line\"></i></button>
        </div>
      </header>
      <div id=\"chatBody\" class=\"chat-body\" role=\"log\" aria-live=\"polite\">\n        <div class=\"chat-quickbar\" role=\"toolbar\" aria-label=\"功能快捷列\">\n          <a href=\"players.html\" target=\"_blank\" class=\"qb-item\" aria-label=\"球員\"><i class=\"ri-user-star-line\"></i><span>球員</span></a>\n          <a href=\"team.html\" target=\"_blank\" class=\"qb-item\" aria-label=\"球隊\"><i class=\"ri-team-line\"></i><span>球隊</span></a>\n          <a href=\"matches.html\" target=\"_blank\" class=\"qb-item\" aria-label=\"戰績\"><i class=\"ri-trophy-line\"></i><span>戰績</span></a>\n        </div>\n      </div>
      <div class=\"chat-input\">
        <button id=\"quickMenuBtn\" class=\"icon-btn\" aria-label=\"快速設定\" data-tooltip=\"快速設定\">☰</button>
        <input id=\"chatText\" type=\"text\" placeholder=\"快捷鍵：/ 聚焦、Ctrl+Shift+L 指令面板、Ctrl+Shift+O 開啟、Esc 關閉\" aria-label=\"輸入訊息\" />
        <button id=\"chatSend\" class=\"btn btn-accent\" aria-label=\"送出\"><i class=\"ri-send-plane-2-line\"></i></button>
        <div id=\"quickMenu\" class=\"quick-menu\" hidden role=\"menu\" aria-label=\"快速設定\">
          <button class=\"quick-item\" data-action=\"theme-toggle\" role=\"menuitem\"><i class=\"ri-contrast-2-line\"></i> 切換主題</button>
          <button class=\"quick-item\" data-action=\"open-cmd\" role=\"menuitem\"><i class=\"ri-command-line\"></i> 指令面板</button>
          <button class=\"quick-item\" data-action=\"show-history\" role=\"menuitem\"><i class=\"ri-time-line\"></i> 歷史紀錄</button>
          <button class=\"quick-item\" data-action=\"preferences\" role=\"menuitem\"><i class=\"ri-settings-3-line\"></i> 偏好設定</button>
          <div class=\"quick-divider\" aria-hidden=\"true\"></div>
          <button class=\"quick-item danger\" data-action=\"clear\" role=\"menuitem\"><i class=\"ri-delete-bin-6-line\"></i> 清除對話</button>
        </div>
      </div>
    `;
    document.body.appendChild(newChatPanel);
    initStandalone();
  }

  function initStandalone(){
    // re-bind elements
    const p = qs('#chatbot');
    const b = qs('#chatBody');
    const i = qs('#chatText');
    const s = qs('#chatSend');
    const c = qs('#chatClose');
    const qb = qs('#quickMenuBtn');
    const qm = qs('#quickMenu');
    if(!p || !b || !i || !s) return;
    s.addEventListener('click', onSend);
    i.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ onSend(); } });
    c?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeChatPanel(); });
    enforceChatInputStyle();
    if(qb && !qb.dataset.cmd){
      qb.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openCommandPalette(); });
      qb.dataset.cmd = '1';
    }
  }

  function showToast(msg){
    let el = document.getElementById('themeToast');
    if(!el){ el = document.createElement('div'); el.id='themeToast'; el.className='toast'; document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    requestAnimationFrame(()=> el.classList.add('show'));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.hidden=true, 220); }, 1400);
  }

  // --- Hotkeys & Command Palette ---
  function getCurrentTheme(){
    return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
  }
  function applyTheme(theme){
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    enforceChatInputStyle();
    showToast(theme === 'dark' ? '夜間模式' : '日間模式');
  }

  function initHotkeys(){
    document.addEventListener('keydown', (e) => {
      // 按 '/' 快速聚焦輸入
      if(e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)){
        e.preventDefault(); input?.focus(); return;
      }
      // Esc 關閉聊天
      if(e.key === 'Escape'){
        const panelEl = document.getElementById('chatbot');
        if(panelEl && !panelEl.hasAttribute('hidden')){ e.preventDefault(); handleAppCommand('close chat'); return; }
      }
      // 指令面板：Ctrl/Cmd + Shift + L
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l'){
        e.preventDefault(); openCommandPalette();
      }
      // 開啟聊天：Ctrl/Cmd + Shift + O
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o'){
        e.preventDefault(); handleAppCommand('open chat');
      }
      // 關閉聊天：Ctrl/Cmd + Shift + C
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c'){
        e.preventDefault(); handleAppCommand('close chat');
      }
    });
  }

  function openCommandPalette(){
    const pal = document.getElementById('cmdPalette');
    const box = document.getElementById('cmdInput');
    const list = document.getElementById('cmdList');
    if(!pal || !box || !list) return;
    pal.hidden = false; box.value=''; box.focus();
    const entries = [
      { label:'清除對話（/clear）', k:'/clear', run:()=> { localStorage.removeItem(KEY); body.innerHTML=''; showToast('已清除對話'); } },
      { label:'切換 夜間/日間（/theme toggle）', k:'/theme toggle', run:()=> applyTheme(getCurrentTheme()==='dark'?'light':'dark') },
      { label:'顯示說明（/help）', k:'/help', run:()=> showTypingThenAnimate(helpText()) },
      { label:'開啟聊天面板（/open chat）', k:'Ctrl+Shift+O', run:()=> handleAppCommand('open chat') },
      { label:'關閉聊天面板（/close chat）', k:'Esc / Ctrl+Shift+C', run:()=> handleAppCommand('close chat') },
      { label:'開啟球員頁面', k:'Enter', run:()=> handleAppCommand('open player page') },
      { label:'開啟球隊頁面', k:'Enter', run:()=> handleAppCommand('open team page') },
      { label:'開啟賽事頁面', k:'Enter', run:()=> handleAppCommand('open match page') }
    ];
    let idx = 0;
    const render = (q='') => {
      const hit = entries.filter(e => e.label.toLowerCase().includes(q.toLowerCase()));
      if(idx >= hit.length) idx = hit.length ? hit.length - 1 : 0;
      if(idx < 0) idx = 0;
      list.innerHTML = hit.map((e,i)=>`<div class="item" role="option" aria-selected="${i===idx}" data-i="${i}">${e.label}<span class="k">${e.k}</span></div>`).join('');
      list._hit = hit;
      const active = list.querySelector('[aria-selected="true"]');
      if(active){ active.scrollIntoView({ block:'nearest' }); }
    };
    render();
    const onKey = (e) => {
      if(e.key === 'Escape'){ close(); return; }
      const len = (list._hit?.length || 0);
      if(!len) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); idx = (idx+1) % len; render(box.value); return; }
      if(e.key === 'ArrowUp'){ e.preventDefault(); idx = (idx-1+len) % len; render(box.value); return; }
      if(e.key === 'Enter'){ e.preventDefault(); const h=list._hit?.[idx]; if(h){ h.run(); close(); } }
    };
    const onInput = () => render(box.value);
    const close = () => { pal.hidden = true; box.removeEventListener('keydown', onKey); box.removeEventListener('input', onInput); list.removeEventListener('mousemove', onHover); list.removeEventListener('click', onClickItem); };
    box.addEventListener('keydown', onKey);
    box.addEventListener('input', onInput);
    pal.addEventListener('click', (e) => { if(e.target === pal) close(); });
    const onHover = (e) => {
      const it = e.target.closest('.item'); if(!it) return;
      const i = parseInt(it.getAttribute('data-i')||'-1',10);
      if(!isNaN(i) && i !== idx){ idx = i; render(box.value); }
    };
    const onClickItem = (e) => {
      const it = e.target.closest('.item'); if(!it) return;
      e.preventDefault();
      const i = parseInt(it.getAttribute('data-i')||'-1',10);
      const h = list._hit?.[i];
      if(h){ h.run(); close(); }
    };
    list.addEventListener('mousemove', onHover);
    list.addEventListener('click', onClickItem);
  }

  function helpText(){
    return [
      '可用指令：',
      '- /help 顯示說明',
      // 移除快捷鍵面板指令顯示
      '- /clear 清除對話',
      '- /open chat 開啟聊天視窗',
      '- /close chat 關閉聊天視窗',
      '- /theme dark|light|toggle 切換主題',
      '',
      '快捷鍵：',
      '- / 聚焦輸入',
      '- Esc 關閉聊天面板',
      '- Ctrl+Shift+L 開啟指令面板',
      '- Ctrl+Shift+O 開啟聊天面板',
      '- Ctrl+Shift+C 關閉聊天面板'
    ].join('\n');
  }

  async function handleAppCommand(text){
    const t = String(text||'').trim();
    const m = t.match(/^\s*(?:\/|@)?([a-zA-Z\u4e00-\u9fa5]+)(?:[:\s]+(.+))?$/);
    if(!m) return { handled:false };
    const cmd = m[1].toLowerCase();
    const arg = (m[2] || '').trim();
    try{
      if(cmd === 'help' || cmd === '說明'){
        return { handled:true, message: helpText() };
      }
      if(cmd === 'shortcuts' || cmd === '快捷鍵'){
        return { handled:true, message: helpText() };
      }
      if(cmd === 'clear' || cmd === '清除'){
        localStorage.removeItem(KEY); body.innerHTML=''; return { handled:true, message:'已清除對話' };
      }
      if(cmd === 'theme' || cmd === '主題'){
        const v = arg.toLowerCase();
        if(v === 'toggle' || v === '切換') applyTheme(getCurrentTheme()==='dark'?'light':'dark');
        else if(v === 'dark' || v === '夜間') applyTheme('dark');
        else if(v === 'light' || v === '日間') applyTheme('light');
        else return { handled:true, message:'用法：/theme dark|light|toggle' };
        return { handled:true, message:`已切換主題為 ${getCurrentTheme()==='dark'?'夜間':'日間'}` };
      }
      if((cmd === 'open' || cmd === '開啟' || cmd === '打開')){
        const a = (arg || '').toLowerCase();
        if(/chat|聊天/.test(a)){
          openChatPanel();
          return { handled:true, message:'已開啟聊天視窗' };
        }
        if(/player|球員/.test(a)){
          window.open('players.html', '_blank');
          return { handled:true, message:'已開啟球員頁面' };
        }
        if(/team|球隊/.test(a)){
          window.open('team.html', '_blank');
          return { handled:true, message:'已開啟球隊頁面' };
        }
        if(/match|賽事|比賽/.test(a)){
          window.open('matches.html', '_blank');
          return { handled:true, message:'已開啟賽事頁面' };
        }
      }
      if(cmd === 'close' || cmd === '關閉'){
        const a = (arg || '').toLowerCase();
        if(/chat|聊天/.test(a)){
          closeChatPanel();
          return { handled:true, message:'已關閉聊天視窗' };
        }
      }
    }catch(e){
      return { handled:true, message:'操作失敗，請稍後再試' };
    }
    return { handled:false };
  }

  // --- Slash 建議 ---
  function initSlashSuggest(){
    const menuId = 'slashSuggest';
    let idx = -1; let items = [];
    const cmds = [
      { t:'/help', d:'顯示說明' },
      { t:'/clear', d:'清除對話' },
      { t:'/open chat', d:'開啟聊天視窗' },
      { t:'/open player', d:'開啟球員頁面' },
      { t:'/open team', d:'開啟球隊頁面' },
      { t:'/open match', d:'開啟賽事頁面' },
      { t:'/close chat', d:'關閉聊天視窗' },
      { t:'/theme dark', d:'主題：夜間' },
      { t:'/theme light', d:'主題：日間' },
      { t:'/theme toggle', d:'主題：切換' },
    ];
    const ensure = () => {
      let el = document.getElementById(menuId);
      if(!el){ el = document.createElement('div'); el.id = menuId; el.className='suggest'; el.style.position='fixed'; el.style.zIndex='3000'; document.body.appendChild(el); }
      place(el);
      return el;
    };
    const place = (el) => {
      const rect = input.getBoundingClientRect();
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.bottom}px`;
      el.style.width = `${rect.width}px`;
    };
    const render = (q='') => {
      const el = ensure();
      items = cmds.filter(c => c.t.includes(q));
      el.innerHTML = items.map((c,i)=>`<a href="#" role="option" data-i="${i}"><i class="ri-terminal-box-line"></i>${c.t}<span style="margin-left:auto;opacity:.65">${c.d}</span></a>`).join('');
      el.hidden = items.length===0;
      idx = items.length?0:-1; highlight();
    };
    const highlight = () => {
      const el = document.getElementById(menuId); if(!el) return;
      const links = Array.from(el.querySelectorAll('a'));
      links.forEach((a,i)=>{
        a.classList.toggle('is-active', i===idx);
        a.setAttribute('aria-selected', i===idx ? 'true' : 'false');
      });
      const active = links[idx]; if(active){ active.scrollIntoView({ block:'nearest' }); }
    };
    input.addEventListener('input', () => {
      const v = input.value; if(v.trim().startsWith('/')) render(v.trim()); else { const el = document.getElementById(menuId); if(el) el.hidden=true; }
    });
    input.addEventListener('keydown', (e) => {
      const el = document.getElementById(menuId); if(!el || el.hidden) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); idx = (idx+1) % items.length; highlight(); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); idx = (idx-1+items.length) % items.length; highlight(); }
      if(e.key === 'Tab'){ e.preventDefault(); if(idx>=0){ input.value = items[idx].t; } }
      if(e.key === 'Enter'){
        e.preventDefault();
        if(idx>=0 && items[idx]){ input.value = items[idx].t; send.click(); el.hidden = true; }
      }
      if(e.key === 'Escape'){ el.hidden = true; }
    });
    window.addEventListener('resize', () => { const el = document.getElementById(menuId); if(el && !el.hidden) place(el); }, { passive:true });
    window.addEventListener('scroll', () => { const el = document.getElementById(menuId); if(el && !el.hidden) place(el); }, { passive:true });
    document.addEventListener('click', (e) => { const el = document.getElementById(menuId); if(!el) return; if(!el.contains(e.target) && e.target !== input){ el.hidden = true; } });
    document.addEventListener('mousemove', (e) => { const el = document.getElementById(menuId); if(!el || el.hidden) return; const a = e.target.closest(`#${menuId} a`); if(!a) return; const i = parseInt(a.dataset.i||'-1',10); if(!isNaN(i) && i !== idx){ idx = i; highlight(); } }, { passive:true });
    document.addEventListener('mousedown', (e) => { const el = document.getElementById(menuId); if(!el || el.hidden) return; const a = e.target.closest(`#${menuId} a`); if(!a) return; e.preventDefault(); const i = parseInt(a.dataset.i||'-1',10); if(!isNaN(i)){ input.value = items[i].t; send.click(); el.hidden = true; } });
  }

  // --- Quick Menu ---
  function initQuickMenu(){
    if(quickBtn && !quickBtn.dataset.cmd){
      quickBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openCommandPalette(); });
      quickBtn.dataset.cmd = '1';
    }
  }
  function bindQuickMenu(btn, menu){
    const toggle = () => { const willShow = menu.hidden; menu.hidden = !willShow; if(willShow){ placeMenu(menu); } };
    const closeM = () => { if(!menu.hidden){ menu.hidden = true; } };
    btn.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
    window.addEventListener('resize', ()=>{ if(!menu.hidden) placeMenu(menu); }, { passive:true });
    document.addEventListener('click', (e)=>{ if(menu.hidden) return; if(!menu.contains(e.target) && e.target !== btn){ closeM(); } });
    menu.addEventListener('click', (e)=>{
      const it = e.target.closest('.quick-item'); if(!it) return;
      const act = it.getAttribute('data-action');
      if(act === 'theme-toggle'){ applyTheme(getCurrentTheme()==='dark'?'light':'dark'); }
      if(act === 'open-cmd'){ openCommandPalette(); }
      if(act === 'show-history'){ showChatHistory(); }
      if(act === 'preferences'){ showPreferences(); }
      if(act === 'clear'){ localStorage.removeItem(KEY); body.innerHTML=''; showToast('已清除對話'); }
      closeM();
    });
  }
  function placeMenu(menu){
    const btnRect = (quickBtn || menu).getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = `${btnRect.left}px`;
    menu.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
  }
  function showChatHistory(){
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if(!raw.length){ showToast('目前沒有歷史'); return; }
    const lines = raw.slice(-12).map(m=>`${m.role==='ai'?'AI':'你'}：${m.text}`).join('\n');
    showTypingThenAnimate(lines);
  }
  function showPreferences(){
    showTypingThenAnimate('偏好設定：目前支援主題切換。未來可加入更多選項。');
  }
});
