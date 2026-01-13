import { useEffect, useState } from "react";
import { 
  KpiCard, 
  RevenueChart, 
  TrafficPie, 
  TopProductsTable, 
  AiChat, 
  type Product 
} from "@jimbo77/ui";

// Mock Data for Initial Render
const MOCK_REVENUE_DATA = {
  labels: ['01/01', '02/01', '03/01', '04/01', '05/01', '06/01', '07/01'],
  datasets: [
    {
      label: 'Total Revenue',
      data: [15000, 22000, 18000, 25000, 30000, 28000, 35000],
      borderColor: '#00ff41',
      backgroundColor: '#00ff4120',
      fill: true,
    },
    {
      label: 'AI Revenue',
      data: [8000, 14000, 11000, 17000, 21000, 19000, 24000],
      borderColor: '#0affff',
      backgroundColor: '#0affff20',
      fill: true,
    }
  ]
};

const MOCK_TRAFFIC_DATA = {
  labels: ['AI SEO', 'Organic', 'Paid', 'Direct'],
  datasets: [{
    data: [45, 30, 15, 10],
    backgroundColor: ['#00ff41', '#0affff', '#ffaa00', '#ff4444']
  }]
};

const MOCK_PRODUCTS: Product[] = [
  { name: 'Materac Comfort Plus', category: 'Materace', clicks: 1250, ctr: 4.8, revenue: 45000 },
  { name: 'Szafa Classic Oak', category: 'Szafy', clicks: 980, ctr: 3.2, revenue: 32000 },
  { name: 'Fotel Relax Pro', category: 'Fotele', clicks: 856, ctr: 5.1, revenue: 28500 }
];

export default function DashboardView() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      setRevenueData(MOCK_REVENUE_DATA);
      setTrafficData(MOCK_TRAFFIC_DATA);
      setProducts(MOCK_PRODUCTS);
    }, 500);
  }, []);

  const handleAiQuery = async (query: string) => {
    // Mock AI response for now
    await new Promise(r => setTimeout(r, 1000));
    return `Analysis: "${query}" is interesting. Based on data, revenue is up 8.3%.`;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "32px", 
        background: "linear-gradient(135deg, #00ff41 0%, #0affff 100%)", 
        WebkitBackgroundClip: "text", 
        WebkitTextFillColor: "transparent",
        marginBottom: "30px"
      }}>
        🧪 PUMO Diagnosis Hub
      </h2>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <KpiCard label="Total Revenue" value="284,750" change={{ value: 8.3, text: "↑8.3%" }} />
        <KpiCard label="AI Revenue Share" value="67.2%" />
        <KpiCard label="Conversion Rate" value="4.85%" change={{ value: -1.2, text: "↓1.2%" }} />
        <KpiCard label="Total Clicks" value="486" />
        <KpiCard label="RAG Hit Rate" value="95.2%" />
        <KpiCard label="API Uptime" value="99.8%" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {revenueData ? <RevenueChart data={revenueData} /> : <div className="chart-container">Loading Chart...</div>}
        {trafficData ? <TrafficPie data={trafficData} /> : <div className="chart-container">Loading Pie...</div>}
      </div>

      {/* Top Products */}
      <TopProductsTable products={products} />

      {/* AI Chat */}
      <AiChat onQuery={handleAiQuery} />
    </div>
  );
}
