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
import { api } from './api';
import type { KPIData, Product, Customer, AIAnalysis, AIInsight, AIAnalysisResponse, AutoInsightsResponse } from './api';

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

type TabView = 'overview' | 'products' | 'customers' | 'ai-predictions' | 'orders' | 'ai-analysis' | 'buying-guides';

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
    const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
    const [aiQuestion, setAIQuestion] = useState('');
    const [aiAnswer, setAIAnswer] = useState<AIAnalysisResponse | null>(null);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<Array<{ text: string, isAi: boolean }>>([]);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [customerSegmentsData, setCustomerSegmentsData] = useState<any>(null);
    const [paymentMethodsData, setPaymentMethodsData] = useState<any>(null);
    const [orderSourcesData, setOrderSourcesData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Buying Guides state
    const [buyingGuides, setBuyingGuides] = useState<any[]>([]);
    const [guideProductName, setGuideProductName] = useState('');
    const [guideCategory, setGuideCategory] = useState('');
    const [guideContext, setGuideContext] = useState('');
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState<any>(null);

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
        loadAutoInsights();
    }, []);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadAllData();
            loadAutoInsights();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const loadAutoInsights = async () => {
        try {
            const insightsData = await api.getAutoInsights();
            if (insightsData.success) {
                setAIInsights(insightsData.insights);
            }
        } catch (error) {
            console.error('Failed to load auto insights:', error);
        }
    };

    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;

        setIsAIThinking(true);
        try {
            const response = await api.askAI(aiQuestion);
            setAIAnswer(response);
        } catch (error) {
            console.error('AI question failed:', error);
        } finally {
            setIsAIThinking(false);
        }
    };

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

    // Buying Guides Functions
    const loadBuyingGuides = async () => {
        try {
            const guides = await api.getBuyingGuides();
            setBuyingGuides(guides);
        } catch (error) {
            console.error('Failed to load buying guides:', error);
        }
    };

    const handleGenerateGuide = async () => {
        if (!guideProductName.trim() || !guideCategory.trim()) {
            alert('Podaj nazwę produktu i kategorię');
            return;
        }

        setIsGeneratingGuide(true);
        try {
            const newGuide = await api.generateBuyingGuide({
                product_name: guideProductName,
                category: guideCategory,
                additional_context: guideContext || undefined
            });

            setSelectedGuide(newGuide);
            setBuyingGuides([newGuide, ...buyingGuides]);

            // Clear form
            setGuideProductName('');
            setGuideCategory('');
            setGuideContext('');

            alert('Poradnik wygenerowany! 🎉');
        } catch (error) {
            console.error('Failed to generate guide:', error);
            alert('Błąd generowania poradnika');
        } finally {
            setIsGeneratingGuide(false);
        }
    };

    // Load guides when tab changes
    useEffect(() => {
        if (activeTab === 'buying-guides') {
            loadBuyingGuides();
        }
    }, [activeTab]);

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

            {/* AI ANALYSIS TAB - NEW! */}
            {activeTab === 'ai-analysis' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {/* AI Question Interface */}
                    <div className="chart-container">
                        <h3>🧠 AI Business Analyst</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 15 }}>
                            Zadaj pytanie o dane biznesowe - AI przeanalizuje wszystkie metryki i udzieli odpowiedzi
                        </p>

                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <input
                                type="text"
                                value={aiQuestion}
                                onChange={(e) => setAIQuestion(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                                placeholder="Np: Dlaczego sprzedaż spadła w ostatnim tygodniu?"
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    background: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: 8,
                                    color: '#fff',
                                    fontSize: 14
                                }}
                                disabled={isAIThinking}
                            />
                            <button
                                onClick={handleAskAI}
                                disabled={isAIThinking || !aiQuestion.trim()}
                                style={{
                                    padding: '12px 24px',
                                    background: isAIThinking ? '#333' : 'linear-gradient(135deg, #00ff88, #4facfe)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: '#000',
                                    fontWeight: 'bold',
                                    cursor: isAIThinking ? 'wait' : 'pointer',
                                    opacity: isAIThinking || !aiQuestion.trim() ? 0.5 : 1
                                }}
                            >
                                {isAIThinking ? '🤔 Analizuję...' : '🔍 Analizuj'}
                            </button>
                        </div>

                        {/* Quick Question Buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                'Którzy klienci są najbardziej wartościowi?',
                                'Jakie produkty mają najlepszą marżę?',
                                'Dlaczego sprzedaż spadła?',
                                'Które kategorie rosną najszybciej?'
                            ].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => { setAIQuestion(q); }}
                                    style={{
                                        padding: '6px 12px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: 6,
                                        color: '#aaa',
                                        fontSize: 12,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* AI Answer */}
                        {aiAnswer && aiAnswer.success && (
                            <div style={{ marginTop: 20, padding: 20, background: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                                    <span style={{ fontSize: 24 }}>🤖</span>
                                    <div>
                                        <strong style={{ color: '#00ff88' }}>AI Answer</strong>
                                        <div style={{ fontSize: 11, color: '#666' }}>
                                            Confidence: {((aiAnswer.confidence || 0.85) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                                <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#e0e0e0' }}>
                                    {aiAnswer.answer}
                                </div>

                                {/* Insights from answer */}
                                {aiAnswer.insights && aiAnswer.insights.length > 0 && (
                                    <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #333' }}>
                                        <strong style={{ color: '#4facfe' }}>💡 Key Insights:</strong>
                                        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                                            {aiAnswer.insights.map((insight, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: 12,
                                                        background: '#0f0f0f',
                                                        borderLeft: `3px solid ${insight.impact === 'high' ? '#ff6b6b' :
                                                            insight.impact === 'medium' ? '#feca57' :
                                                                '#4facfe'
                                                            }`,
                                                        borderRadius: 4
                                                    }}
                                                >
                                                    <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 'bold' }}>
                                                        {insight.category.toUpperCase()}
                                                    </div>
                                                    <div style={{ marginTop: 5 }}>{insight.insight}</div>
                                                    {insight.action && (
                                                        <div style={{ marginTop: 8, color: '#feca57', fontSize: 13 }}>
                                                            ➜ {insight.action}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {aiAnswer.recommendations && aiAnswer.recommendations.length > 0 && (
                                    <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #333' }}>
                                        <strong style={{ color: '#feca57' }}>📋 Recommendations:</strong>
                                        <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                                            {aiAnswer.recommendations.map((rec, i) => (
                                                <li key={i} style={{ marginBottom: 8, color: '#ccc' }}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Auto-Generated Insights */}
                    <div className="chart-container">
                        <h3>🎯 Auto-Generated Insights</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 15 }}>
                            AI automatycznie analizuje dane co 60 sekund i generuje insighty
                        </p>

                        {aiInsights.length > 0 ? (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {aiInsights.slice(0, 8).map((insight, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: 15,
                                            background: '#1a1a1a',
                                            borderRadius: 8,
                                            border: '1px solid #333',
                                            borderLeft: `4px solid ${insight.impact === 'high' ? '#ff6b6b' :
                                                insight.impact === 'medium' ? '#feca57' :
                                                    '#00ff88'
                                                }`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 'bold',
                                                color: '#00ff88',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1
                                            }}>
                                                {insight.category}
                                            </span>
                                            <span style={{
                                                fontSize: 11,
                                                color: '#666',
                                                background: '#0f0f0f',
                                                padding: '2px 8px',
                                                borderRadius: 4
                                            }}>
                                                {(insight.confidence * 100).toFixed(0)}% confidence
                                            </span>
                                        </div>
                                        <div style={{ color: '#e0e0e0', lineHeight: 1.6, marginBottom: 8 }}>
                                            {insight.insight}
                                        </div>
                                        {insight.action && (
                                            <div style={{
                                                marginTop: 10,
                                                padding: 10,
                                                background: '#0f0f0f',
                                                borderRadius: 4,
                                                color: '#feca57',
                                                fontSize: 13
                                            }}>
                                                <strong>Action:</strong> {insight.action}
                                            </div>
                                        )}
                                        <div style={{
                                            marginTop: 8,
                                            fontSize: 11,
                                            color: insight.impact === 'high' ? '#ff6b6b' :
                                                insight.impact === 'medium' ? '#feca57' : '#4facfe'
                                        }}>
                                            Impact: {insight.impact?.toUpperCase() || 'MEDIUM'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                                Loading insights...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BUYING GUIDES TAB */}
            {activeTab === 'buying-guides' && (
                <div style={{ display: 'grid', gap: 20 }}>
                    {/* Generator Form */}
                    <div className="chart-container">
                        <h3>🤖 Generuj Poradnik Zakupowy (LUCJAN MOA v3.0)</h3>
                        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                            Wykorzystuje Multi-Agent Orchestration (GPT-4 + DeepSeek + Gemini 2.0) do stworzenia kompletnego przewodnika zakupowego
                        </p>

                        <div style={{ display: 'grid', gap: 15, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, color: '#00ff88', fontSize: 13 }}>
                                    Nazwa produktu *
                                </label>
                                <input
                                    type="text"
                                    value={guideProductName}
                                    onChange={(e) => setGuideProductName(e.target.value)}
                                    placeholder="Np: Materac piankowy 160x200"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: 8,
                                        color: '#fff',
                                        fontSize: 14
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, color: '#00ff88', fontSize: 13 }}>
                                    Kategoria *
                                </label>
                                <input
                                    type="text"
                                    value={guideCategory}
                                    onChange={(e) => setGuideCategory(e.target.value)}
                                    placeholder="Np: Materace"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: 8,
                                        color: '#fff',
                                        fontSize: 14
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, color: '#4facfe', fontSize: 13 }}>
                                    Dodatkowy kontekst (opcjonalnie)
                                </label>
                                <textarea
                                    value={guideContext}
                                    onChange={(e) => setGuideContext(e.target.value)}
                                    placeholder="Dodatkowe informacje, wymagania specjalne, target audience..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: 8,
                                        color: '#fff',
                                        fontSize: 14,
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleGenerateGuide}
                                disabled={isGeneratingGuide || !guideProductName || !guideCategory}
                                style={{
                                    padding: '14px 24px',
                                    background: isGeneratingGuide ? '#333' : 'linear-gradient(135deg, #00ff88, #4facfe)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: '#000',
                                    fontSize: 15,
                                    fontWeight: 'bold',
                                    cursor: isGeneratingGuide ? 'wait' : 'pointer',
                                    opacity: isGeneratingGuide || !guideProductName || !guideCategory ? 0.5 : 1
                                }}
                            >
                                {isGeneratingGuide ? '🤖 Generuję z MOA... (może potrwać ~1 min)' : '✨ Generuj Poradnik (MOA v3.0)'}
                            </button>
                        </div>

                        {isGeneratingGuide && (
                            <div style={{
                                padding: 15,
                                background: '#1a1a1a',
                                borderRadius: 8,
                                border: '1px solid #333',
                                textAlign: 'center'
                            }}>
                                <div style={{ marginBottom: 10 }}>🔄 Multi-Agent Orchestration w toku...</div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                    Agent 1 (GPT-4): Analiza trendy rynkowe<br />
                                    Agent 2 (DeepSeek): Szczegóły techniczne<br />
                                    Synthesis (Gemini 2.0): Kompletny poradnik
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Guide Display */}
                    {selectedGuide && (
                        <div className="chart-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <h3>📖 {selectedGuide.product_name}</h3>
                                <button
                                    onClick={() => setSelectedGuide(null)}
                                    style={{
                                        padding: '6px 12px',
                                        background: '#333',
                                        border: 'none',
                                        borderRadius: 6,
                                        color: '#aaa',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕ Zamknij
                                </button>
                            </div>

                            <div style={{
                                padding: 15,
                                background: '#1a1a1a',
                                borderRadius: 8,
                                border: '1px solid #333',
                                marginBottom: 15
                            }}>
                                <div style={{ marginBottom: 10 }}>
                                    <span style={{ color: '#00ff88', fontSize: 12 }}>Kategoria:</span>{' '}
                                    {selectedGuide.category}
                                </div>
                                {selectedGuide.confidence_score && (
                                    <div style={{ marginBottom: 10 }}>
                                        <span style={{ color: '#4facfe', fontSize: 12 }}>Confidence:</span>{' '}
                                        {(selectedGuide.confidence_score * 100).toFixed(0)}%
                                    </div>
                                )}
                                {selectedGuide.metadata?.moa_model && (
                                    <div style={{ fontSize: 11, color: '#666' }}>
                                        Model: {selectedGuide.metadata.moa_model} |
                                        Czas: {selectedGuide.metadata.processing_time}ms
                                    </div>
                                )}
                            </div>

                            {/* Guide Content */}
                            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, marginBottom: 20 }}>
                                {selectedGuide.guide_content}
                            </div>

                            {/* Key Features */}
                            {selectedGuide.key_features?.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ color: '#00ff88', marginBottom: 10 }}>🔑 Kluczowe Cechy</h4>
                                    <ul style={{ paddingLeft: 20 }}>
                                        {selectedGuide.key_features.map((feature: string, i: number) => (
                                            <li key={i} style={{ marginBottom: 8 }}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Buying Tips */}
                            {selectedGuide.buying_tips?.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ color: '#feca57', marginBottom: 10 }}>💡 Wskazówki Zakupowe</h4>
                                    <ul style={{ paddingLeft: 20 }}>
                                        {selectedGuide.buying_tips.map((tip: string, i: number) => (
                                            <li key={i} style={{ marginBottom: 8 }}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommended Products */}
                            {selectedGuide.recommended_products?.length > 0 && (
                                <div>
                                    <h4 style={{ color: '#4facfe', marginBottom: 10 }}>⭐ Polecane Produkty</h4>
                                    <ul style={{ paddingLeft: 20 }}>
                                        {selectedGuide.recommended_products.map((product: string, i: number) => (
                                            <li key={i} style={{ marginBottom: 8 }}>{product}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Guides List */}
                    <div className="chart-container">
                        <h3>📚 Wygenerowane Poradniki ({buyingGuides.length})</h3>

                        {buyingGuides.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                                Brak poradników. Wygeneruj pierwszy powyżej!
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {buyingGuides.map((guide) => (
                                    <div
                                        key={guide.id}
                                        onClick={() => setSelectedGuide(guide)}
                                        style={{
                                            padding: 15,
                                            background: selectedGuide?.id === guide.id ? '#2a2a2a' : '#1a1a1a',
                                            border: selectedGuide?.id === guide.id ? '1px solid #00ff88' : '1px solid #333',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                                                    {guide.product_name}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#00ff88' }}>
                                                    {guide.category}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#666' }}>
                                                {new Date(guide.created_at).toLocaleDateString('pl')}
                                            </div>
                                        </div>
                                        {guide.confidence_score && (
                                            <div style={{
                                                marginTop: 10,
                                                fontSize: 11,
                                                color: '#4facfe'
                                            }}>
                                                Confidence: {(guide.confidence_score * 100).toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
