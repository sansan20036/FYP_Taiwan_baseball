const express = require('express');
const path = require('path');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// serve static files from website_v3 directory (ensure index.html served)
app.use('/', express.static(__dirname, { index: 'index.html' }));

const PORT = Number(process.env.PORT || 3000);
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const BROWSER_OPTIONS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1280, height: 800 },
};

const SCHEDULE_KIND_CODES = [
  { value: 'A', text: 'CPBL Regular Season' },
  { value: 'C', text: 'CPBL Playoffs' },
  { value: 'E', text: 'International/Classic Games' },
  { value: 'G', text: 'Special Events' },
  { value: 'B', text: 'Minor League Regular Season' },
  { value: 'D', text: 'Minor League Playoffs' },
  { value: 'F', text: 'Winter League' },
  { value: 'H', text: 'Future Development League' },
  { value: 'X', text: 'Exhibition' },
];

function buildCookieHeader(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .filter(Boolean)
      .join('; ');
  }
  if (typeof headers.raw === 'function') {
    const raw = headers.raw()['set-cookie'] || [];
    return raw
      .map((cookie) => cookie.split(';')[0])
      .filter(Boolean)
      .join('; ');
  }
  const single = headers.get('set-cookie');
  return single ? single.split(';')[0] : '';
}

async function scrapeWithPage(url, onPage) {
  let browser;
  let page;
  try {
    browser = await puppeteer.launch(BROWSER_OPTIONS);
    page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return await onPage(page);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        // ignore close errors
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        // ignore close errors
      }
    }
  }
}

