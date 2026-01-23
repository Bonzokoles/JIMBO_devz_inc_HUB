import React from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DomainStats {
  domain: string;
  monthlyClicks: number;
  currentTraffic: number;
  conversionRate: number;
  aiCrawlers: number;
  revenue: number;
  color: string;
}

export function MultiDomainAnalyticsView() {
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d">("30d");
  const [selectedDomain, setSelectedDomain] = React.useState<string | null>(
    null
  );

  const domains: DomainStats[] = [
    {
      domain: "jimbo77.com",
      monthlyClicks: 154,
      currentTraffic: 1247,
      conversionRate: 2.3,
      aiCrawlers: 89,
      revenue: 0,
      color: "#6aa6ff",
    },
    {
      domain: "jimbo77.org",
      monthlyClicks: 116,
      currentTraffic: 892,
      conversionRate: 1.8,
      aiCrawlers: 67,
      revenue: 0,
      color: "#ff6a9d",
    },
    {
      domain: "mybonzoaiblog.com",
      monthlyClicks: 5850,
      currentTraffic: 12430,
      conversionRate: 4.2,
      aiCrawlers: 423,
      revenue: 1250,
      color: "#9d6aff",
    },
    {
      domain: "mybonzo.com",
      monthlyClicks: 2400,
      currentTraffic: 8920,
      conversionRate: 3.5,
      aiCrawlers: 178,
      revenue: 520,
      color: "#6affb8",
    },
    {
      domain: "zenbrowsers.org",
      monthlyClicks: 1010,
      currentTraffic: 3450,
      conversionRate: 2.9,
      aiCrawlers: 134,
      revenue: 180,
      color: "#ffb86a",
    },
  ];

  // Traffic comparison data (last 7 days)
  const trafficData = [
    {
      date: "Jan 9",
      jimbo77com: 42,
      jimbo77org: 38,
      mybonzoaiblog: 1850,
      mybonzo: 780,
      zenbrowsers: 320,
    },
    {
      date: "Jan 10",
      jimbo77com: 48,
      jimbo77org: 35,
      mybonzoaiblog: 1920,
      mybonzo: 820,
      zenbrowsers: 340,
    },
    {
      date: "Jan 11",
      jimbo77com: 51,
      jimbo77org: 40,
      mybonzoaiblog: 2100,
      mybonzo: 890,
      zenbrowsers: 380,
    },
    {
      date: "Jan 12",
      jimbo77com: 45,
      jimbo77org: 37,
      mybonzoaiblog: 1980,
      mybonzo: 850,
      zenbrowsers: 350,
    },
    {
      date: "Jan 13",
      jimbo77com: 52,
      jimbo77org: 42,
      mybonzoaiblog: 2200,
      mybonzo: 920,
      zenbrowsers: 410,
    },
    {
      date: "Jan 14",
      jimbo77com: 49,
      jimbo77org: 39,
      mybonzoaiblog: 2050,
      mybonzo: 880,
      zenbrowsers: 370,
    },
    {
      date: "Jan 15",
      jimbo77com: 50,
      jimbo77org: 41,
      mybonzoaiblog: 2180,
      mybonzo: 900,
      zenbrowsers: 390,
    },
  ];

  // AI Crawler detection
  const aiCrawlerData = [
    { name: "ClaudeBot", visits: 412 },
    { name: "ChatGPT-User", visits: 289 },
    { name: "GPTBot", visits: 156 },
    { name: "Bingbot", visits: 134 },
    { name: "Other", visits: 92 },
  ];

  const exportToCSV = () => {
    const csv = [
      [
        "Domain",
        "Monthly Clicks",
        "Current Traffic",
        "Conversion Rate",
        "AI Crawlers",
        "Revenue",
      ],
      ...domains.map((d) => [
        d.domain,
        d.monthlyClicks,
        d.currentTraffic,
        `${d.conversionRate}%`,
        d.aiCrawlers,
        `$${d.revenue}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domain-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const totalTraffic = domains.reduce((sum, d) => sum + d.currentTraffic, 0);
  const totalRevenue = domains.reduce((sum, d) => sum + d.revenue, 0);
  const avgConversion =
    domains.reduce((sum, d) => sum + d.conversionRate, 0) / domains.length;

    return (
    <div className="space-y-8 animate-fade-in text-gray-200">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-glass-border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📊</span>
            <h1 className="font-brand text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-jimbo-gold to-purple-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">
              MULTI-DOMAIN ANALYTICS
            </h1>
          </div>
          <p className="font-mono text-sm text-gray-400 tracking-wide mt-2">
            <span className="text-jimbo-gold">{domains.length}</span> DOMAINS ONLINE • 
            <span className="text-jimbo-gold ml-2">{totalTraffic.toLocaleString()}</span> TOTAL VISITS • 
            <span className="text-green-400 ml-2 shadow-green-900/50 drop-shadow-sm">${totalRevenue.toLocaleString()}/MO</span> REVENUE
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
          <div className="flex bg-black/40 rounded-md p-1 border border-white/5">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-xs font-bold tracking-wider transition-all duration-300 rounded-md ${
                  timeRange === range
                    ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(59,130,246,0.3)] border border-primary/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider text-jimbo-gold border border-jimbo-gold/30 rounded-md hover:bg-jimbo-gold/10 transition-all duration-300 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
          >
            <span>📥</span> EXPORT
          </button>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-primary relative overflow-hidden group hover:border-l-primary-glow transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">👥</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Total Traffic</div>
          <div className="text-4xl font-display text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {totalTraffic.toLocaleString()}
          </div>
          <div className="text-xs font-mono text-green-400 mt-2 flex items-center gap-1">
            <span>↑</span> 12.3% vs last period
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-purple-500 relative overflow-hidden group hover:border-l-purple-400 transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🎯</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Avg Conversion</div>
          <div className="text-4xl font-display text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            {avgConversion.toFixed(1)}<span className="text-2xl opacity-70">%</span>
          </div>
          <div className="text-xs font-mono text-green-400 mt-2 flex items-center gap-1">
            <span>↑</span> 0.8% vs last period
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-green-500 relative overflow-hidden group hover:border-l-green-400 transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">💰</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">Monthly Revenue</div>
          <div className="text-4xl font-display text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs font-mono text-green-400 mt-2 flex items-center gap-1">
            <span>↑</span> $320 vs last month
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-jimbo-gold relative overflow-hidden group hover:border-l-yellow-400 transition-all duration-300">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🤖</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">AI Crawlers</div>
          <div className="text-4xl font-display text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            {domains.reduce((sum, d) => sum + d.aiCrawlers, 0)}
          </div>
          <div className="text-xs font-mono text-jimbo-gold/80 mt-2 flex items-center gap-1">
            <span>●</span> Active Scanning (30d)
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Traffic Chart */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-xl border border-white/5 shadow-glass">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-brand text-xl text-white tracking-widest flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
              TRAFFIC COMPARISON (7 DAYS)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11, 15, 25, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    color: '#fff'
                  }}
                  itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line type="monotone" dataKey="mybonzoaiblog" stroke="#9d6aff" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="mybonzoaiblog.com" />
                <Line type="monotone" dataKey="mybonzo" stroke="#6affb8" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="mybonzo.com" />
                <Line type="monotone" dataKey="zenbrowsers" stroke="#ffb86a" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="zenbrowsers.org" />
                <Line type="monotone" dataKey="jimbo77com" stroke="#6aa6ff" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="jimbo77.com" />
                <Line type="monotone" dataKey="jimbo77org" stroke="#ff6a9d" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} name="jimbo77.org" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Domain Performance Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
             <h3 className="font-brand text-xl text-white tracking-widest flex items-center gap-2">
              <span className="w-2 h-6 bg-jimbo-gold rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]"></span>
              DOMAIN PERFORMANCE
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-xs text-gray-400 font-bold tracking-wider uppercase border-b border-white/5">
                  <th className="p-4 pl-6">Domain</th>
                  <th className="p-4">Traffic</th>
                  <th className="p-4">Conv. Rate</th>
                  <th className="p-4 pr-6 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {domains.map((domain) => (
                  <tr
                    key={domain.domain}
                    onClick={() => setSelectedDomain(domain.domain)}
                    className={`group cursor-pointer transition-colors duration-200 ${
                       selectedDomain === domain.domain ? 'bg-primary/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full shadow-[0_0_8px]`}
                          style={{ backgroundColor: domain.color, boxShadow: `0 0 8px ${domain.color}` }}
                        />
                        <span className="font-mono text-sm text-gray-200 font-bold group-hover:text-white transition-colors">
                          {domain.domain}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 font-mono">
                      {domain.currentTraffic.toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-300 font-mono">
                      <span className={`${domain.conversionRate > 3 ? 'text-green-400' : 'text-gray-400'}`}>
                        {domain.conversionRate}%
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right font-mono text-sm">
                      <span className={domain.revenue > 0 ? "text-green-400 drop-shadow-sm font-bold" : "text-gray-600"}>
                        ${domain.revenue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Crawler Distribution */}
        <div className="glass-panel p-6 rounded-xl border border-white/5">
           <h3 className="font-brand text-xl text-white tracking-widest flex items-center gap-2 mb-6">
              <span className="w-2 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
              AI CRAWLERS (30D)
            </h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiCrawlerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="visits"
                  stroke="none"
                >
                  {aiCrawlerData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                    background: 'rgba(11, 15, 25, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display text-white">
                    {aiCrawlerData.reduce((a,b) => a + b.visits, 0)}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">HITS</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            {aiCrawlerData.map((crawler, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs group">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][idx % 5] }}></div>
                   <span className="text-gray-400 group-hover:text-white transition-colors">{crawler.name}</span>
                </div>
                <span className="font-mono font-bold text-gray-300">{crawler.visits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
