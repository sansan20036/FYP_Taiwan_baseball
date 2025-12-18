document.addEventListener('DOMContentLoaded', () => {
  const qs = (sel, parent = document) => parent.querySelector(sel);

  // Theme bootstrap: light by default for standalone page
  document.body.classList.add('theme-light');

  const fab = qs('#chatFab');
  const panel = qs('#chatbot');
  const body = qs('#chatBody');
  const input = qs('#chatText');
  const send = qs('#chatSend');
  const close = qs('#chatClose');
  if(!fab || !panel || !body || !input || !send) return;

  const KEY = 'proball-chat-history-standalone';
  const history = JSON.parse(localStorage.getItem(KEY) || '[]'); 
  history.forEach(m => appendMessage(m.role, m.text, { instant:true }));

  function openChatPanel(){
    const p = document.getElementById('chatbot');
    const f = document.getElementById('chatFab');
    if(p){ p.removeAttribute('hidden'); }
    if(f){ f.setAttribute('hidden',''); }
    enforceChatInputStyle();
    qs('#chatText')?.focus();
  }
  function closeChatPanel(){
    const p = document.getElementById('chatbot');
    const f = document.getElementById('chatFab');
    if(p && !p.hasAttribute('hidden')){ p.setAttribute('hidden',''); }
    if(f){ f.removeAttribute('hidden'); }
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
      const messages = buildMessagesFromHistory(text);
      const ai = await callChatApi(messages);
      const reply = (ai && typeof ai === 'string' && ai.trim()) ? ai.trim() : generateReply(text);
      showTypingThenAnimate(reply);
    }catch(e){
      showToast('AI 連線失敗，已使用本地回覆');
      const reply = generateReply(text);
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: ctrl.signal
      });
      if(!res.ok){
        let errMsg = 'Server error';
        try{ const j = await res.json(); errMsg = j?.error || errMsg; }catch{}
        showToast(`AI 連線失敗：${String(errMsg).slice(0,180)}`);
        throw new Error(errMsg);
      }
      const data = await res.json();
      return data?.reply || '';
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

  function generateReply(q){
    const lower = q.toLowerCase();
    if(/賽事|比賽|今日|today/.test(lower)) return '今天重點：Dragons vs Tigers 19:05 台北大巨蛋；另外 2 場例行賽 18:35 開打。';
    if(/勝率|預測|ai/.test(lower)) return '模型勝率目前預估主隊 64%，信心水準：高。可至「AI 模型預測」區塊查看詳細報告。';
    if(/球員|stats|數據/.test(lower)) return '可至「球員」頁查看生涯/賽季/單場數據，並使用右上角搜尋快速找到球員。';
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
      <div id=\"chatBody\" class=\"chat-body\" role=\"log\" aria-live=\"polite\"></div>
      <div class=\"chat-input\">
        <input id=\"chatText\" type=\"text\" placeholder=\"輸入訊息，例如：今天有哪些賽事？\" aria-label=\"輸入訊息\" />
        <button id=\"chatSend\" class=\"btn btn-accent\" aria-label=\"送出\"><i class=\"ri-send-plane-2-line\"></i></button>
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
    if(!p || !b || !i || !s) return;
    s.addEventListener('click', onSend);
    i.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ onSend(); } });
    c?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeChatPanel(); });
    enforceChatInputStyle();
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
      { label:'清除對話', k:'Enter', run:()=> { localStorage.removeItem(KEY); body.innerHTML=''; showToast('已清除對話'); } },
      { label:'切換 夜間/日間', k:'Enter', run:()=> applyTheme(getCurrentTheme()==='dark'?'light':'dark') },
      { label:'顯示說明', k:'Enter', run:()=> showTypingThenAnimate(helpText()) },
      { label:'開啟聊天面板（/open chat）', k:'Enter', run:()=> handleAppCommand('open chat') },
      { label:'關閉聊天面板（/close chat）', k:'Enter', run:()=> handleAppCommand('close chat') },
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
      '- /clear 清除對話',
      '- /open chat 開啟聊天視窗',
      '- /close chat 關閉聊天視窗',
      '- /theme dark|light|toggle 切換主題',
      '快捷鍵：Ctrl/Cmd+Shift+L 開啟指令面板，/ 聚焦輸入'
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
      if((cmd === 'open' || cmd === '開啟' || cmd === '打開') && /chat|聊天/.test(arg || '')){
        openChatPanel();
        return { handled:true, message:'已開啟聊天視窗' };
      }
      if((cmd === 'close' || cmd === '關閉') && /chat|聊天/.test(arg || '')){
        closeChatPanel();
        return { handled:true, message:'已關閉聊天視窗' };
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
});


