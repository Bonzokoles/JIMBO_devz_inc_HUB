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
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1
          style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 1 }}
        >
          MULTI-DOMAIN ANALYTICS
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
          5 domains • {totalTraffic.toLocaleString()} total visits • $
          {totalRevenue.toLocaleString()}/month revenue
        </p>
      </div>

      {/* Time Range Selector */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {(["7d", "30d", "90d"] as const).map((range) => (
          <button
            key={range}
            className="btn"
            onClick={() => setTimeRange(range)}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: timeRange === range ? 900 : 600,
              opacity: timeRange === range ? 1 : 0.5,
            }}
          >
            {range.toUpperCase()}
          </button>
        ))}
        <button
          className="btn"
          onClick={exportToCSV}
          style={{ marginLeft: "auto", padding: "8px 16px", fontSize: 12 }}
        >
          📥 EXPORT CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            TOTAL TRAFFIC
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {totalTraffic.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>
            ↑ 12.3% vs last period
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            AVG CONVERSION
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {avgConversion.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>
            ↑ 0.8% vs last period
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            MONTHLY REVENUE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            ${totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>
            ↑ $320 vs last month
          </div>
        </div>
        <div className="card" style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            AI CRAWLERS
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {domains.reduce((sum, d) => sum + d.aiCrawlers, 0)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            Last 30 days
          </div>
        </div>
      </div>

      {/* Traffic Comparison Chart */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3
          style={{
            margin: "0 0 15px",
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          TRAFFIC COMPARISON (7 DAYS)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
            <YAxis stroke="var(--muted)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: 4,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mybonzoaiblog"
              stroke="#9d6aff"
              strokeWidth={2}
              name="mybonzoaiblog.com"
            />
            <Line
              type="monotone"
              dataKey="mybonzo"
              stroke="#6affb8"
              strokeWidth={2}
              name="mybonzo.com"
            />
            <Line
              type="monotone"
              dataKey="zenbrowsers"
              stroke="#ffb86a"
              strokeWidth={2}
              name="zenbrowsers.org"
            />
            <Line
              type="monotone"
              dataKey="jimbo77com"
              stroke="#6aa6ff"
              strokeWidth={2}
              name="jimbo77.com"
            />
            <Line
              type="monotone"
              dataKey="jimbo77org"
              stroke="#ff6a9d"
              strokeWidth={2}
              name="jimbo77.org"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Domain Performance Table */}
        <div className="card" style={{ padding: 20 }}>
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            DOMAIN PERFORMANCE
          </h3>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  DOMAIN
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  TRAFFIC
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  CONVERSION
                </th>
                <th
                  style={{
                    padding: "8px 0",
                    fontWeight: 900,
                    color: "var(--muted)",
                  }}
                >
                  REVENUE
                </th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr
                  key={domain.domain}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                    opacity: selectedDomain === domain.domain ? 1 : 0.7,
                  }}
                  onClick={() => setSelectedDomain(domain.domain)}
                >
                  <td style={{ padding: "12px 0" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: domain.color,
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{domain.domain}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>
                    {domain.currentTraffic.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 0", fontWeight: 600 }}>
                    {domain.conversionRate}%
                  </td>
                  <td
                    style={{
                      padding: "12px 0",
                      fontWeight: 700,
                      color:
                        domain.revenue > 0 ? "var(--success)" : "var(--muted)",
                    }}
                  >
                    ${domain.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Crawler Detection */}
        <div className="card" style={{ padding: 20 }}>
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            AI CRAWLERS (30D)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={aiCrawlerData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="visits"
                label={(entry) => entry.name}
              >
                {aiCrawlerData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#6aa6ff", "#ff6a9d", "#9d6aff", "#6affb8", "#ffb86a"][
                        index
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 15, fontSize: 11 }}>
            {aiCrawlerData.map((crawler, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span style={{ color: "var(--muted)" }}>{crawler.name}</span>
                <span style={{ fontWeight: 700 }}>{crawler.visits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
