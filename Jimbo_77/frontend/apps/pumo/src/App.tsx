import { useState, useEffect } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import './index.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Types
type KPIData = {
  totalRevenue: number;
  revenueChange: number;
  aiShare: number;
  conversionRate: number;
  totalClicks: number;
  ragHitrate: number;
  apiUptime: number;
};

type Product = {
  name: string;
  category: string;
  clicks: number;
  ctr: number;
  revenue: number;
};

function App() {
  const [kpis] = useState<KPIData>({
    totalRevenue: 284750,
    revenueChange: 8.3,
    aiShare: 67.2,
    conversionRate: 4.85,
    totalClicks: 486,
    ragHitrate: 95.2,
    apiUptime: 99.8,
  });

  const [products] = useState<Product[]>([
    { name: 'Materac Comfort Plus', category: 'Materace', clicks: 1250, ctr: 4.8, revenue: 45000 },
    { name: 'Szafa Classic Oak', category: 'Szafy', clicks: 980, ctr: 3.2, revenue: 32000 },
    { name: 'Fotel Relax Pro', category: 'Fotele', clicks: 856, ctr: 5.1, revenue: 28500 },
    { name: 'Stół Family', category: 'Stoły', clicks: 743, ctr: 3.9, revenue: 22000 },
    { name: 'Łóżko Dream', category: 'Łóżka', clicks: 682, ctr: 4.3, revenue: 38000 },
  ]);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, isAi: boolean}>>([]);

  // Revenue Chart Data
  const revenueData = {
    labels: ['01/01', '02/01', '03/01', '04/01', '05/01', '06/01', '07/01'],
    datasets: [
      {
        label: 'Total Revenue',
        data: [15000, 22000, 18000, 25000, 30000, 28000, 35000],
        borderColor: '#00ff41',
        backgroundColor: 'rgba(0, 255, 65, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'AI Revenue',
        data: [8000, 14000, 11000, 17000, 21000, 19000, 24000],
        borderColor: '#0affff',
        backgroundColor: 'rgba(10, 255, 255, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#333' },
        ticks: { color: '#e0e0e0' }
      },
      x: { 
        grid: { color: '#333' },
        ticks: { color: '#e0e0e0' }
      }
    },
    plugins: {
      legend: { 
        labels: { color: '#e0e0e0' }
      }
    }
  };

  // Traffic Pie Data
  const trafficData = {
    labels: ['AI SEO', 'Organic', 'Paid', 'Direct'],
    datasets: [{
      data: [45, 30, 15, 10],
      backgroundColor: ['#00ff41', '#0affff', '#ffaa00', '#ff4444']
    }]
  };

  const trafficOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#e0e0e0' }
      }
    }
  };

  useEffect(() => {
    // Auto-refresh KPIs every 30 seconds
    const interval = setInterval(() => {
      // TODO: Fetch from API
      console.log('Refreshing KPIs...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setMessages([...messages, { text: chatInput, isAi: false }]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev: Array<{text: string, isAi: boolean}>) => [...prev, { 
        text: 'AI Analyst is analyzing your query...', 
        isAi: true 
      }]);
    }, 500);
  };

  return (
    <div className="container">
      <h1 className="header">🧪 PUMO Diagnosis Hub</h1>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalRevenue.toLocaleString()}</div>
          <div className="kpi-label">Total Revenue</div>
          <div className={`kpi-change ${kpis.revenueChange > 0 ? 'up' : 'down'}`}>
            {kpis.revenueChange > 0 ? '↑' : '↓'}{Math.abs(kpis.revenueChange).toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.aiShare.toFixed(1)}%</div>
          <div className="kpi-label">AI Revenue Share</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.conversionRate.toFixed(2)}%</div>
          <div className="kpi-label">Conversion Rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalClicks.toLocaleString()}</div>
          <div className="kpi-label">Total Clicks</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.ragHitrate.toFixed(1)}%</div>
          <div className="kpi-label">RAG Hit Rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.apiUptime.toFixed(1)}%</div>
          <div className="kpi-label">API Uptime</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>💰 Revenue Trend (30 days)</h3>
          <div style={{ height: 300 }}>
            <Line data={revenueData} options={revenueOptions} />
          </div>
        </div>
        <div className="chart-container">
          <h3>📊 Traffic Sources</h3>
          <div style={{ height: 300 }}>
            <Doughnut data={trafficData} options={trafficOptions} />
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="chart-container">
        <h3>🏆 Top Products (Clicks & Revenue)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Category</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i}>
                <td><strong>{i + 1}</strong></td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.clicks.toLocaleString()}</td>
                <td>{p.ctr.toFixed(1)}%</td>
                <td style={{ color: 'var(--hot)', fontWeight: 'bold' }}>
                  {p.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Chat */}
      <div className="ai-chat">
        <h3>🤖 AI Analyst (Real-time Insights)</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 10 }}>
          Analizuje dane z D1 + Cloudflare + Pumo API. Pytaj o wszystko.
        </p>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.isAi ? 'ai' : ''}`}>
              {msg.isAi ? 'AI: ' : 'You: '}{msg.text}
            </div>
          ))}
        </div>
        <input
          type="text"
          className="chat-input"
          placeholder="Np: 'Dlaczego materac ma 0 hitów?'"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="btn" onClick={handleSendMessage}>
          Analizuj ➤
        </button>
      </div>
    </div>
  )
}

export default App