async function fetchScheduleData({ year, kindCode, location }) {
  const scheduleUrl = 'https://www.cpbl.com.tw/schedule';
  const baseHeaders = {
    'User-Agent': USER_AGENT,
    Accept: 'text/html',
  };

  const pageResponse = await fetch(scheduleUrl, { headers: baseHeaders });
  if (!pageResponse.ok) {
    throw new Error(`Failed to load schedule page: ${pageResponse.status}`);
  }

  const cookieHeader = buildCookieHeader(pageResponse.headers);
  const html = await pageResponse.text();

  const tokenOptsMatch = html.match(/getoptsaction[\s\S]*?RequestVerificationToken:\s*'([^']+)'/);
  const tokenGamesMatch = html.match(/getgamedatas[\s\S]*?RequestVerificationToken:\s*'([^']+)'/);
  if (!tokenOptsMatch || !tokenGamesMatch) {
    throw new Error('Unable to locate verification tokens.');
  }

  const requestHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': USER_AGENT,
    Referer: scheduleUrl,
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json, text/javascript, */*; q=0.01',
  };

  if (cookieHeader) {
    requestHeaders.Cookie = cookieHeader;
  }

  const searchParams = new URLSearchParams({
    kindCode,
    year: String(year),
  });

  const optsResponse = await fetch('https://www.cpbl.com.tw/schedule/getoptsaction', {
    method: 'POST',
    headers: { ...requestHeaders, RequestVerificationToken: tokenOptsMatch[1] },
    body: searchParams.toString(),
  });

  if (!optsResponse.ok) {
    throw new Error(`Failed to load schedule options: ${optsResponse.status}`);
  }

  const optsPayload = await optsResponse.json();
  const locations = optsPayload.Success && optsPayload.FieldOpts
    ? JSON.parse(optsPayload.FieldOpts)
    : [];

  const gamesResponse = await fetch('https://www.cpbl.com.tw/schedule/getgamedatas', {
    method: 'POST',
    headers: { ...requestHeaders, RequestVerificationToken: tokenGamesMatch[1] },
    body: new URLSearchParams({
      calendar: `${year}/01/01`,
      location,
      kindCode,
    }).toString(),
  });

  if (!gamesResponse.ok) {
    throw new Error(`Failed to load schedule data: ${gamesResponse.status}`);
  }

  const gamesPayload = await gamesResponse.json();
  const games = gamesPayload.Success && gamesPayload.GameDatas
    ? JSON.parse(gamesPayload.GameDatas)
    : [];

  return {
    locations,
    games,
    kindCode,
    year,
    location,
  };
}

app.get('/live', async (req, res) => {
  const url = 'https://www.cpbl.com.tw/schedule';

  try {
    const games = await scrapeWithPage(url, async (page) => {
      await page.waitForSelector('.game_box', { timeout: 15000 }).catch(() => {});
      return page.evaluate(() => {
        const rows = [];
        document.querySelectorAll('.game_box').forEach((game) => {
          const text = (selector) => {
            const el = game.querySelector(selector);
            return el ? el.textContent.trim() : '';
          };

          rows.push({
            date: text('.game_date'),
            teamA: text('.home_team .team_name'),
            teamB: text('.visit_team .team_name'),
            scoreA: text('.home_team .score'),
            scoreB: text('.visit_team .score'),
            status: text('.game_status'),
          });
        });
        return rows;
      });
    });

    res.json(games);
  } catch (err) {
    console.error('Scrape failed for /live:', err);
    res.status(500).send('Scrape failed: ' + err.message);
  }
});

app.get('/home', async (req, res) => {
  const url = 'https://www.cpbl.com.tw/';

  try {
    const data = await scrapeWithPage(url, async (page) => {
      await page.waitForSelector('.IndexBlock.IndexMag', { timeout: 15000 }).catch(() => {});
      return page.evaluate(() => {
        const absoluteUrl = (href) => {
          if (!href) return '';
          try {
            return new URL(href, location.origin).href;
          } catch (err) {
            return href;
          }
        };

        const extractBackgroundImage = (node) => {
          if (!node) return '';
          const style = node.getAttribute('style') || '';
          const match = style.match(/url\((['"]?)(.*?)\1\)/i);
          if (!match) return '';
          return absoluteUrl(match[2]);
        };

        const textContent = (root, selector) => {
          const el = (root || document).querySelector(selector);
          return el ? el.textContent.trim() : '';
        };

        const magazines = { current: null, history: [] };
        const magazineBlock = document.querySelector('.IndexBlock.IndexMag');
        if (magazineBlock) {
          const current = magazineBlock.querySelector('.current');
          if (current) {
            const coverLink = current.querySelector('.cover a');
            const titleLink = current.querySelector('.cont .title a');
            magazines.current = {
              title: (titleLink ? titleLink.textContent.trim() : '') || (coverLink ? coverLink.textContent.trim() : ''),
              url: titleLink ? absoluteUrl(titleLink.getAttribute('href')) : (coverLink ? absoluteUrl(coverLink.getAttribute('href')) : ''),
              image: extractBackgroundImage(coverLink),
              period: textContent(current, '.cont .periods'),
              description: textContent(current, '.cont .desc'),
            };
          }

          magazines.history = Array.from(magazineBlock.querySelectorAll('.history dd a')).map((anchor) => ({
            title: anchor.textContent.trim(),
            url: absoluteUrl(anchor.getAttribute('href')),
          }));
        }

        const parseStandingTable = (container) => {
          if (!container) return [];
          const rows = [];
          container.querySelectorAll('table tr').forEach((row, index) => {
            if (index === 0) return;
            const cells = row.querySelectorAll('td');
            if (!cells.length) return;
            const teamLink = row.querySelector('.team_name a');
            rows.push({
              rank: textContent(row, '.rank'),
              team: teamLink ? teamLink.textContent.trim() : '',
              teamUrl: teamLink ? absoluteUrl(teamLink.getAttribute('href')) : '',
              logo: extractBackgroundImage(teamLink),
              games: cells[1] ? cells[1].textContent.trim() : '',
              record: cells[2] ? cells[2].textContent.trim() : '',
              winRate: cells[3] ? cells[3].textContent.trim() : '',
              gamesBehind: cells[4] ? cells[4].textContent.trim() : '',
              streak: cells[5] ? cells[5].textContent.trim() : '',
            });
          });
          return rows;
        };

        const standings = [];
        const standingBlock = document.querySelector('.IndexBlock.IndexStanding');
        if (standingBlock) {
          const tabLabels = Array.from(standingBlock.querySelectorAll('.tabs ul li span')).map((span) => span.textContent.trim());
          const tabContainers = standingBlock.querySelectorAll('.tab_container > div');
          tabContainers.forEach((tab, index) => {
            const label = tabLabels[index] || '';
            const tableContainer = tab.querySelector('.index_standing_table');
            standings.push({
              label,
              rows: parseStandingTable(tableContainer),
            });
          });
        }

        const parseTopFive = (selector) => {
          const block = document.querySelector(selector);
          if (!block) return [];
          const groups = [];
          block.querySelectorAll('.tab_container .tab_cont').forEach((tab) => {
            const metric = textContent(tab, '.title a') || textContent(tab, '.title');
            const featuredLink = tab.querySelector('.photo_player_1st a');
            const players = Array.from(tab.querySelectorAll('ul li')).map((li) => {
              const playerLink = li.querySelector('.player .name');
              const teamLink = li.querySelector('.player .team');
              return {
                rank: textContent(li, '.rank'),
                player: playerLink ? playerLink.textContent.trim() : '',
                playerUrl: playerLink ? absoluteUrl(playerLink.getAttribute('href')) : '',
                team: teamLink ? teamLink.textContent.trim().replace(/[()]/g, '').trim() : '',
                teamUrl: teamLink ? absoluteUrl(teamLink.getAttribute('href')) : '',
                value: textContent(li, '.num'),
              };
            });

            groups.push({
              metric,
              featured: featuredLink
                ? {
                    name: featuredLink.textContent.trim(),
                    url: absoluteUrl(featuredLink.getAttribute('href')),
                    image: extractBackgroundImage(featuredLink),
                  }
                : null,
              players,
            });
          });
          return groups;
        };

        const pitchingTop5 = parseTopFive('.IndexBlock.IndexTopFive.pitching');
        const battingTop5 = parseTopFive('.IndexBlock.IndexTopFive.batting');

        const news = { focus: null, items: [] };
        const newsBlock = document.querySelector('.IndexBlock.IndexNews');
        if (newsBlock) {
          const focusLink = newsBlock.querySelector('.index_news_focus .img a');
          const focusCont = newsBlock.querySelector('.index_news_focus .cont');
          if (focusLink) {
            news.focus = {
              title: focusCont ? textContent(focusCont, '.title a') || focusLink.textContent.trim() : focusLink.textContent.trim(),
              url: absoluteUrl(focusLink.getAttribute('href')),
              image: extractBackgroundImage(focusLink),
              date: focusCont ? textContent(focusCont, '.date') : '',
              description: focusCont ? textContent(focusCont, '.desc') : '',
              tags: Array.from(focusCont ? focusCont.querySelectorAll('.tags a') : []).map((tag) => ({
                title: tag.textContent.trim(),
                url: absoluteUrl(tag.getAttribute('href')),
              })),
            };
          }

          news.items = Array.from(newsBlock.querySelectorAll('.index_news_list .item')).map((item) => {
            const imageLink = item.querySelector('.img a');
            const titleLink = item.querySelector('.cont .title a');
            const anchor = titleLink || imageLink;
            if (!anchor) return null;
            return {
              title: titleLink ? titleLink.textContent.trim() : anchor.textContent.trim(),
              url: absoluteUrl(anchor.getAttribute('href')),
              image: imageLink ? extractBackgroundImage(imageLink) : '',
            };
          }).filter(Boolean);
        }

        return {
          magazines,
          standings,
          pitchingTop5,
          battingTop5,
          news,
        };
      });
    });

    res.json({
      fetchedAt: new Date().toISOString(),
      ...data,
    });
  } catch (err) {
    console.error('Scrape failed for /home:', err);
    res.status(500).send('Scrape failed: ' + err.message);
  }
});
//clear
app.get('/schedule', async (req, res) => {
  const now = new Date();
  const year = Number.parseInt(req.query.year, 10) || now.getFullYear();
  const kindCode = (req.query.kindCode || 'A').toUpperCase();
  const location = req.query.location || '';

  try {
    const schedule = await fetchScheduleData({ year, kindCode, location });

    res.json({
      fetchedAt: new Date().toISOString(),
      filters: {
        year: schedule.year,
        kindCode: schedule.kindCode,
        location: schedule.location,
      },
      options: {
        locations: schedule.locations,
        kindCodes: SCHEDULE_KIND_CODES,
      },
      games: schedule.games,
    });
  } catch (err) {
    console.error('Scrape failed for /schedule:', err);
    res.status(500).send('Scrape failed: ' + err.message);
  }
});

// root/index.html -> index.html
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Chat proxy (OpenAI-compatible schema) ---
// Configure via env: AI_API_BASE, AI_API_KEY, AI_MODEL
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if(!Array.isArray(messages)){
      return res.status(400).json({ error: 'messages must be an array' });
    }

    const apiBase = process.env.AI_API_BASE || 'https://api.poe.com/v1';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ProBallAI';

    if(!apiKey){
      return res.status(500).json({ error: 'AI_API_KEY (or OPENAI_API_KEY) is not set' });
    }

    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6
      })
    });

    if(!resp.ok){
      let errText = await resp.text().catch(()=> '');
      return res.status(resp.status).json({ error: errText || 'Upstream error' });
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ reply });
  } catch(err){
    console.error('POST /api/chat error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Minimal connectivity check to Poe/OpenAI-compatible endpoint
app.get('/api/chat/ping', async (req, res) => {
  try{
    const apiBase = process.env.AI_API_BASE || 'https://api.poe.com/v1';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
    const model = process.env.AI_MODEL || 'ProBallAI';
    if(!apiKey){ return res.status(500).json({ ok:false, error:'AI_API_KEY not set' }); }
    const r = await fetch(`${apiBase}/chat/completions`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages:[{ role:'user', content:'ping' }] })
    });
    const ok = r.ok;
    const body = await r.text().catch(()=> '');
    res.status(ok ? 200 : r.status).json({ ok, status:r.status, body: body.slice(0,400) });
  }catch(err){
    console.error('GET /api/chat/ping error:', err);
    res.status(500).json({ ok:false, error:'Server error' });
  }
});

// Fallback: any non-API GET returns index.html (avoid Cannot GET for client routes)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Diagnostics: identify which server answers
app.get('/whoami', (req, res) => {
  res.json({ from: 'website_v3', dir: __dirname, now: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});