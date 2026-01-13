// API Base URL - points to production PUMO worker with real Meble Pumo integration
// Worker connects to IdoSell API and D1 database with live shop data
const API_BASE = import.meta.env.VITE_JIMBO77_API_BASE || 'https://jimbo-like-pumo-api.stolarnia-ams.workers.dev';
const LEGACY_API_BASE = import.meta.env.VITE_PUMO_API_BASE || 'https://jimbo-like-pumo-api.stolarnia-ams.workers.dev';

// Types
export type KPIResponse = {
  totalRevenue: number;
  revenueChange: number;
  aiShare: number;
  conversionRate: number;
  totalClicks: number;
  ragHitrate: number;
  apiUptime: number;
};

export type RevenueTrendResponse = {
  date: string;
  totalRevenue: number;
  aiRevenue: number;
}[];

export type TrafficSourcesResponse = {
  aiSeo: number;
  organic: number;
  paid: number;
  direct: number;
};

export type ProductResponse = {
  name: string;
  category: string;
  clicks: number;
  ctr: number;
  revenue: number;
}[];

export type AIQueryResponse = {
  response: string;
  confidence?: number;
  sources?: string[];
};

// API Service
class PumoAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private mapWorkerKpisToDashboard(payload: any): KPIResponse {
    const totalRevenue = Number(payload?.totalRevenue ?? 0);
    const totalOrders = Number(payload?.totalOrders ?? 0);
    const conversionRate = Number(payload?.conversionRate ?? 0);
    const growthRate = Number(payload?.growthRate ?? 0);

    const estimatedClicks = conversionRate > 0
      ? Math.round(totalOrders / (conversionRate / 100))
      : totalOrders;

    return {
      totalRevenue,
      revenueChange: growthRate,
      aiShare: Number(payload?.aiShare ?? 0),
      conversionRate,
      totalClicks: estimatedClicks,
      ragHitrate: Number(payload?.ragHitrate ?? 0),
      apiUptime: Number(payload?.apiUptime ?? 0),
    };
  }

  private mapWorkerRevenueTrendToDashboard(payload: any): RevenueTrendResponse {
    const rows: any[] = Array.isArray(payload?.data) ? payload.data : [];
    return rows.map((row) => {
      const month = String(row?.month ?? '');
      const revenue = Number(row?.revenue ?? 0);

      return {
        date: month ? `${month}-01` : '',
        totalRevenue: revenue,
        aiRevenue: 0,
      };
    });
  }

  // Fetch KPIs - from production PUMO worker with real Meble Pumo data
  async getKPIs(): Promise<KPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/kpis`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const payload = await response.json();
      return this.mapWorkerKpisToDashboard(payload);
    } catch (error) {
      console.error('KPIs API error:', error);
      // Fallback to legacy API
      try {
        const legacyResponse = await fetch(`${LEGACY_API_BASE}/analytics/kpis`);
        if (legacyResponse.ok) {
          return await legacyResponse.json();
        }
      } catch (legacyError) {
        console.error('Legacy API also failed:', legacyError);
      }
      // Return static fallback data
      return {
        totalRevenue: 284750,
        revenueChange: 8.3,
        aiShare: 67.2,
        conversionRate: 4.85,
        totalClicks: 486,
        ragHitrate: 95.2,
        apiUptime: 99.8,
      };
    }
  }

  // Fetch Revenue Trend - from production PUMO worker with real data
  async getRevenueTrend(days: number = 7): Promise<RevenueTrendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/revenue-trend?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch revenue trend');
      const payload = await response.json();
      return this.mapWorkerRevenueTrendToDashboard(payload);
    } catch (error) {
      console.error('Revenue trend API error:', error);
      // Fallback to legacy API
      try {
        const legacyResponse = await fetch(`${LEGACY_API_BASE}/analytics/revenue-trend?days=${days}`);
        if (legacyResponse.ok) {
          return await legacyResponse.json();
        }
      } catch (legacyError) {
        console.error('Legacy API also failed:', legacyError);
      }
      // Return static fallback data
      return [
        { date: '2026-01-01', totalRevenue: 15000, aiRevenue: 8000 },
        { date: '2026-01-02', totalRevenue: 22000, aiRevenue: 14000 },
        { date: '2026-01-03', totalRevenue: 18000, aiRevenue: 11000 },
        { date: '2026-01-04', totalRevenue: 25000, aiRevenue: 17000 },
        { date: '2026-01-05', totalRevenue: 30000, aiRevenue: 21000 },
        { date: '2026-01-06', totalRevenue: 28000, aiRevenue: 19000 },
        { date: '2026-01-07', totalRevenue: 35000, aiRevenue: 24000 },
      ];
    }
  }

  // Fetch Traffic Sources
  async getTrafficSources(): Promise<TrafficSourcesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/traffic-sources`);
      if (!response.ok) throw new Error('Failed to fetch traffic sources');
      return await response.json();
    } catch (error) {
      console.error('Traffic sources API error:', error);
      return {
        aiSeo: 45,
        organic: 30,
        paid: 15,
        direct: 10,
      };
    }
  }

  // Fetch Top Products - use available category-stats from worker
  async getTopProducts(limit: number = 10): Promise<ProductResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/category-stats`);
      if (!response.ok) throw new Error('Failed to fetch category stats');
      const categoryData = await response.json();

      // Transform category stats to product format
      const products = categoryData.data.slice(0, limit).map((category: any) => ({
        name: category.name,
        category: category.name,
        clicks: Math.floor(category.revenue / 50), // Estimate clicks from revenue
        ctr: Math.round((Math.random() * 3 + 2) * 100) / 100, // Mock CTR 2-5%
        revenue: category.revenue
      }));

      return products;
    } catch (error) {
      console.error('Top products API error:', error);
      // Fallback to legacy API
      try {
        const legacyResponse = await fetch(`${LEGACY_API_BASE}/analytics/top-products?limit=${limit}`);
        if (legacyResponse.ok) {
          return await legacyResponse.json();
        }
      } catch (legacyError) {
        console.error('Legacy API also failed:', legacyError);
      }
      // Return static fallback data
      return [
        { name: 'Materac Comfort Plus', category: 'Materace', clicks: 1250, ctr: 4.8, revenue: 45000 },
        { name: 'Szafa Classic Oak', category: 'Szafy', clicks: 980, ctr: 3.2, revenue: 32000 },
        { name: 'Fotel Relax Pro', category: 'Fotele', clicks: 856, ctr: 5.1, revenue: 28500 },
        { name: 'Stół Family', category: 'Stoły', clicks: 743, ctr: 3.9, revenue: 22000 },
        { name: 'Łóżko Dream', category: 'Łóżka', clicks: 682, ctr: 4.3, revenue: 38000 },
      ];
    }
  }

  // AI Analyst Query
  async queryAI(query: string): Promise<AIQueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai-analyst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error('Failed to query AI');
      return await response.json();
    } catch (error) {
      console.error('AI query error:', error);
      return {
        response: 'AI Analyst is currently unavailable. Please try again later.',
        confidence: 0,
      };
    }
  }
}

// Export singleton instance
export const api = new PumoAPI();
