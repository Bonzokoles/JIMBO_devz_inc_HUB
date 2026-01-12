import { Env } from '../types';
import { AnalyticsAggregator } from './analytics-aggregator';

interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  generated_at: string;
  data: ReportData;
  summary: ReportSummary;
}

interface ReportData {
  kpis: any;
  revenue_trend: any[];
  top_products: any[];
  category_performance: any[];
  traffic_sources: any;
  ai_impact: any;
}

interface ReportSummary {
  total_revenue: number;
  total_clicks: number;
  conversion_rate: number;
  ai_revenue_share: number;
  top_category: string;
  best_product: string;
  key_insights: string[];
}

export class ReportGenerator {
  constructor(private env: Env) {}

  async generateDailyReport(): Promise<Report> {
    console.log('📊 Generating daily report...');
    
    const aggregator = new AnalyticsAggregator(this.env);
    
    const [dailyMetrics, topProducts, categoryPerformance, trafficSources, aiImpact] = await Promise.all([
      aggregator.getDailyMetrics(1),
      aggregator.getTopProducts(20),
      aggregator.getCategoryPerformance(),
      aggregator.getSourceAttribution(),
      aggregator.getAISEOImpact()
    ]);

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const reportData: ReportData = {
      kpis: dailyMetrics[0] || {},
      revenue_trend: dailyMetrics,
      top_products: topProducts,
      category_performance: categoryPerformance,
      traffic_sources: trafficSources,
      ai_impact: aiImpact
    };

    const summary = this.generateSummary(reportData);

    const report: Report = {
      id: `daily_${today}`,
      type: 'daily',
      period_start: yesterday,
      period_end: today,
      generated_at: new Date().toISOString(),
      data: reportData,
      summary
    };

    await this.saveReport(report);
    console.log('✅ Daily report generated:', report.id);

    return report;
  }

  async generateWeeklyReport(): Promise<Report> {
    console.log('📊 Generating weekly report...');
    
    const aggregator = new AnalyticsAggregator(this.env);
    
    const [weeklyMetrics, topProducts, categoryPerformance, trafficSources, aiImpact] = await Promise.all([
      aggregator.getDailyMetrics(7),
      aggregator.getTopProducts(50),
      aggregator.getCategoryPerformance(),
      aggregator.getSourceAttribution(),
      aggregator.getAISEOImpact()
    ]);

    const today = new Date();
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const reportData: ReportData = {
      kpis: this.aggregateMetrics(weeklyMetrics),
      revenue_trend: weeklyMetrics,
      top_products: topProducts,
      category_performance: categoryPerformance,
      traffic_sources: trafficSources,
      ai_impact: aiImpact
    };

    const summary = this.generateSummary(reportData);

    const report: Report = {
      id: `weekly_${today.toISOString().split('T')[0]}`,
      type: 'weekly',
      period_start: weekAgo.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      data: reportData,
      summary
    };

    await this.saveReport(report);
    console.log('✅ Weekly report generated:', report.id);

    return report;
  }

  async generateMonthlyReport(): Promise<Report> {
    console.log('📊 Generating monthly report...');
    
    const aggregator = new AnalyticsAggregator(this.env);
    
    const [monthlyMetrics, topProducts, categoryPerformance, trafficSources, aiImpact] = await Promise.all([
      aggregator.getDailyMetrics(30),
      aggregator.getTopProducts(100),
      aggregator.getCategoryPerformance(),
      aggregator.getSourceAttribution(),
      aggregator.getAISEOImpact()
    ]);

    const today = new Date();
    const monthAgo = new Date(Date.now() - 30 * 86400000);

    const reportData: ReportData = {
      kpis: this.aggregateMetrics(monthlyMetrics),
      revenue_trend: monthlyMetrics,
      top_products: topProducts,
      category_performance: categoryPerformance,
      traffic_sources: trafficSources,
      ai_impact: aiImpact
    };

    const summary = this.generateSummary(reportData);

    const report: Report = {
      id: `monthly_${today.toISOString().split('T')[0]}`,
      type: 'monthly',
      period_start: monthAgo.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      data: reportData,
      summary
    };

    await this.saveReport(report);
    console.log('✅ Monthly report generated:', report.id);

    return report;
  }

  private aggregateMetrics(metrics: any[]): any {
    return {
      total_revenue: metrics.reduce((sum, m) => sum + m.revenue, 0),
      total_clicks: metrics.reduce((sum, m) => sum + m.product_clicks, 0),
      total_views: metrics.reduce((sum, m) => sum + m.total_views, 0),
      avg_conversion_rate: metrics.reduce((sum, m) => sum + m.conversion_rate, 0) / metrics.length,
      total_ai_clicks: metrics.reduce((sum, m) => sum + m.ai_seo_clicks, 0)
    };
  }

  private generateSummary(data: ReportData): ReportSummary {
    const totalRevenue = data.kpis.total_revenue || data.kpis.revenue || 0;
    const totalClicks = data.kpis.total_clicks || data.kpis.product_clicks || 0;
    const conversionRate = data.kpis.conversion_rate || data.kpis.avg_conversion_rate || 0;
    const aiRevenueShare = data.ai_impact?.ai_revenue_share || 0;
    const topCategory = data.category_performance[0]?.category || 'N/A';
    const bestProduct = data.top_products[0]?.product_name || 'N/A';
    const insights = this.generateInsights(data);

    return {
      total_revenue: totalRevenue,
      total_clicks: totalClicks,
      conversion_rate: conversionRate,
      ai_revenue_share: aiRevenueShare,
      top_category: topCategory,
      best_product: bestProduct,
      key_insights: insights
    };
  }

