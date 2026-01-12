import { Env } from '../types';

interface DailyMetrics {
  date: string;
  total_views: number;
  unique_visitors: number;
  product_clicks: number;
  guide_views: number;
  ai_seo_clicks: number;
  conversion_rate: number;
  revenue: number;
}

export class AnalyticsAggregator {
  constructor(private env: Env) {}

  async getDailyMetrics(days: number = 30): Promise<DailyMetrics[]> {
    const { results } = await this.env.DB.prepare(`
      WITH daily_stats AS (
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_events,
          COUNT(DISTINCT session_id) as unique_sessions,
          SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks,
          SUM(CASE WHEN event_type = 'guide_view' THEN 1 ELSE 0 END) as guide_views,
          SUM(CASE WHEN event_type = 'click' AND utm_source = 'mybonzo' THEN 1 ELSE 0 END) as ai_clicks,
          SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchases
        FROM analytics_events
        WHERE timestamp >= date('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
      ),
      daily_revenue AS (
        SELECT 
          DATE(ae.timestamp) as date,
          SUM(p.price) as revenue
        FROM analytics_events ae
        JOIN products p ON ae.product_id = p.id
        WHERE ae.event_type = 'purchase'
          AND ae.timestamp >= date('now', '-' || ? || ' days')
        GROUP BY DATE(ae.timestamp)
      )
      SELECT 
        ds.date,
        ds.total_events as total_views,
        ds.unique_sessions as unique_visitors,
        ds.clicks as product_clicks,
        ds.guide_views,
        ds.ai_clicks as ai_seo_clicks,
        ROUND(CAST(ds.purchases AS FLOAT) / NULLIF(ds.clicks, 0) * 100, 2) as conversion_rate,
        COALESCE(dr.revenue, 0) as revenue
      FROM daily_stats ds
      LEFT JOIN daily_revenue dr ON ds.date = dr.date
      ORDER BY ds.date DESC
    `).bind(days, days).all();

    return results as DailyMetrics[];
  }

  async getTopProducts(limit: number = 20): Promise<any[]> {
    const { results } = await this.env.DB.prepare(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN ae.event_type = 'click' THEN 1 END) as clicks,
        ROUND(
          CAST(COUNT(CASE WHEN ae.event_type = 'click' THEN 1 END) AS FLOAT) / 
          NULLIF(COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END), 0) * 100, 
          2
        ) as ctr,
        SUM(CASE WHEN ae.event_type = 'purchase' THEN p.price ELSE 0 END) as revenue
      FROM products p
      LEFT JOIN analytics_events ae ON p.id = ae.product_id
      WHERE ae.timestamp >= date('now', '-30 days')
      GROUP BY p.id, p.name, p.category
      HAVING clicks > 0
      ORDER BY clicks DESC, revenue DESC
      LIMIT ?
    `).bind(limit).all();

    return results;
  }

  async getCategoryPerformance(): Promise<any[]> {
    const { results } = await this.env.DB.prepare(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(CASE WHEN ae.event_type = 'click' THEN 1 END) as total_clicks,
        SUM(CASE WHEN ae.event_type = 'purchase' THEN p.price ELSE 0 END) as revenue,
        AVG(p.price) as avg_price
      FROM products p
      LEFT JOIN analytics_events ae ON p.id = ae.product_id
      WHERE ae.timestamp >= date('now', '-30 days')
      GROUP BY p.category
      HAVING total_clicks > 0
      ORDER BY revenue DESC, total_clicks DESC
    `).all();

    return results;
  }

  async getSourceAttribution(): Promise<any[]> {
    const { results } = await this.env.DB.prepare(`
      WITH source_stats AS (
        SELECT 
          COALESCE(utm_source, source, 'direct') as source,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
          COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases
        FROM analytics_events
        WHERE timestamp >= date('now', '-30 days')
        GROUP BY source
      ),
      source_revenue AS (
        SELECT 
          COALESCE(ae.utm_source, ae.source, 'direct') as source,
          SUM(p.price) as revenue
        FROM analytics_events ae
        JOIN products p ON ae.product_id = p.id
        WHERE ae.event_type = 'purchase'
          AND ae.timestamp >= date('now', '-30 days')
        GROUP BY source
      )
      SELECT 
        ss.source,
        ss.sessions,
        ss.clicks,
        COALESCE(sr.revenue, 0) as revenue,
        ROUND(CAST(ss.purchases AS FLOAT) / NULLIF(ss.clicks, 0) * 100, 2) as conversion_rate
      FROM source_stats ss
      LEFT JOIN source_revenue sr ON ss.source = sr.source
      ORDER BY ss.clicks DESC
    `).all();

    return results;
  }

  async getRealtimeStats(): Promise<any> {
    const { results: recentEvents } = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as active_sessions,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_24h,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases_24h
      FROM analytics_events
      WHERE timestamp >= datetime('now', '-24 hours')
    `).all();

    const { results: hourlyBreakdown } = await this.env.DB.prepare(`
      SELECT 
        strftime('%H:00', timestamp) as hour,
        COUNT(*) as events,
        COUNT(DISTINCT session_id) as sessions
      FROM analytics_events
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY strftime('%H:00', timestamp)
      ORDER BY hour DESC
      LIMIT 24
    `).all();

    return {
      current: recentEvents[0],
      hourly: hourlyBreakdown
    };
  }

  async getAISEOImpact(): Promise<any> {
    const { results } = await this.env.DB.prepare(`
      WITH ai_stats AS (
        SELECT 
          COUNT(CASE WHEN utm_source = 'mybonzo' THEN 1 END) as ai_clicks,
          COUNT(CASE WHEN utm_source != 'mybonzo' OR utm_source IS NULL THEN 1 END) as non_ai_clicks,
          SUM(CASE WHEN utm_source = 'mybonzo' AND event_type = 'purchase' THEN 1 ELSE 0 END) as ai_conversions,
          SUM(CASE WHEN (utm_source != 'mybonzo' OR utm_source IS NULL) AND event_type = 'purchase' THEN 1 ELSE 0 END) as non_ai_conversions
        FROM analytics_events
        WHERE timestamp >= date('now', '-30 days')
      ),
      ai_revenue AS (
        SELECT 
          SUM(CASE WHEN ae.utm_source = 'mybonzo' THEN p.price ELSE 0 END) as ai_revenue,
          SUM(CASE WHEN ae.utm_source != 'mybonzo' OR ae.utm_source IS NULL THEN p.price ELSE 0 END) as non_ai_revenue
        FROM analytics_events ae
        JOIN products p ON ae.product_id = p.id
        WHERE ae.event_type = 'purchase'
          AND ae.timestamp >= date('now', '-30 days')
      )
      SELECT 
        ai_stats.*,
        ai_revenue.ai_revenue,
        ai_revenue.non_ai_revenue,
        ROUND(CAST(ai_revenue.ai_revenue AS FLOAT) / NULLIF(ai_revenue.ai_revenue + ai_revenue.non_ai_revenue, 0) * 100, 2) as ai_revenue_share,
        ROUND(CAST(ai_stats.ai_conversions AS FLOAT) / NULLIF(ai_stats.ai_clicks, 0) * 100, 2) as ai_conversion_rate,
        ROUND(CAST(ai_stats.non_ai_conversions AS FLOAT) / NULLIF(ai_stats.non_ai_clicks, 0) * 100, 2) as non_ai_conversion_rate
      FROM ai_stats, ai_revenue
    `).all();

    return results[0];
  }
}
