import { Env } from '../types';

interface GA4Event {
  name: string;
  params: {
    product_id?: string;
    product_name?: string;
    category?: string;
    value?: number;
    currency?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    session_id?: string;
    [key: string]: any;
  };
}

export class GA4Analytics {
  private readonly GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
  
  constructor(private env: Env) {}

  async trackEvent(event: GA4Event, clientId: string): Promise<boolean> {
    // 1. Save to internal D1 Database (Primary Source for Reports)
    try {
      const timestamp = new Date().toISOString();
      const sessionId = event.params.session_id || this.generateSessionId();
      
      await this.env.DB.prepare(`
        INSERT INTO analytics_events (
          event_type, product_id, source, utm_source, 
          utm_medium, utm_campaign, session_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        event.name === 'select_item' ? 'click' : 
        event.name === 'page_view' ? 'guide_view' : 
        event.name,
        event.params.product_id || null,
        event.params.source || 'direct',
        event.params.source || null,
        event.params.medium || null,
        event.params.campaign || null,
        sessionId,
        timestamp
      ).run();
      
      console.log(`✅ D1 event saved: ${event.name}`);
    } catch (d1Error) {
      console.error('❌ D1 tracking failed:', d1Error);
      // Don't fail the whole request if D1 fails, try GA4
    }

    // 2. Send to Google Analytics 4 (External Backup)
    if (!this.env.GA4_MEASUREMENT_ID || !this.env.GA4_API_SECRET) {
      // It's okay if GA4 is missing, we have D1 now.
      return true;
    }

    try {
      const payload = {
        client_id: clientId,
        events: [{
          name: event.name,
          params: {
            ...event.params,
            engagement_time_msec: '100',
            session_id: event.params.session_id || this.generateSessionId()
          }
        }]
      };

      const url = `${this.GA4_ENDPOINT}?measurement_id=${this.env.GA4_MEASUREMENT_ID}&api_secret=${this.env.GA4_API_SECRET}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`GA4 API error: ${response.status}`);
      }

      console.log(`✅ GA4 event tracked: ${event.name}`);
      return true;

    } catch (error: any) {
      console.error('❌ GA4 tracking failed:', error);
      // Return true anyway because we likely saved to D1
      return true;
    }
  }

  async trackProductClick(productId: string, productName: string, category: string, price: number, source: string, clientId: string): Promise<void> {
    await this.trackEvent({
      name: 'select_item',
      params: {
        product_id: productId,
        product_name: productName,
        category,
        value: price,
        currency: 'PLN',
        source,
        items: [{
          item_id: productId,
          item_name: productName,
          item_category: category,
          price
        }]
      }
    }, clientId);
  }

  async trackPurchase(productId: string, productName: string, price: number, source: string, clientId: string): Promise<void> {
    await this.trackEvent({
      name: 'purchase',
      params: {
        product_id: productId,
        product_name: productName,
        value: price,
        currency: 'PLN',
        source,
        transaction_id: `txn_${Date.now()}_${productId}`,
        items: [{
          item_id: productId,
          item_name: productName,
          price,
          quantity: 1
        }]
      }
    }, clientId);
  }

  async trackGuideView(guidePath: string, category: string, clientId: string): Promise<void> {
    await this.trackEvent({
      name: 'page_view',
      params: {
        page_location: `https://mybonzoaiblog.com${guidePath}`,
        page_title: `Przewodnik: ${category}`,
        category,
        content_type: 'buying_guide'
      }
    }, clientId);
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
