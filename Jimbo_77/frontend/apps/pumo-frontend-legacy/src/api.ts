// API Base URL - points to existing Cloudflare Worker
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8001"; // Lokalny FastAPI backend

// Types
export type KPIData = {
  totalRevenue: number;
  revenueChange: number;
  aiShare: number;
  conversionRate: number;
  totalClicks: number;
  ragHitrate: number;
  apiUptime: number;
};

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

export type Product = {
  name: string;
  category: string;
  clicks: number;
  ctr: number;
  revenue: number;
  units_sold?: number;
};

export type Customer = {
  email: string;
  orders_count: number;
  total_spent: number;
  first_order?: string;
  last_order?: string;
  is_vip?: boolean;
};

export type AIAnalysis = {
  revenue_forecast: {
    next_7_days: number;
    next_30_days: number;
    confidence: number;
  };
  trends: {
    revenue_trend: string;
    seasonal_pattern: string;
  };
  recommendations: string[];
};

export type AIQueryRequest = {
  query: string;
};

export type AIQueryResponse = {
  response: string;
  confidence?: number;
  sources?: string[];
};

export type AIInsight = {
  category: string;
  insight: string;
  confidence: number;
  action?: string;
  impact?: "low" | "medium" | "high";
};

export type AIAnalysisResponse = {
  success: boolean;
  question: string;
  answer: string;
  insights: AIInsight[];
  data_points?: Array<{ label: string; value: number }>;
  recommendations?: string[];
  confidence?: number;
};

export type AutoInsightsResponse = {
  success: boolean;
  insights: AIInsight[];
  generated_at: string;
};

// Buying Guides Types
export type GenerateGuideRequest = {
  product_name: string;
  category: string;
  additional_context?: string;
};

export type BuyingGuide = {
  id: string;
  product_name: string;
  category: string;
  guide_content: string;
  key_features: string[];
  buying_tips: string[];
  recommended_products: string[];
  created_at: string;
  confidence_score?: number;
  metadata?: {
    moa_model?: string;
    processing_time?: number;
    additional_context?: string;
  };
};

// API Service
class PumoAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // Fetch KPIs (Task 1.4: removed fake data fallback)
  async getKPIs(): Promise<KPIResponse> {
    const response = await fetch(`${this.baseUrl}/v1/analytics/business-overview`);
    if (!response.ok) {
      throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
    }
    const data = await response.json();
    // Transform backend format to frontend KPIResponse
    return {
      totalRevenue: data.kpis.total_revenue,
      revenueChange: data.kpis.revenue_change_percent,
      aiShare: 67.2, // TODO: Calculate from real data
      conversionRate: data.kpis.conversion_rate,
      totalClicks: 0, // TODO: Add clicks tracking
      ragHitrate: 95.2, // TODO: Get from RAG service
      apiUptime: 99.8, // TODO: Get from health endpoint
    };
  }

  // Fetch Revenue Trend (Task 1.4: removed fake data fallback)
  async getRevenueTrend(days: number = 30): Promise<RevenueTrendResponse> {
    const response = await fetch(`${this.baseUrl}/v1/analytics/revenue-trend?days=${days}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch revenue trend: ${response.statusText}`);
    }
    const data = await response.json();
    // Transform backend format to frontend RevenueTrendResponse
    return data.revenue_trend.map((item: any) => ({
      date: item.date,
      totalRevenue: item.revenue,
      aiRevenue: item.revenue * 0.67, // TODO: Track AI-generated revenue separately
    }));
  }

  // Fetch Traffic Sources (Task 1.4: removed fake data fallback)
  async getTrafficSources(): Promise<TrafficSourcesResponse> {
    const response = await fetch(`${this.baseUrl}/v1/analytics/order-sources`);
    if (!response.ok) {
      throw new Error(`Failed to fetch traffic sources: ${response.statusText}`);
    }
    const data = await response.json();
    // Transform backend order sources to traffic sources
    return {
      aiSeo: data.order_sources?.ai_seo || 0,
      organic: data.order_sources?.organic || 0,
      paid: data.order_sources?.paid || 0,
      direct: data.order_sources?.direct || 0,
    };
  }

  // Fetch Top Products (Task 1.4: removed fake data fallback)
  async getTopProducts(limit: number = 10): Promise<ProductResponse> {
    const response = await fetch(`${this.baseUrl}/v1/analytics/top-products?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch top products: ${response.statusText}`);
    }
    const data = await response.json();
    // Transform backend format to frontend ProductResponse
    return data.top_products.map((product: any) => ({
      name: product.name,
      category: product.category || "Unknown",
      clicks: 0, // TODO: Add clicks tracking
      ctr: 0, // TODO: Calculate CTR from clicks/impressions
      revenue: product.revenue,
      units_sold: product.units_sold,
    }));
  }

  // AI Analyst Query
  async queryAI(query: string): Promise<AIQueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai-analyst`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error("Failed to query AI");
      return await response.json();
    } catch (error) {
      console.error("AI query error:", error);
      return {
        response: "AI Analyst is currently unavailable. Please try again later.",
        confidence: 0,
      };
    }
  }

  // Buying Guides API
  async generateBuyingGuide(request: GenerateGuideRequest): Promise<BuyingGuide> {
    try {
      const response = await fetch(`${this.baseUrl}/api/guides/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate guide: ${error}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Generate guide error:", error);
      throw error;
    }
  }

  async getBuyingGuides(category?: string, limit: number = 50): Promise<BuyingGuide[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      params.append("limit", limit.toString());

      const response = await fetch(`${this.baseUrl}/api/guides?${params}`);
      if (!response.ok) throw new Error("Failed to fetch guides");
      return await response.json();
    } catch (error) {
      console.error("Get guides error:", error);
      return [];
    }
  }

  async getBuyingGuide(id: string): Promise<BuyingGuide | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/guides/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch guide");
      }
      return await response.json();
    } catch (error) {
      console.error("Get guide error:", error);
      return null;
    }
  }

  async deleteBuyingGuide(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/guides/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete guide");
      return true;
    } catch (error) {
      console.error("Delete guide error:", error);
      return false;
    }
  }

  async getGuideCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/guides/categories/list`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error("Get categories error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const api = new PumoAPI();