  private generateInsights(data: ReportData): string[] {
    const insights: string[] = [];

    const aiShare = data.ai_impact?.ai_revenue_share || 0;
    if (aiShare > 30) {
      insights.push(`🚀 AI SEO generuje ${aiShare.toFixed(1)}% przychodów - wynik powyżej średniej!`);
    } else if (aiShare > 15) {
      insights.push(`📈 AI SEO odpowiada za ${aiShare.toFixed(1)}% przychodów - stabilny wzrost.`);
    } else {
      insights.push(`⚠️ AI SEO generuje tylko ${aiShare.toFixed(1)}% przychodów - potencjał do wzrostu.`);
    }

    if (data.top_products.length > 0) {
      const topProduct = data.top_products[0];
      insights.push(`🏆 Najlepszy produkt: "${topProduct.product_name}" (${topProduct.clicks} kliknięć, ${topProduct.ctr.toFixed(1)}% CTR)`);
    }

    if (data.category_performance.length > 0) {
      const topCat = data.category_performance[0];
      insights.push(`📂 Najlepsza kategoria: "${topCat.category}" (${topCat.total_clicks} kliknięć, ${(topCat.revenue || 0).toFixed(0)} zł)`);
    }

    const aiCR = data.ai_impact?.ai_conversion_rate || 0;
    const nonAICR = data.ai_impact?.non_ai_conversion_rate || 0;
    if (aiCR > nonAICR) {
      const diff = ((aiCR - nonAICR) / nonAICR * 100).toFixed(0);
      insights.push(`🎯 Konwersja AI SEO ${diff}% wyższa niż pozostały ruch (${aiCR.toFixed(2)}% vs ${nonAICR.toFixed(2)}%)`);
    }

    const sources = data.traffic_sources as any[];
    if (sources && sources.length > 0) {
      const topSource = sources.sort((a, b) => b.clicks - a.clicks)[0];
      insights.push(`🌐 Główne źródło ruchu: ${topSource.source} (${topSource.clicks} kliknięć, ${topSource.conversion_rate.toFixed(2)}% CR)`);
    }

    return insights;
  }

  private async saveReport(report: Report): Promise<void> {
    await this.env.CACHE.put(
      `report:${report.id}`,
      JSON.stringify(report),
      { expirationTtl: 7776000 }
    );

    await this.env.DB.prepare(`
      INSERT INTO reports (
        id, type, period_start, period_end, 
        generated_at, total_revenue, total_clicks, 
        conversion_rate, ai_revenue_share
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      report.id,
      report.type,
      report.period_start,
      report.period_end,
      report.generated_at,
      report.summary.total_revenue,
      report.summary.total_clicks,
      report.summary.conversion_rate,
      report.summary.ai_revenue_share
    ).run();

    console.log(`💾 Report saved: ${report.id}`);
  }

  async getReport(reportId: string): Promise<Report | null> {
    const cached = await this.env.CACHE.get(`report:${reportId}`);
    return cached ? JSON.parse(cached) as Report : null;
  }

  async listReports(type?: 'daily' | 'weekly' | 'monthly', limit: number = 30): Promise<any[]> {
    let query = `
      SELECT * FROM reports
      ${type ? 'WHERE type = ?' : ''}
      ORDER BY generated_at DESC
      LIMIT ?
    `;

    const bindings = type ? [type, limit] : [limit];
    const { results } = await this.env.DB.prepare(query).bind(...bindings).all();

    return results;
  }

  async generateAndSendDailyReport(): Promise<void> {
    console.log('📊 Generating and sending daily report...');
    
    const report = await this.generateDailyReport();
    
    const { SubscriberManager } = await import('./subscriber-manager');
    const subscriberManager = new SubscriberManager(this.env);
    const subscribers = await subscriberManager.getActiveSubscribers('daily');
    
    if (subscribers.length === 0) {
      console.log('⚠️  No daily subscribers found');
      return;
    }

    const { EmailService } = await import('./email-service');
    const emailService = new EmailService(this.env);
    const result = await emailService.sendBulkReportEmails(
      report,
      subscribers.map(s => s.email)
    );

    console.log(`✅ Daily report sent: ${result.sent} successful, ${result.failed} failed`);
  }

  async generateAndSendWeeklyReport(): Promise<void> {
    console.log('📊 Generating and sending weekly report...');
    
    const report = await this.generateWeeklyReport();
    
    const { SubscriberManager } = await import('./subscriber-manager');
    const subscriberManager = new SubscriberManager(this.env);
    const subscribers = await subscriberManager.getActiveSubscribers('weekly');
    
    if (subscribers.length === 0) {
      console.log('⚠️  No weekly subscribers found');
      return;
    }

    const { EmailService } = await import('./email-service');
    const emailService = new EmailService(this.env);
    const result = await emailService.sendBulkReportEmails(
      report,
      subscribers.map(s => s.email)
    );

    console.log(`✅ Weekly report sent: ${result.sent} successful, ${result.failed} failed`);
  }

  async generateAndSendMonthlyReport(): Promise<void> {
    console.log('📊 Generating and sending monthly report...');
    
    const report = await this.generateMonthlyReport();
    
    const { SubscriberManager } = await import('./subscriber-manager');
    const subscriberManager = new SubscriberManager(this.env);
    const subscribers = await subscriberManager.getActiveSubscribers('monthly');
    
    if (subscribers.length === 0) {
      console.log('⚠️  No monthly subscribers found');
      return;
    }

    const { EmailService } = await import('./email-service');
    const emailService = new EmailService(this.env);
    const result = await emailService.sendBulkReportEmails(
      report,
      subscribers.map(s => s.email)
    );

    console.log(`✅ Monthly report sent: ${result.sent} successful, ${result.failed} failed`);
  }
}
