import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
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
} from 'chart.js';
import { api } from './api';

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
);

interface PumoViewProps {
  onBack: () => void;
}

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

type AgentStatus = {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  lastRun?: string;
};

export const PumoView = ({ onBack }: PumoViewProps) => {
  const [kpis, setKpis] = useState<KPIData>({
    totalRevenue: 284750,
    revenueChange: 8.3,
    aiShare: 67.2,
    conversionRate: 4.85,
    totalClicks: 486,
    ragHitrate: 95.2,
    apiUptime: 99.8,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, isAi: boolean}>>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Agent statuses
  const [agents] = useState<AgentStatus[]>([
    { id: 'a1', name: 'Uptime Agent', status: 'active', lastRun: '2 min ago' },
    { id: 'a3', name: 'Error Budget', status: 'active', lastRun: '1 min ago' },
    { id: 'a6', name: 'Conversion', status: 'active', lastRun: '5 min ago' },
    { id: 'a2', name: 'Performance', status: 'idle', lastRun: '1 hour ago' },
    { id: 'a4', name: 'Security', status: 'idle', lastRun: '15 min ago' },
  ]);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load KPIs
      const kpiData = await api.getKPIs();
      setKpis(kpiData);

      // Load revenue trend
      const revenueTrend = await api.getRevenueTrend(7);
      setRevenueData({
        labels: revenueTrend.map(d => new Date(d.date).toLocaleDateString('pl')),
        datasets: [
          {
            label: 'Total Revenue',
            data: revenueTrend.map(d => d.totalRevenue),
            borderColor: '#00ff41',
            backgroundColor: 'rgba(0, 255, 65, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'AI Revenue',
            data: revenueTrend.map(d => d.aiRevenue),
            borderColor: '#0affff',
            backgroundColor: 'rgba(10, 255, 255, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      });

      // Load traffic sources
      const traffic = await api.getTrafficSources();
      setTrafficData({
        labels: ['AI SEO', 'Organic', 'Paid', 'Direct'],
        datasets: [{
          data: [traffic.aiSeo, traffic.organic, traffic.paid, traffic.direct],
          backgroundColor: ['#00ff41', '#0affff', '#ffaa00', '#ff4444']
        }]
      });

      // Load products
      const productsData = await api.getTopProducts(5);
      setProducts(productsData);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
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

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    setMessages([...messages, { text: chatInput, isAi: false }]);
    const query = chatInput;
    setChatInput('');
    
    // Query AI
    const response = await api.queryAI(query);
    setMessages((prev: Array<{text: string, isAi: boolean}>) => [...prev, { 
      text: response.response, 
      isAi: true 
    }]);
  };

  return (
    <div className="container" style={{ padding: '0 20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button type="button" onClick={onBack} className="btn" style={{ padding: '8px 16px' }}>← BACK</button>
          <h1 className="header" style={{ margin: 0 }}>🧪 PUMO Diagnosis Hub</h1>
        </div>
        {loading && <div style={{ color: 'var(--cold)', fontSize: 12 }}>⟳ Refreshing...</div>}
      </div>

      {/* Agent Status Bar */}
      <div style={{ 
        background: 'var(--panel)', 
        border: '1px solid var(--line)', 
        padding: 15, 
        marginBottom: 20,
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        borderRadius: 4
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 'bold' }}>AGENTS:</div>
        {agents.map(agent => (
          <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: agent.status === 'active' ? 'var(--hot)' : agent.status === 'error' ? 'var(--bad)' : 'var(--muted)' 
            }} />
            <span style={{ fontSize: 11, color: 'var(--text)' }}>{agent.name}</span>
            <span style={{ fontSize: 9, color: 'var(--faint)' }}>({agent.lastRun})</span>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: 15,
        marginBottom: 20
      }}>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.totalRevenue.toLocaleString()}</div>
          <div className="kpi-label" style={kpiLabelStyle}>Total Revenue</div>
          <div style={{ ...kpiChangeStyle, color: kpis.revenueChange > 0 ? 'var(--hot)' : 'var(--bad)' }}>
            {kpis.revenueChange > 0 ? '↑' : '↓'}{Math.abs(kpis.revenueChange).toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.aiShare.toFixed(1)}%</div>
          <div className="kpi-label" style={kpiLabelStyle}>AI Revenue Share</div>
        </div>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.conversionRate.toFixed(2)}%</div>
          <div className="kpi-label" style={kpiLabelStyle}>Conversion Rate</div>
        </div>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.totalClicks.toLocaleString()}</div>
          <div className="kpi-label" style={kpiLabelStyle}>Total Clicks</div>
        </div>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.ragHitrate.toFixed(1)}%</div>
          <div className="kpi-label" style={kpiLabelStyle}>RAG Hit Rate</div>
        </div>
        <div className="kpi-card" style={kpiCardStyle}>
          <div className="kpi-value" style={kpiValueStyle}>{kpis.apiUptime.toFixed(1)}%</div>
          <div className="kpi-label" style={kpiLabelStyle}>API Uptime</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="chart-container" style={chartContainerStyle}>
          <h3 style={chartHeaderStyle}>💰 Revenue Trend (7 days)</h3>
          <div style={{ height: 300 }}>
            {revenueData ? (
              <Line data={revenueData} options={chartOptions} />
            ) : (
              <div style={loadingChartStyle}>
                Loading chart...
              </div>
            )}
          </div>
        </div>
        <div className="chart-container" style={chartContainerStyle}>
          <h3 style={chartHeaderStyle}>📊 Traffic Sources</h3>
          <div style={{ height: 300 }}>
            {trafficData ? (
              <Doughnut data={trafficData} options={trafficOptions} />
            ) : (
              <div style={loadingChartStyle}>
                Loading chart...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="chart-container" style={chartContainerStyle}>
        <h3 style={chartHeaderStyle}>🏆 Top Products (Clicks & Revenue)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
              <th style={{ padding: 10 }}>#</th>
              <th style={{ padding: 10 }}>Product</th>
              <th style={{ padding: 10 }}>Category</th>
              <th style={{ padding: 10 }}>Clicks</th>
              <th style={{ padding: 10 }}>CTR</th>
              <th style={{ padding: 10 }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 10 }}><strong>{i + 1}</strong></td>
                  <td style={{ padding: 10 }}>{p.name}</td>
                  <td style={{ padding: 10 }}>{p.category}</td>
                  <td style={{ padding: 10 }}>{p.clicks.toLocaleString()}</td>
                  <td style={{ padding: 10 }}>{p.ctr.toFixed(1)}%</td>
                  <td style={{ padding: 10, color: 'var(--hot)', fontWeight: 'bold' }}>
                    {p.revenue.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                  Loading products...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI Chat */}
      <div className="ai-chat" style={chartContainerStyle}>
        <h3 style={chartHeaderStyle}>🤖 AI Analyst (Real-time Insights)</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 10, fontSize: 13 }}>
          Analizuje dane z D1 + Cloudflare + Pumo API. Pytaj o wszystko.
        </p>
        <div className="chat-messages" style={{ 
          height: 200, 
          overflowY: 'auto', 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: 10,
          marginBottom: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.isAi ? 'flex-start' : 'flex-end',
              background: msg.isAi ? 'rgba(0, 255, 65, 0.1)' : 'rgba(10, 255, 255, 0.1)',
              border: `1px solid ${msg.isAi ? 'var(--hot)' : 'var(--cold)'}`,
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 13,
              maxWidth: '80%'
            }}>
              <strong style={{ display: 'block', fontSize: 10, opacity: 0.7, marginBottom: 2 }}>
                {msg.isAi ? 'AI ANALYST' : 'YOU'}
              </strong>
              {msg.text}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="chat-input"
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--line)', 
              color: 'var(--text)',
              padding: '8px 12px',
              borderRadius: 4
            }}
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
    </div>
  )
}

// Inline styles for porting ease
const kpiCardStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  padding: '15px',
  borderRadius: '4px',
  position: 'relative' as const
};
const kpiValueStyle = { fontSize: '24px', fontWeight: 900, color: 'var(--text)' };
const kpiLabelStyle = { fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '1px' };
const kpiChangeStyle = { fontSize: '12px', fontWeight: 'bold', marginTop: '5px' };
const chartContainerStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  padding: '20px',
  borderRadius: '4px',
  marginBottom: '20px'
};
const chartHeaderStyle = { margin: '0 0 15px 0', fontSize: '14px', color: 'var(--text)', borderBottom: '1px solid var(--line)', paddingBottom: '10px' };
const loadingChartStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' };
