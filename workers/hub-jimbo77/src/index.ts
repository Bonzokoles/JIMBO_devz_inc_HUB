/**
 * Jimbo77 Hub Dashboard - Cloudflare Worker
 * Serves static HTML for network and tunnel control
 */

export interface Env {
  API_BASE_URL: string;
  AGENT_BASE_URL: string;
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jimbo77 Hub - Network Control</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    
    .header {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .status-online { background: #10b981; color: white; }
    .status-offline { background: #ef4444; color: white; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #667eea;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin: 0.25rem;
      font-size: 0.95rem;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #10b981; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .log-container {
      background: #0f0f23;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1rem;
      max-height: 300px;
      overflow-y: auto;
      font-family: 'Consolas', monospace;
      font-size: 0.85rem;
      line-height: 1.6;
    }
    .log-line {
      margin: 0.25rem 0;
      padding: 0.25rem;
      border-left: 3px solid transparent;
    }
    .log-info { color: #60a5fa; border-left-color: #60a5fa; }
    .log-success { color: #10b981; border-left-color: #10b981; }
    .log-error { color: #ef4444; border-left-color: #ef4444; }
    .log-warning { color: #f59e0b; border-left-color: #f59e0b; }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .stat-label { color: #9ca3af; }
    .stat-value { font-weight: 600; color: #e0e0e0; }
    
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid rgba(255,255,255,0.1);
    }
    .tab {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    .tab:hover { color: #e0e0e0; }
    
    .tab-content { display: none; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Jimbo77 Hub</h1>
      <div id="agent-status" class="status-badge status-offline">Agent Offline</div>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="switchTab('tunnel')">Tunnel Control</button>
      <button class="tab" onclick="switchTab('moe-rag')">MoE-RAG API</button>
      <button class="tab" onclick="switchTab('network')">Network Status</button>
    </div>
    
    <!-- Tunnel Tab -->
    <div id="tab-tunnel" class="tab-content active">
      <div class="grid">
        <div class="card">
          <div class="card-title">Cloudflared Tunnel</div>
          <div class="stat-row">
            <span class="stat-label">Tunnel Name:</span>
            <span class="stat-value">moe-rag-backend</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Status:</span>
            <span id="tunnel-status" class="stat-value">Checking...</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">PID:</span>
            <span id="tunnel-pid" class="stat-value">-</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Public URL:</span>
            <span class="stat-value">https://rag.jimbo77.com</span>
          </div>
          <div style="margin-top: 1rem;">
            <button class="btn btn-success" onclick="startTunnel()" id="btn-start">Start Tunnel</button>
            <button class="btn btn-danger" onclick="stopTunnel()" id="btn-stop">Stop Tunnel</button>
            <button class="btn btn-secondary" onclick="refreshStatus()">Refresh</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">Agent Configuration</div>
          <div class="stat-row">
            <span class="stat-label">Agent URL:</span>
            <span class="stat-value">http://127.0.0.1:8787</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Token:</span>
            <span class="stat-value">
              <input type="password" id="agent-token" placeholder="Bearer token" style="background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 4px; width: 100%;">
            </span>
          </div>
          <div style="margin-top: 1rem;">
            <button class="btn btn-primary" onclick="connectAgent()">Connect Agent</button>
            <button class="btn btn-secondary" onclick="saveToken()">Save Token</button>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">Event Stream</div>
        <div id="log-container" class="log-container">
          <div class="log-line log-info">Waiting for connection...</div>
        </div>
      </div>
    </div>
    
    <!-- MoE-RAG Tab -->
    <div id="tab-moe-rag" class="tab-content">
      <div class="grid">
        <div class="card">
          <div class="card-title">MoE-RAG Search</div>
          <textarea id="query-input" placeholder="Enter your query..." style="width: 100%; height: 100px; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 1rem; border-radius: 8px; resize: vertical; font-family: inherit;"></textarea>
          <div style="margin-top: 1rem;">
            <button class="btn btn-primary" onclick="sendQuery()">Send Query</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">API Status</div>
          <div class="stat-row">
            <span class="stat-label">Backend:</span>
            <span id="api-status" class="stat-value">Checking...</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Endpoint:</span>
            <span class="stat-value">https://api.jimbo77.com/api/moe-rag</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">Response</div>
        <div id="response-container" class="log-container" style="max-height: 400px;">
          <div class="log-line log-info">No queries yet...</div>
        </div>
      </div>
    </div>
    
    <!-- Network Tab -->
    <div id="tab-network" class="tab-content">
      <div class="card">
        <div class="card-title">Network Information</div>
        <div style="margin-bottom: 1rem;">
          <button class="btn btn-primary" onclick="getNetStatus()">Get Status</button>
          <button class="btn btn-secondary" onclick="ping('1.1.1.1')">Ping 1.1.1.1</button>
        </div>
        <div id="network-output" class="log-container" style="max-height: 500px;">
          <div class="log-line log-info">Click button to get network status...</div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    const API_BASE = 'API_BASE_URL_PLACEHOLDER';
    const AGENT_BASE = 'AGENT_BASE_URL_PLACEHOLDER';
    let eventSource = null;
    
    function getToken() {
      return localStorage.getItem('agent_token') || '';
    }
    
    function saveToken() {
      const token = document.getElementById('agent-token').value;
      localStorage.setItem('agent_token', token);
      addLog('Token saved', 'success');
    }
    
    function loadToken() {
      const token = getToken();
      if (token) {
        document.getElementById('agent-token').value = token;
      }
    }
    
    async function connectAgent() {
      const token = document.getElementById('agent-token').value;
      if (!token) {
        addLog('Please enter token first', 'error');
        return;
      }
      saveToken();
      await refreshStatus();
      connectStream();
    }
    
    function connectStream() {
      if (eventSource) {
        eventSource.close();
      }
      
      const token = getToken();
      if (!token) return;
      
      addLog('Connecting to agent stream...', 'info');
      eventSource = new EventSource(\`\${AGENT_BASE}/stream?token=\${token}\`);
      
      eventSource.onopen = () => {
        addLog('Stream connected', 'success');
        document.getElementById('agent-status').className = 'status-badge status-online';
        document.getElementById('agent-status').textContent = 'Agent Online';
      };
      
      eventSource.addEventListener('log', (e) => {
        const data = JSON.parse(e.data);
        addLog(\`[\${data.timestamp}] \${data.message}\`, 'info');
      });
      
      eventSource.addEventListener('tunnel', (e) => {
        const data = JSON.parse(e.data);
        addLog(\`TUNNEL: \${data.event} (PID: \${data.pid || 'N/A'})\`, data.event === 'started' ? 'success' : 'warning');
        refreshStatus();
      });
      
      eventSource.addEventListener('heartbeat', (e) => {
        console.log('Heartbeat received');
      });
      
      eventSource.onerror = () => {
        addLog('Stream disconnected', 'error');
        document.getElementById('agent-status').className = 'status-badge status-offline';
        document.getElementById('agent-status').textContent = 'Agent Offline';
      };
    }
    
    async function refreshStatus() {
      try {
        const token = getToken();
        const res = await fetch(\`\${AGENT_BASE}/tunnel/status\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        
        document.getElementById('tunnel-status').textContent = data.running ? 'Running' : 'Stopped';
        document.getElementById('tunnel-status').style.color = data.running ? '#10b981' : '#ef4444';
        document.getElementById('tunnel-pid').textContent = data.pid || '-';
        
        document.getElementById('btn-start').disabled = data.running;
        document.getElementById('btn-stop').disabled = !data.running;
      } catch (e) {
        addLog(\`Status check failed: \${e.message}\`, 'error');
      }
    }
    
    async function startTunnel() {
      try {
        const token = getToken();
        const res = await fetch(\`\${AGENT_BASE}/tunnel/start\`, {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        addLog(\`Tunnel started (PID: \${data.pid})\`, 'success');
        await refreshStatus();
      } catch (e) {
        addLog(\`Start failed: \${e.message}\`, 'error');
      }
    }
    
    async function stopTunnel() {
      try {
        const token = getToken();
        await fetch(\`\${AGENT_BASE}/tunnel/stop\`, {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        addLog('Tunnel stopped', 'warning');
        await refreshStatus();
      } catch (e) {
        addLog(\`Stop failed: \${e.message}\`, 'error');
      }
    }
    
    async function sendQuery() {
      const query = document.getElementById('query-input').value.trim();
      if (!query) {
        addResponseLog('Please enter a query', 'error');
        return;
      }
      
      addResponseLog(\`Sending: \${query}\`, 'info');
      
      try {
        const res = await fetch(\`\${API_BASE}/api/moe-rag\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        
        addResponseLog(\`Response (\${data.routing_path}, \${data.latency_ms}ms):\`, 'success');
        addResponseLog(data.response, 'info');
        addResponseLog(\`Confidence: \${(data.confidence * 100).toFixed(1)}%, Cost: $\${data.cost_usd?.toFixed(6) || '0.000000'}\`, 'info');
      } catch (e) {
        addResponseLog(\`Query failed: \${e.message}\`, 'error');
      }
    }
    
    async function getNetStatus() {
      try {
        const token = getToken();
        const res = await fetch(\`\${AGENT_BASE}/net/status\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        
        document.getElementById('network-output').innerHTML = '';
        addNetworkLog(data.output || 'No data', 'info');
      } catch (e) {
        addNetworkLog(\`Failed: \${e.message}\`, 'error');
      }
    }
    
    async function ping(host) {
      try {
        const token = getToken();
        const res = await fetch(\`\${AGENT_BASE}/net/ping\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ host, count: 4 })
        });
        const data = await res.json();
        
        document.getElementById('network-output').innerHTML = '';
        addNetworkLog(data.output || 'Ping completed', 'info');
      } catch (e) {
        addNetworkLog(\`Ping failed: \${e.message}\`, 'error');
      }
    }
    
    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      document.querySelector(\`.tab[onclick="switchTab('\${tab}')"]\`).classList.add('active');
      document.getElementById(\`tab-\${tab}\`).classList.add('active');
    }
    
    function addLog(message, type = 'info') {
      const container = document.getElementById('log-container');
      const line = document.createElement('div');
      line.className = \`log-line log-\${type}\`;
      line.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
      container.insertBefore(line, container.firstChild);
      
      while (container.children.length > 100) {
        container.removeChild(container.lastChild);
      }
    }
    
    function addResponseLog(message, type = 'info') {
      const container = document.getElementById('response-container');
      const line = document.createElement('div');
      line.className = \`log-line log-\${type}\`;
      line.textContent = message;
      container.insertBefore(line, container.firstChild);
    }
    
    function addNetworkLog(message, type = 'info') {
      const container = document.getElementById('network-output');
      const line = document.createElement('div');
      line.className = \`log-line log-\${type}\`;
      line.textContent = message;
      container.appendChild(line);
    }
    
    // Check API status on load
    async function checkAPIStatus() {
      try {
        const res = await fetch(\`\${API_BASE}/api/moe-rag/health\`);
        const data = await res.json();
        document.getElementById('api-status').textContent = data.status || 'Unknown';
        document.getElementById('api-status').style.color = '#10b981';
      } catch (e) {
        document.getElementById('api-status').textContent = 'Offline';
        document.getElementById('api-status').style.color = '#ef4444';
      }
    }
    
    // Initialize
    loadToken();
    checkAPIStatus();
    setInterval(checkAPIStatus, 30000); // Check every 30s
  </script>
</body>
</html>
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Replace placeholders with actual env vars
    const html = HTML_TEMPLATE.replace(
      /API_BASE_URL_PLACEHOLDER/g,
      env.API_BASE_URL
    ).replace(/AGENT_BASE_URL_PLACEHOLDER/g, env.AGENT_BASE_URL);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  },
};
