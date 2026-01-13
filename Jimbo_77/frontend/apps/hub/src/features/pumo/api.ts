// API Base URL - points to existing Cloudflare Worker
// In development/production within the Hub, we point to the deployed worker
const API_BASE = import.meta.env.VITE_PUMO_API_BASE || 'https://jimbo-like-pumo-api.stolarnia-ams.workers.dev';

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

  // Fetch KPIs
  async getKPIs(): Promise<KPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/kpis`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      return await response.json();
    } catch (error) {
      console.error('KPIs API error:', error);
      // Return fallback data
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

  // Fetch Revenue Trend
  async getRevenueTrend(days: number = 30): Promise<RevenueTrendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/revenue-trend?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch revenue trend');
      return await response.json();
    } catch (error) {
      console.error('Revenue trend API error:', error);
      // Return fallback data
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
      const response = await fetch(`${this.baseUrl}/analytics/traffic-sources`);
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

  // Fetch Top Products
  async getTopProducts(limit: number = 10): Promise<ProductResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/top-products?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top products');
      return await response.json();
    } catch (error) {
      console.error('Top products API error:', error);
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
