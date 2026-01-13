export const DASHBOARD_HTML = `
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>PUMO // WHITECAT OPS</title>
  <meta name="description" content="PUMO WhiteCat operational dashboard (D1/KV/Vectorize/AI)" />

  <!-- Enhanced Favicon Support -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

  <style>
    /* =========================
       PUMO WHITECAT DASHBOARD
       JIMBO UNIFIED OPS style
       Sci-fi ultra-computer theme
       Zero rounded corners
       ========================= */

    :root {
      --bg: #07090f;
      --bg2: #05070c;
      --panel: #0b0f1a;
      --panel2: #090d17;
      --text: #e7ecff;
      --muted: #9aa6c7;
      --faint: #6b7696;
      --line: #1b2542;
      --hot: #7cffb2;
      --cold: #6aa6ff;
      --warn: #ffd166;
      --bad: #ff4d6d;
      --shadow: 0 0 0 1px rgba(231, 236, 255, .06), 0 18px 50px rgba(0, 0, 0, .55);
      --maxw: 1800px;
      --lh: 1.65;
      --fs: 14px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", sans-serif;
      --focus: 0 0 0 2px var(--cold), 0 0 0 4px rgba(106, 166, 255, .25);
    }

    * { box-sizing: border-box; border-radius: 0 !important; }
    html, body { height: 100%; margin: 0; overflow-x: hidden; }
    body {
      font: var(--fs)/var(--lh) var(--sans);
      background:
        radial-gradient(1200px 800px at 15% 0%, rgba(124, 255, 178, .08), transparent 60%),
        radial-gradient(1200px 800px at 90% 5%, rgba(106, 166, 255, .08), transparent 60%),
        linear-gradient(180deg, var(--bg), var(--bg2) 70%);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--hot); }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background: linear-gradient(180deg, rgba(11, 15, 26, .92), rgba(7, 9, 15, .70));
      border-bottom: 1px solid rgba(27, 37, 66, .9);
      box-shadow: 0 4px 20px rgba(0, 0, 0, .4);
    }

    .toprow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      max-width: var(--maxw);
      margin: 0 auto;
      padding: 14px 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 280px;
    }

    .sigil {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(231, 236, 255, .18);
      background:
        repeating-linear-gradient(90deg, rgba(124, 255, 178, .40) 0px, rgba(124, 255, 178, .40) 1px, transparent 1px, transparent 6px),
        radial-gradient(24px 24px at 35% 35%, rgba(106, 166, 255, .65), transparent 65%);
      box-shadow: 0 0 0 1px rgba(231, 236, 255, .08), 0 0 18px rgba(124, 255, 178, .15);
    }

    .brand h1 {
      margin: 0;
      font: 900 15px/1.1 var(--mono);
      letter-spacing: 1.4px;
      color: var(--text);
    }

    .brand .sub {
      margin-top: 3px;
      font: 700 11px/1.1 var(--mono);
      letter-spacing: 0.8px;
      color: var(--muted);
    }

    .status-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(27, 37, 66, .8);
      padding: 7px 10px;
      background: rgba(11, 15, 26, .6);
    }

    .dot { width: 8px; height: 8px; background: var(--hot); box-shadow: 0 0 12px rgba(124, 255, 178, .35); }
    .dot.warn { background: var(--warn); box-shadow: 0 0 12px rgba(255, 209, 102, .35); }
    .dot.bad { background: var(--bad); box-shadow: 0 0 12px rgba(255, 77, 109, .35); }
    .dot.cold { background: var(--cold); box-shadow: 0 0 12px rgba(106, 166, 255, .35); }

    .actions { display: flex; gap: 10px; min-width: 280px; justify-content: flex-end; }

    .btn {
      appearance: none;
      background: transparent;
      border: 1px solid rgba(27, 37, 66, .9);
      color: var(--text);
      padding: 9px 12px;
      font: 700 11px/1 var(--mono);
      letter-spacing: 0.8px;
      cursor: pointer;
      transition: all .15s ease;
    }

    .btn:hover { border-color: rgba(124, 255, 178, .55); color: var(--hot); background: rgba(124, 255, 178, .05); }
    .btn:focus { outline: none; box-shadow: var(--focus); }
    .btn.active { border-color: var(--hot); background: rgba(124, 255, 178, .12); color: var(--hot); }

    .container { max-width: var(--maxw); margin: 0 auto; padding: 20px; }

    .tabs {
      display: flex;
      gap: 2px;
      border-bottom: 1px solid rgba(27, 37, 66, .75);
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .tab {
      appearance: none;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--muted);
      padding: 10px 16px;
      font: 700 11px/1 var(--mono);
      letter-spacing: 0.8px;
      cursor: pointer;
      transition: all .15s ease;
    }

    .tab:hover { color: var(--text); background: rgba(106, 166, 255, .04); }
    .tab.active { color: var(--hot); border-bottom-color: var(--hot); background: rgba(124, 255, 178, .06); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 18px; margin-top: 20px; }
    @media (min-width: 1400px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

    .panel {
      border: 1px solid rgba(27, 37, 66, .85);
      background: linear-gradient(180deg, rgba(11, 15, 26, .95), rgba(9, 13, 23, .80));
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .panel::before {
      content: "";
      position: absolute;
      inset: -2px;
      background:
        linear-gradient(135deg, rgba(106, 166, 255, .06), transparent 50%),
        radial-gradient(600px 200px at 15% 0%, rgba(124, 255, 178, .08), transparent 65%);
      pointer-events: none;
    }

    .panel > * { position: relative; }

    .panel-header {
      border-bottom: 1px solid rgba(27, 37, 66, .75);
      padding: 14px 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    }

    .panel-header h3 { margin: 0; font: 900 14px/1.2 var(--mono); letter-spacing: 1px; color: var(--text); }
    .panel-header .label { font: 800 10px/1 var(--mono); letter-spacing: 1.2px; color: var(--muted); }
    .panel-header .badge { border: 1px solid rgba(27, 37, 66, .8); padding: 5px 8px; font: 700 10px/1 var(--mono); letter-spacing: .6px; color: var(--muted); background: rgba(11, 15, 26, .6); }
    .badge.active { border-color: rgba(124, 255, 178, .45); color: var(--hot); background: rgba(124, 255, 178, .08); }
    .badge.warn { border-color: rgba(255, 209, 102, .35); color: var(--warn); }
    .badge.bad { border-color: rgba(255, 77, 109, .35); color: var(--bad); }

    .panel-body { padding: 16px; }

    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    @media (max-width: 720px) { .metrics { grid-template-columns: 1fr; } }

    .metric { border: 1px solid rgba(27, 37, 66, .75); padding: 12px; background: rgba(11, 15, 26, .5); }
    .metric .k { font: 700 10px/1 var(--mono); letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; display: block; }
    .metric .v { font: 900 20px/1 var(--mono); color: var(--text); letter-spacing: -0.5px; }
    .metric .v.good { color: var(--hot); }
    .metric .v.warn { color: var(--warn); }
    .metric .v.bad { color: var(--bad); }
    .metric .s { margin-top: 4px; font: 600 10px/1 var(--mono); color: var(--faint); }

    .logs {
      font-family: var(--mono);
      font-size: 11px;
      line-height: 1.6;
      max-height: 320px;
      overflow-y: auto;
      background: rgba(5, 7, 12, .8);
      padding: 10px;
      border: 1px solid rgba(27, 37, 66, .6);
    }

    .log-line { padding: 3px 0; color: var(--muted); }
    .log-line .time { color: var(--faint); }
    .log-line .lvl { font-weight: 700; }
    .lvl.info { color: var(--cold); }
    .lvl.success { color: var(--hot); }
    .lvl.warn { color: var(--warn); }
    .lvl.error { color: var(--bad); }

    .field {
      width: 100%;
      padding: 10px 12px;
      font: 700 12px/1 var(--mono);
      color: var(--text);
      background: rgba(11, 15, 26, .55);
      border: 1px solid rgba(27, 37, 66, .85);
      outline: none;
    }

    .field:focus { box-shadow: var(--focus); border-color: rgba(106, 166, 255, .55); }
    .row { display: grid; grid-template-columns: 1fr 160px auto; gap: 10px; align-items: center; }
    @media (max-width: 720px) { .row { grid-template-columns: 1fr; } }

    .list { border: 1px solid rgba(27, 37, 66, .75); background: rgba(11, 15, 26, .35); }
    .list-item { padding: 10px 12px; border-top: 1px solid rgba(27, 37, 66, .5); }
    .list-item:first-child { border-top: none; }
    .list-item h4 { margin: 0; font: 900 12px/1.2 var(--mono); letter-spacing: .5px; }
    .list-item p { margin: 6px 0 0; color: var(--muted); font-size: 12px; }
    .list-item .meta { margin-top: 6px; font: 700 10px/1 var(--mono); color: var(--faint); display: flex; gap: 10px; flex-wrap: wrap; }
  </style>
</head>

<body>
  <header class="topbar" role="banner">
    <div class="toprow">
      <div class="brand">
        <div class="sigil" aria-hidden="true"></div>
        <div>
          <h1>PUMO // WHITECAT OPS</h1>
          <div class="sub">D1 + KV + VECTORIZE + AI</div>
        </div>
      </div>

      <div class="status-bar" role="status" aria-live="polite">
        <div class="stat">
          <span class="dot" id="dotSystem"></span>
          <span>SYSTEM: <strong id="sysStatus">BOOT</strong></span>
        </div>
        <div class="stat">
          <span class="dot cold"></span>
          <span>UPTIME: <strong id="uptime">--:--:--</strong></span>
        </div>
        <div class="stat">
          <span>PRODUCTS: <strong id="statProducts">--</strong></span>
        </div>
        <div class="stat">
          <span>REQ/24H: <strong id="statReq24h">--</strong></span>
        </div>
      </div>

      <div class="actions">
        <button class="btn" id="btnRefresh" type="button">REFRESH</button>
        <button class="btn" id="btnSync" type="button">SYNC NOW</button>
        <button class="btn" id="btnGuides" type="button">GENERATE GUIDES</button>
        <button class="btn" id="btnOpenHealth" type="button">HEALTH</button>
      </div>
    </div>
  </header>

  <main class="container" role="main">
    <div class="tabs" role="tablist">
      <button class="tab active" role="tab" data-tab="overview" type="button">OVERVIEW</button>
      <button class="tab" role="tab" data-tab="analytics" type="button">ANALYTICS</button>
      <button class="tab" role="tab" data-tab="search" type="button">SEARCH</button>
      <button class="tab" role="tab" data-tab="sync" type="button">SYNC</button>
      <button class="tab" role="tab" data-tab="reports" type="button">REPORTS</button>
      <button class="tab" role="tab" data-tab="logs" type="button">LOGS</button>
    </div>

    <section class="tab-content active" id="content-overview" role="tabpanel">
      <div class="grid">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">KPI SNAPSHOT</div>
              <h3>STORE + AI SEO</h3>
            </div>
            <span class="badge active" id="badgeKpi">ACTIVE</span>
          </div>
          <div class="panel-body">
            <div class="metrics">
              <div class="metric">
                <span class="k">TOTAL PRODUCTS</span>
                <div class="v" id="kpiProducts">--</div>
                <div class="s" id="kpiProductsSub">D1 products</div>
              </div>
              <div class="metric">
                <span class="k">TOTAL CATEGORIES</span>
                <div class="v" id="kpiCategories">--</div>
                <div class="s" id="kpiCategoriesSub">distinct category</div>
              </div>
              <div class="metric">
                <span class="k">REVENUE (30D)</span>
                <div class="v" id="kpiRevenue">--</div>
                <div class="s" id="kpiRevenueSub">sum purchases</div>
              </div>
              <div class="metric">
                <span class="k">AI REVENUE SHARE</span>
                <div class="v" id="kpiAIShare">--</div>
                <div class="s" id="kpiAIShareSub">utm_source=mybonzo</div>
              </div>
              <div class="metric">
                <span class="k">CLICKS (30D)</span>
                <div class="v" id="kpiClicks">--</div>
                <div class="s" id="kpiClicksSub">product_clicks</div>
              </div>
              <div class="metric">
                <span class="k">CONVERSION</span>
                <div class="v" id="kpiConv">--</div>
                <div class="s" id="kpiConvSub">purchases/clicks</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">24H REALTIME</div>
              <h3>LIVE ACTIVITY</h3>
            </div>
            <span class="badge" id="badgeRealtime">--</span>
          </div>
          <div class="panel-body">
            <div class="metrics">
              <div class="metric">
                <span class="k">ACTIVE SESSIONS</span>
                <div class="v" id="rtSessions">--</div>
                <div class="s">unique session_id</div>
              </div>
              <div class="metric">
                <span class="k">EVENTS (24H)</span>
                <div class="v" id="rtEvents">--</div>
                <div class="s">analytics_events</div>
              </div>
              <div class="metric">
                <span class="k">CLICKS (24H)</span>
                <div class="v" id="rtClicks">--</div>
                <div class="s">click</div>
              </div>
              <div class="metric">
                <span class="k">PURCHASES (24H)</span>
                <div class="v" id="rtPurchases">--</div>
                <div class="s">purchase</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">OPERATIONS</div>
              <h3>QUICK ACTIONS</h3>
            </div>
            <span class="badge" id="badgeOps">READY</span>
          </div>
          <div class="panel-body">
            <div style="display:grid; gap:10px;">
              <button class="btn" id="btnFullSync" type="button">FULL PRODUCT SYNC</button>
              <button class="btn" id="btnIncSync" type="button">INCREMENTAL PRODUCT SYNC</button>
              <button class="btn" id="btnOrdersSync" type="button">ORDERS SYNC (24H)</button>
              <button class="btn" id="btnTestApi" type="button">TEST PUMO API</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tab-content" id="content-analytics" role="tabpanel">
      <div class="grid">
        <div class="panel" style="grid-column: 1 / -1;">
          <div class="panel-header">
            <div>
              <div class="label">CHARTS</div>
              <h3>REVENUE TREND</h3>
            </div>
            <span class="badge" id="badgeChartRevenue">--</span>
          </div>
          <div class="panel-body" style="height: 320px;">
            <canvas id="chartRevenue" aria-label="Revenue trend"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">CATEGORIES</div>
              <h3>TOP CATEGORIES (30D)</h3>
            </div>
            <span class="badge" id="badgeChartCategories">--</span>
          </div>
          <div class="panel-body" style="height: 320px;">
            <canvas id="chartCategories" aria-label="Category performance"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">TOP PRODUCTS</div>
              <h3>CLICK LEADERS</h3>
            </div>
            <span class="badge" id="badgeTopProducts">--</span>
          </div>
          <div class="panel-body">
            <div class="list" id="topProductsList">
              <div class="list-item"><p>Loading...</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tab-content" id="content-search" role="tabpanel">
      <div class="grid">
        <div class="panel" style="grid-column: 1 / -1;">
          <div class="panel-header">
            <div>
              <div class="label">RAG SEARCH</div>
              <h3>SEARCH PRODUCTS</h3>
            </div>
            <span class="badge" id="badgeSearch">READY</span>
          </div>
          <div class="panel-body">
            <div class="row">
              <input class="field" id="searchQuery" type="text" placeholder="np. szafa, komoda, łóżko..." />
              <select class="field" id="searchMode">
                <option value="hybrid">hybrid</option>
                <option value="semantic">semantic</option>
                <option value="keyword">keyword</option>
              </select>
              <button class="btn" id="btnSearch" type="button">SEARCH</button>
            </div>

            <div style="margin-top:12px;" class="list" id="searchResults">
              <div class="list-item"><p>Type a query and run search.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tab-content" id="content-sync" role="tabpanel">
      <div class="grid">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">SYNC HISTORY</div>
              <h3>LAST RUNS</h3>
            </div>
            <span class="badge" id="badgeSync">--</span>
          </div>
          <div class="panel-body">
            <div class="list" id="syncStatus">
              <div class="list-item"><p>Loading...</p></div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">CHANGES</div>
              <h3>RECENT PRODUCT CHANGES</h3>
            </div>
            <span class="badge" id="badgeChanges">--</span>
          </div>
          <div class="panel-body">
            <div class="list" id="changesList">
              <div class="list-item"><p>Loading...</p></div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="label">GUIDES CACHE</div>
              <h3>GUIDE ENDPOINTS</h3>
            </div>
            <span class="badge" id="badgeGuides">--</span>
          </div>
          <div class="panel-body">
            <div class="list">
              <div class="list-item">
                <h4>GET /api/guide/:path</h4>
                <p>Guides are generated from products and cached in KV. Use GENERATE GUIDES to refresh.</p>
                <div class="meta"><span>KV: guide:/guides/*</span><span>TTL: 7d</span></div>
              </div>
              <div class="list-item">
                <h4>POST /api/generate-guides</h4>
                <p>Manual regeneration (runs immediately).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tab-content" id="content-reports" role="tabpanel">
      <div class="grid">
        <div class="panel" style="grid-column: 1 / -1;">
          <div class="panel-header">
            <div>
              <div class="label">REPORTS</div>
              <h3>GENERATED REPORTS (D1 + KV)</h3>
            </div>
            <span class="badge" id="badgeReports">--</span>
          </div>
          <div class="panel-body">
            <div class="list" id="reportsList">
              <div class="list-item"><p>Loading...</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="tab-content" id="content-logs" role="tabpanel">
      <div class="grid">
        <div class="panel" style="grid-column: 1 / -1;">
          <div class="panel-header">
            <div>
              <div class="label">CLIENT LOG</div>
              <h3>EVENTS</h3>
            </div>
            <span class="badge" id="badgeLogs">LOCAL</span>
          </div>
          <div class="panel-body">
            <div class="logs" id="log"></div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    (function() {
      var startTs = Date.now();
      var charts = { revenue: null, categories: null };

      var API_BASE_PARAM = new URLSearchParams(window.location.search).get('api');
      var ENV_DEFAULT_API_BASE = (window.__DEFAULT_API_BASE__ ? String(window.__DEFAULT_API_BASE__) : '').trim();
      var API_BASE = (API_BASE_PARAM || localStorage.getItem('PUMO_API_BASE') || ENV_DEFAULT_API_BASE || '').trim();
      if (API_BASE) API_BASE = API_BASE.replace(/\/+$/, '');

      function pad2(n) { return String(n).padStart(2, '0'); }
      function formatUptime(ms) {
        var s = Math.floor(ms / 1000);
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var ss = s % 60;
        return pad2(h) + ':' + pad2(m) + ':' + pad2(ss);
      }

      function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
      }

      function setBadge(id, text, kind) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = 'badge' + (kind ? ' ' + kind : '');
      }

      function log(level, message) {
        var container = document.getElementById('log');
        if (!container) return;
        var t = new Date();
        var time = pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ':' + pad2(t.getSeconds());
        var row = document.createElement('div');
        row.className = 'log-line';
        row.innerHTML = '<span class="time">[' + time + ']</span> <span class="lvl ' + level + '">' + level.toUpperCase() + '</span> ' + escapeHtml(message);
        container.insertBefore(row, container.firstChild);
        while (container.children.length > 80) container.removeChild(container.lastChild);
      }

      function escapeHtml(str) {
        return String(str)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }

      function buildUrl(url) {
        if (!url) return url;
        if (/^https?:\/\//i.test(url)) return url;
        if (!API_BASE) return url;
        if (url.startsWith('/')) return API_BASE + url;
        return API_BASE + '/' + url;
      }

      async function fetchJson(url, opts) {
        var res = await fetch(buildUrl(url), opts || {});
        var txt = await res.text();
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (!res.ok) {
          var msg = (data && data.error) ? data.error : ('HTTP ' + res.status);
          throw new Error(msg);
        }
        return data;
      }

      function setTab(tab) {
        document.querySelectorAll('.tab').forEach(function(btn) {
          btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        document.querySelectorAll('.tab-content').forEach(function(sec) {
          sec.classList.toggle('active', sec.id === 'content-' + tab);
        });
      }

      async function refreshSystemStatus() {
        setText('uptime', formatUptime(Date.now() - startTs));
        try {
          await fetchJson('/health');
          setText('sysStatus', 'ONLINE');
          var dot = document.getElementById('dotSystem');
          if (dot) dot.className = 'dot';
        } catch (e) {
          setText('sysStatus', 'OFFLINE');
          var dot2 = document.getElementById('dotSystem');
          if (dot2) dot2.className = 'dot bad';
        }
      }

      function fmtNumber(n) {
        if (n === null || n === undefined) return '--';
        if (typeof n !== 'number') return String(n);
        return n.toLocaleString('pl-PL');
      }

      function fmtMoney(n) {
        if (n === null || n === undefined || typeof n !== 'number') return '--';
        return n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' zł';
      }

      function fmtPct(n) {
        if (n === null || n === undefined || typeof n !== 'number' || Number.isNaN(n)) return '--';
        return n.toFixed(2) + '%';
      }

      async function loadOverview() {
        try {
          setBadge('badgeKpi', 'LOADING', 'warn');
          var dash = await fetchJson('/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'dashboard' })
          });

          setText('kpiProducts', fmtNumber(dash.totalProducts));
          setText('kpiCategories', fmtNumber(dash.totalCategories));
          setText('statProducts', fmtNumber(dash.totalProducts));
          setText('statReq24h', fmtNumber(dash.apiRequests24h));

          setBadge('badgeKpi', 'ACTIVE', 'active');
        } catch (e) {
          setBadge('badgeKpi', 'ERROR', 'bad');
          log('error', 'Overview(/analytics) failed: ' + e.message);
        }

        try {
          var kpi = await fetchJson('/api/analytics/kpis?days=30');
          var d = kpi && kpi.data ? kpi.data : null;
          setText('kpiRevenue', d ? fmtMoney(d.total_revenue || 0) : '--');
          setText('kpiAIShare', d ? fmtPct(d.ai_revenue_share || 0) : '--');
          setText('kpiClicks', d ? fmtNumber(d.total_clicks || 0) : '--');
          setText('kpiConv', d ? fmtPct(d.conversion_rate || 0) : '--');
        } catch (e) {
          log('warn', 'KPIs(/api/analytics/kpis) failed: ' + e.message);
        }

        try {
          setBadge('badgeRealtime', 'LOADING', 'warn');
          var rt = await fetchJson('/api/analytics/realtime');
          var rtd = rt && rt.data ? rt.data : null;
          var cur = rtd && rtd.current ? rtd.current : null;
          setText('rtSessions', fmtNumber(cur ? cur.active_sessions : null));
          setText('rtEvents', fmtNumber(cur ? cur.total_events : null));
          setText('rtClicks', fmtNumber(cur ? cur.clicks_24h : null));
          setText('rtPurchases', fmtNumber(cur ? cur.purchases_24h : null));
          setBadge('badgeRealtime', 'ACTIVE', 'active');
        } catch (e) {
          setBadge('badgeRealtime', 'ERROR', 'bad');
          log('warn', 'Realtime(/api/analytics/realtime) failed: ' + e.message);
        }
      }

      async function loadCharts() {
        try {
          setBadge('badgeChartRevenue', 'LOADING', 'warn');
          var trend = await fetchJson('/api/analytics/revenue-trend?days=30');
          var list = trend && trend.data ? trend.data : [];
          var labels = list.slice().reverse().map(function(x) { return x.date; });
          var total = list.slice().reverse().map(function(x) { return Number(x.total_revenue || 0); });
          var ai = list.slice().reverse().map(function(x) { return Number(x.ai_revenue || 0); });
          renderRevenueChart(labels, total, ai);
          setBadge('badgeChartRevenue', 'OK', 'active');
        } catch (e) {
          setBadge('badgeChartRevenue', 'ERROR', 'bad');
          log('warn', 'Revenue trend failed: ' + e.message);
        }

        try {
          setBadge('badgeChartCategories', 'LOADING', 'warn');
          var cats = await fetchJson('/api/analytics/category-performance');
          var rows = cats && cats.data ? cats.data : [];
          var top = rows.slice(0, 8);
          var labels2 = top.map(function(r) { return String(r.category || 'N/A'); });
          var values = top.map(function(r) { return Number(r.total_clicks || 0); });
          renderCategoriesChart(labels2, values);
          setBadge('badgeChartCategories', 'OK', 'active');
        } catch (e) {
          setBadge('badgeChartCategories', 'ERROR', 'bad');
          log('warn', 'Category performance failed: ' + e.message);
        }

        try {
          setBadge('badgeTopProducts', 'LOADING', 'warn');
          var top = await fetchJson('/api/analytics/top-products?limit=10');
          var items = top && top.data ? top.data : [];
          renderTopProducts(items);
          setBadge('badgeTopProducts', 'OK', 'active');
        } catch (e) {
          setBadge('badgeTopProducts', 'ERROR', 'bad');
          log('warn', 'Top products failed: ' + e.message);
        }
      }

      function renderRevenueChart(labels, total, ai) {
        var canvas = document.getElementById('chartRevenue');
        if (!canvas || !window.Chart) return;
        var data = {
          labels: labels,
          datasets: [
            { label: 'Total revenue', data: total, borderColor: '#7cffb2', backgroundColor: 'rgba(124,255,178,.10)', borderWidth: 2, fill: true, tension: 0.25 },
            { label: 'AI revenue', data: ai, borderColor: '#6aa6ff', backgroundColor: 'rgba(106,166,255,.08)', borderWidth: 2, fill: true, tension: 0.25 }
          ]
        };
        var options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#9aa6c7', font: { family: 'ui-monospace' } } }
          },
          scales: {
            x: { ticks: { color: '#9aa6c7' }, grid: { color: 'rgba(27,37,66,.35)' } },
            y: { ticks: { color: '#9aa6c7' }, grid: { color: 'rgba(27,37,66,.35)' } }
          }
        };
        if (charts.revenue) {
          charts.revenue.data = data;
          charts.revenue.options = options;
          charts.revenue.update();
          return;
        }
        charts.revenue = new Chart(canvas.getContext('2d'), { type: 'line', data: data, options: options });
      }

      function renderCategoriesChart(labels, values) {
        var canvas = document.getElementById('chartCategories');
        if (!canvas || !window.Chart) return;
        var data = {
          labels: labels,
          datasets: [
            { label: 'Clicks', data: values, backgroundColor: 'rgba(106,166,255,.25)', borderColor: '#6aa6ff', borderWidth: 1 }
          ]
        };
        var options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#9aa6c7' }, grid: { color: 'rgba(27,37,66,.35)' } },
            y: { ticks: { color: '#9aa6c7' }, grid: { color: 'rgba(27,37,66,.35)' }, beginAtZero: true }
          }
        };
        if (charts.categories) {
          charts.categories.data = data;
          charts.categories.options = options;
          charts.categories.update();
          return;
        }
        charts.categories = new Chart(canvas.getContext('2d'), { type: 'bar', data: data, options: options });
      }

      function renderTopProducts(items) {
        var container = document.getElementById('topProductsList');
        if (!container) return;
        if (!items || items.length === 0) {
          container.innerHTML = '<div class="list-item"><p>No data.</p></div>';
          return;
        }
        container.innerHTML = items.map(function(it) {
          var name = escapeHtml(it.product_name || it.product_id || 'unknown');
          var cat = escapeHtml(it.category || '');
          var clicks = fmtNumber(Number(it.clicks || 0));
          var revenue = fmtMoney(Number(it.revenue || 0));
          return '<div class="list-item">'
            + '<h4>' + name + '</h4>'
            + '<p>' + (cat ? cat : '—') + '</p>'
            + '<div class="meta"><span>CLICKS: ' + clicks + '</span><span>REV: ' + revenue + '</span></div>'
            + '</div>';
        }).join('');
      }

      async function runSearch() {
        var q = (document.getElementById('searchQuery') || {}).value || '';
        var mode = (document.getElementById('searchMode') || {}).value || 'hybrid';
        var container = document.getElementById('searchResults');
        if (!q.trim()) {
          if (container) container.innerHTML = '<div class="list-item"><p>Enter a query.</p></div>';
          return;
        }
        try {
          setBadge('badgeSearch', 'SEARCHING', 'warn');
          if (container) container.innerHTML = '<div class="list-item"><p>Searching...</p></div>';
          var res = await fetchJson('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q, mode: mode, limit: 20 })
          });
          var list = res && res.data ? res.data : [];
          if (!container) return;
          if (!list || list.length === 0) {
            container.innerHTML = '<div class="list-item"><p>No results.</p></div>';
            setBadge('badgeSearch', 'EMPTY', 'warn');
            return;
          }
          container.innerHTML = list.map(function(r) {
            var p = r.product || {};
            var title = escapeHtml(p.name || p.id || 'unknown');
            var cat = escapeHtml(p.category || '');
            var price = (typeof p.price === 'number') ? fmtMoney(p.price) : '--';
            var score = (typeof r.score === 'number') ? r.score.toFixed(3) : '--';
            var url = p.url ? String(p.url) : '';
            return '<div class="list-item">'
              + '<h4>' + title + '</h4>'
              + '<p>' + (cat ? cat : '—') + '</p>'
              + '<div class="meta"><span>SCORE: ' + score + '</span><span>PRICE: ' + price + '</span>'
              + (url ? '<span><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">OPEN</a></span>' : '')
              + '</div>'
              + '</div>';
          }).join('');
          setBadge('badgeSearch', 'OK', 'active');
          log('success', 'Search completed: ' + list.length + ' results (mode=' + mode + ')');
        } catch (e) {
          setBadge('badgeSearch', 'ERROR', 'bad');
          if (container) container.innerHTML = '<div class="list-item"><p>Error: ' + escapeHtml(e.message) + '</p></div>';
          log('error', 'Search failed: ' + e.message);
        }
      }

      async function loadSyncPanels() {
        try {
          setBadge('badgeSync', 'LOADING', 'warn');
          var status = await fetchJson('/api/sync/status');
          renderSyncStatus(status);
          setBadge('badgeSync', 'OK', 'active');
        } catch (e) {
          setBadge('badgeSync', 'ERROR', 'bad');
          log('warn', 'Sync status failed: ' + e.message);
        }

        try {
          setBadge('badgeChanges', 'LOADING', 'warn');
          var changes = await fetchJson('/api/changes?limit=20');
          renderChanges(changes);
          setBadge('badgeChanges', 'OK', 'active');
        } catch (e) {
          setBadge('badgeChanges', 'ERROR', 'bad');
          log('warn', 'Changes failed: ' + e.message);
        }
      }

      function renderSyncStatus(payload) {
        var container = document.getElementById('syncStatus');
        if (!container) return;
        var rows = payload && payload.data ? payload.data : payload;
        if (!Array.isArray(rows) || rows.length === 0) {
          container.innerHTML = '<div class="list-item"><p>No sync history.</p></div>';
          return;
        }
        container.innerHTML = rows.slice(0, 10).map(function(r) {
          var started = escapeHtml(r.started_at || r.startedAt || '');
          var status = escapeHtml(r.status || '');
          var dur = (r.duration_ms || r.durationMs) ? String(r.duration_ms || r.durationMs) + 'ms' : '--';
          var err = r.error ? (' | ' + escapeHtml(r.error)) : '';
          return '<div class="list-item">'
            + '<h4>' + started + '</h4>'
            + '<p>' + status + err + '</p>'
            + '<div class="meta"><span>DURATION: ' + escapeHtml(dur) + '</span></div>'
            + '</div>';
        }).join('');
      }

      function renderChanges(payload) {
        var container = document.getElementById('changesList');
        if (!container) return;
        var rows = payload && payload.data ? payload.data : payload;
        if (!Array.isArray(rows) || rows.length === 0) {
          container.innerHTML = '<div class="list-item"><p>No changes logged.</p></div>';
          return;
        }
        container.innerHTML = rows.slice(0, 20).map(function(r) {
          var ts = escapeHtml(r.timestamp || r.created_at || '');
          var type = escapeHtml(r.change_type || r.type || '');
          var id = escapeHtml(r.product_id || r.id || '');
          return '<div class="list-item">'
            + '<h4>' + type + ' :: ' + id + '</h4>'
            + '<p>' + ts + '</p>'
            + '</div>';
        }).join('');
      }

      async function loadReports() {
        try {
          setBadge('badgeReports', 'LOADING', 'warn');
          var data = await fetchJson('/api/analytics/reports');
          renderReports(data);
          setBadge('badgeReports', 'OK', 'active');
        } catch (e) {
          setBadge('badgeReports', 'ERROR', 'bad');
          log('warn', 'Reports failed: ' + e.message);
        }
      }

      function renderReports(payload) {
        var container = document.getElementById('reportsList');
        if (!container) return;
        var d = payload && payload.data ? payload.data : null;
        if (!d) {
          container.innerHTML = '<div class="list-item"><p>No data.</p></div>';
          return;
        }
        var blocks = [];
        ['daily', 'weekly', 'monthly'].forEach(function(kind) {
          var list = Array.isArray(d[kind]) ? d[kind] : [];
          blocks.push('<div class="list-item"><h4>' + kind.toUpperCase() + '</h4><p>' + list.length + ' reports</p></div>');
          list.slice(0, 10).forEach(function(r) {
            var id = escapeHtml(r.id || '');
            var gen = escapeHtml(r.generated_at || r.generatedAt || r.created_at || '');
            blocks.push('<div class="list-item">'
              + '<h4><a href="/api/analytics/report/' + id + '" target="_blank" rel="noopener">' + id + '</a></h4>'
              + '<p>' + gen + '</p>'
              + '</div>');
          });
        });
        container.innerHTML = blocks.join('');
      }

      async function postJson(url, body) {
        return await fetchJson(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {})
        });
      }

      async function safeAction(name, fn) {
        try {
          log('info', name + '...');
          await fn();
          log('success', name + ' OK');
        } catch (e) {
          log('error', name + ' failed: ' + e.message);
        }
      }

      function bind() {
        document.querySelectorAll('.tab').forEach(function(btn) {
          btn.addEventListener('click', function() { setTab(btn.getAttribute('data-tab')); });
        });

        var bRefresh = document.getElementById('btnRefresh');
        if (bRefresh) bRefresh.addEventListener('click', function() {
          safeAction('REFRESH', async function() {
            await refreshAll();
          });
        });

        var bSync = document.getElementById('btnSync');
        if (bSync) bSync.addEventListener('click', function() {
          safeAction('MANUAL SYNC', async function() {
            await postJson('/api/sync/trigger', {});
            await loadSyncPanels();
          });
        });

        var bGuides = document.getElementById('btnGuides');
        if (bGuides) bGuides.addEventListener('click', function() {
          safeAction('GENERATE GUIDES', async function() {
            await postJson('/api/generate-guides', {});
          });
        });

        var bHealth = document.getElementById('btnOpenHealth');
        if (bHealth) bHealth.addEventListener('click', function() {
          window.open('/health', '_blank');
        });

        var bFull = document.getElementById('btnFullSync');
        if (bFull) bFull.addEventListener('click', function() {
          safeAction('FULL PRODUCT SYNC', async function() {
            await postJson('/api/sync/full', {});
            await loadSyncPanels();
          });
        });

        var bInc = document.getElementById('btnIncSync');
        if (bInc) bInc.addEventListener('click', function() {
          safeAction('INCREMENTAL PRODUCT SYNC', async function() {
            await postJson('/api/sync/incremental', {});
            await loadSyncPanels();
          });
        });

        var bOrders = document.getElementById('btnOrdersSync');
        if (bOrders) bOrders.addEventListener('click', function() {
          safeAction('ORDERS SYNC', async function() {
            await postJson('/api/orders/sync', { hours: 24 });
          });
        });

        var bTest = document.getElementById('btnTestApi');
        if (bTest) bTest.addEventListener('click', function() {
          safeAction('TEST PUMO API', async function() {
            await fetchJson('/api/sync/test');
          });
        });

        var bSearch = document.getElementById('btnSearch');
        if (bSearch) bSearch.addEventListener('click', function() { runSearch(); });
        var q = document.getElementById('searchQuery');
        if (q) q.addEventListener('keydown', function(e) { if (e.key === 'Enter') runSearch(); });
      }

      async function refreshAll() {
        await refreshSystemStatus();
        await loadOverview();
        await loadCharts();
        await loadSyncPanels();
        await loadReports();
      }

      async function start() {
        bind();
        log('success', 'Dashboard initialized');
        await refreshAll();
        setInterval(function() { refreshSystemStatus(); }, 1000);
        setInterval(function() { loadOverview(); }, 30000);
      }

      document.addEventListener('DOMContentLoaded', function() {
        start().catch(function(e) { log('error', 'Init failed: ' + e.message); });
      });
    })();
  </script>
</body>
</html>

`;
