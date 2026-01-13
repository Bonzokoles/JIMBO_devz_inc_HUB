/**
 * PUMO Diagnosis Hub - Advanced Analytics Edition
 * Comprehensive business intelligence dashboard with AI predictions
 */

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from './api';
import type { KPIData, Product, Customer, AIAnalysis } from './api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

type AgentStatus = {
    id: string;
    name: string;
    status: 'active' | 'idle' | 'error';
    lastRun?: string;
};

type TabView = 'overview' | 'products' | 'customers' | 'ai-predictions' | 'orders';

function AppAdvanced() {
    const [activeTab, setActiveTab] = useState<TabView>('overview');
    const [kpis, setKpis] = useState<KPIData>({
        totalRevenue: 0,
        revenueChange: 0,
        aiShare: 0,
        conversionRate: 0,
        totalClicks: 0,
        ragHitrate: 0,
        apiUptime: 0,
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [aiPredictions, setAIPredictions] = useState<AIAnalysis | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<Array<{ text: string, isAi: boolean }>>([]);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [customerSegmentsData, setCustomerSegmentsData] = useState<any>(null);
    const [paymentMethodsData, setPaymentMethodsData] = useState<any>(null);
    const [orderSourcesData, setOrderSourcesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Agent statuses
    const [agents] = useState<AgentStatus[]>([
        { id: 'a1', name: 'Data Export', status: 'active', lastRun: 'running' },
        { id: 'a2', name: 'Analytics Engine', status: 'active', lastRun: '1 min ago' },
        { id: 'a3', name: 'AI Predictor', status: 'active', lastRun: '5 min ago' },
        { id: 'a4', name: 'Customer Segmentation', status: 'active', lastRun: '2 min ago' },
        { id: 'a5', name: 'Revenue Tracker', status: 'active', lastRun: '30 sec ago' },
    ]);

    // Load initial data
    useEffect(() => {
        loadAllData();
    }, []);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadAllData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load KPIs
            const kpiData = await api.getKPIs();
            setKpis(kpiData);

            // Load revenue trend
            const revenueTrend = await api.getRevenueTrend(30);
            setRevenueData({
                labels: revenueTrend.map(d => new Date(d.date).toLocaleDateString('pl')),
                datasets: [
                    {
                        label: 'Total Revenue',
                        data: revenueTrend.map(d => d.totalRevenue),
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: 'AI Revenue',
                        data: revenueTrend.map(d => d.aiRevenue),
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        tension: 0.4,
                        fill: true,
                    }
                ]
            });

            // Load customer segments
            const segments = await api.getCustomerSegments();
            setCustomerSegmentsData({
                labels: ['New Customers', 'Repeat Customers'],
                datasets: [{
                    data: [segments.new_customers, segments.repeat_customers],
                    backgroundColor: ['#00ff88', '#4facfe']
                }]
            });

            // Load payment methods
            const payments = await api.getPaymentMethods();
            setPaymentMethodsData({
                labels: payments.map(p => p.name),
                datasets: [{
                    data: payments.map(p => p.count),
                    backgroundColor: ['#00ff88', '#4facfe', '#ff6b6b', '#feca57', '#48dbfb']
                }]
            });

            // Load order sources
            const sources = await api.getOrderSources();
            setOrderSourcesData({
                labels: sources.map(s => s.name),
                datasets: [{
                    label: 'Orders',
                    data: sources.map(s => s.count),
                    backgroundColor: ['#00ff88', '#4facfe', '#ff6b6b', '#feca57']
                }]
            });

            // Load products
            const productsData = await api.getTopProducts(10);
            setProducts(productsData);

            // Load customers
            const customersData = await api.getTopCustomers(20);
            setCustomers(customersData);

            // Load AI predictions
            const predictions = await api.getAIPredictions();
            setAIPredictions(predictions);

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

    const doughnutOptions = {
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
        setMessages((prev: Array<{ text: string, isAi: boolean }>) => [...prev, {
            text: response.response,
            isAi: true
        }]);
    };

    return (
        <div className="container">
            {/* Header with Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 className="header" style={{ margin: 0 }}>🧪 PUMO Diagnosis Hub - Advanced Analytics</h1>
                {loading && <div style={{ color: 'var(--cold)', fontSize: 12 }}>⟳ Refreshing...</div>}
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: 10,
                marginBottom: 20,
                borderBottom: '1px solid var(--line)',
                paddingBottom: 10
            }}>
                {(['overview', 'products', 'customers', 'orders', 'ai-predictions'] as TabView[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'var(--hot)' : 'var(--panel)',
                            color: activeTab === tab ? '#000' : 'var(--text)',
                            border: '1px solid var(--line)',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            borderRadius: 4,
                            fontWeight: activeTab === tab ? 'bold' : 'normal'
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Agent Status Bar */}
            <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                padding: 15,
                marginBottom: 20,
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap'
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

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    {/* KPIs */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-value">{kpis.totalRevenue.toLocaleString('pl')}</div>
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
                            <div className="kpi-value">{customers.length}</div>
                            <div className="kpi-label">Total Customers</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-value">{customers.filter(c => c.is_vip).length}</div>
                            <div className="kpi-label">VIP Customers</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-value">{products.length}</div>
                            <div className="kpi-label">Top Products</div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
                        <div className="chart-container">
                            <h3>💰 Revenue Trend (30 days)</h3>
                            <div style={{ height: 300 }}>
                                {revenueData ? (
                                    <Line data={revenueData} options={chartOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        Loading chart...
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="chart-container">
                            <h3>👥 Customer Segments</h3>
                            <div style={{ height: 300 }}>
                                {customerSegmentsData ? (
                                    <Doughnut data={customerSegmentsData} options={doughnutOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        Loading chart...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                        <div className="chart-container">
                            <h3>💳 Payment Methods</h3>
                            <div style={{ height: 300 }}>
                                {paymentMethodsData ? (
                                    <Doughnut data={paymentMethodsData} options={doughnutOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        Loading chart...
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="chart-container">
                            <h3>📦 Order Sources</h3>
                            <div style={{ height: 300 }}>
                                {orderSourcesData ? (
                                    <Bar data={orderSourcesData} options={chartOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                                        Loading chart...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
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
                            {products.length > 0 ? (
                                products.map((p, i) => (
                                    <tr key={i}>
                                        <td><strong>{i + 1}</strong></td>
                                        <td>{p.name}</td>
                                        <td>{p.category}</td>
                                        <td>{p.clicks.toLocaleString()}</td>
                                        <td>{p.ctr.toFixed(1)}%</td>
                                        <td style={{ color: 'var(--hot)', fontWeight: 'bold' }}>
                                            {p.revenue.toLocaleString('pl')} PLN
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                        Loading products...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
                <div className="chart-container">
                    <h3>👥 Top Customers (by Total Spent)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Email</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>First Order</th>
                                <th>Last Order</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? (
                                customers.map((c, i) => (
                                    <tr key={i}>
                                        <td><strong>{i + 1}</strong></td>
                                        <td>{c.email}</td>
                                        <td>{c.orders_count}</td>
                                        <td style={{ color: c.is_vip ? 'var(--hot)' : 'var(--text)', fontWeight: 'bold' }}>
                                            {c.total_spent.toLocaleString('pl')} PLN
                                        </td>
                                        <td>{c.first_order ? new Date(c.first_order).toLocaleDateString('pl') : '-'}</td>
                                        <td>{c.last_order ? new Date(c.last_order).toLocaleDateString('pl') : '-'}</td>
                                        <td>
                                            {c.is_vip ? (
                                                <span style={{ background: 'var(--hot)', color: '#000', padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 'bold' }}>
                                                    VIP
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--muted)', fontSize: 10 }}>Regular</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                                        Loading customers...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* AI PREDICTIONS TAB */}
            {activeTab === 'ai-predictions' && aiPredictions && (
                <div style={{ display: 'grid', gap: 20 }}>
                    <div className="chart-container">
                        <h3>🤖 AI Revenue Forecast</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: 10 }}>Next 7 Days</p>
                                <div className="kpi-value" style={{ color: 'var(--hot)' }}>
                                    {aiPredictions.revenue_forecast.next_7_days.toLocaleString('pl')} PLN
                                </div>
                                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 5 }}>
                                    Confidence: {(aiPredictions.revenue_forecast.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div>
                                <p style={{ color: 'var(--muted)', marginBottom: 10 }}>Next 30 Days</p>
                                <div className="kpi-value" style={{ color: 'var(--hot)' }}>
                                    {aiPredictions.revenue_forecast.next_30_days.toLocaleString('pl')} PLN
                                </div>
                                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 5 }}>
                                    Confidence: {(aiPredictions.revenue_forecast.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>📊 Trend Analysis</h3>
                        <div style={{ display: 'grid', gap: 10 }}>
                            <div>
                                <strong>Revenue Trend:</strong> <span style={{ color: 'var(--hot)' }}>{aiPredictions.trends.revenue_trend}</span>
                            </div>
                            <div>
                                <strong>Seasonal Pattern:</strong> <span style={{ color: 'var(--cold)' }}>{aiPredictions.trends.seasonal_pattern}</span>
                            </div>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>💡 AI Recommendations</h3>
                        <ul style={{ lineHeight: 1.8 }}>
                            {aiPredictions.recommendations.map((rec, i) => (
                                <li key={i} style={{ color: 'var(--text)' }}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* AI Chat (available on all tabs) */}
            <div className="ai-chat" style={{ marginTop: 30 }}>
                <h3>🤖 AI Analyst (Real-time Insights)</h3>
                <p style={{ color: 'var(--muted)', marginBottom: 10 }}>
                    Analizuje dane z IdoSell API + D1 + Cloudflare. Pytaj o wszystko.
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
                    placeholder="Np: 'Jakie produkty sprzedają się najlepiej?'"
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

export default AppAdvanced
