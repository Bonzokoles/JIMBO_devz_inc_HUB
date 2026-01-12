import { Env } from '../types';

interface PumoOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_email: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  currency: string;
  items: PumoOrderItem[];
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

interface PumoOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export class PumoOrdersClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(private env: Env) {
    this.baseUrl = env.PUMO_API_BASE_URL || 'https://api.meblepumo.pl/v1';
    // Use generic key if specific order key absent
    this.apiKey = env.PUMO_ORDERS_API_KEY || env.PUMO_API_KEY || '';
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return { ...headers, ...(extra || {}) };
  }

  async getOrders(params?: {
    status?: string;
    since?: string;
    until?: string;
    page?: number;
    per_page?: number;
  }): Promise<PumoOrder[]> {
    console.log('📦 Fetching orders from Pumo API...');

    const allOrders: PumoOrder[] = [];
    let page = params?.page || 1;
    let hasMore = true;
    const perPage = params?.per_page || 100;

    while (hasMore) {
      const queryParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage)
      });
      if (params?.status) queryParams.set('status', params.status);
      if (params?.since) queryParams.set('created_after', params.since);
      if (params?.until) queryParams.set('created_before', params.until);

      const url = `${this.baseUrl}/orders?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders()
      });

      if (!response.ok) {
        throw new Error(`Orders API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const orders = this.transformOrders(data.orders || data.items || []);
      
      allOrders.push(...orders);
      
      hasMore = data.has_more ?? (orders.length === perPage);
      page++;

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Fetched ${allOrders.length} orders`);
    return allOrders;
  }

  async getOrder(orderId: string): Promise<PumoOrder | null> {
    try {
      const url = `${this.baseUrl}/orders/${orderId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Orders API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.transformOrder(data.order || data);

    } catch (error) {
      console.error(`Failed to fetch order ${orderId}:`, error);
      return null;
    }
  }

  async getRecentOrders(hours: number = 24): Promise<PumoOrder[]> {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    return await this.getOrders({ since, status: 'completed' });
  }

  private transformOrders(apiOrders: any[]): PumoOrder[] {
    return apiOrders.map(o => this.transformOrder(o));
  }

  private transformOrder(apiOrder: any): PumoOrder {
    return {
      id: String(apiOrder.id || apiOrder.order_id),
      order_number: apiOrder.order_number || apiOrder.number || String(apiOrder.id),
      customer_id: String(apiOrder.customer_id || apiOrder.customer?.id || ''),
      customer_email: apiOrder.customer_email || apiOrder.customer?.email || '',
      status: apiOrder.status || 'pending',
      total: parseFloat(apiOrder.total || apiOrder.total_price || 0),
      subtotal: parseFloat(apiOrder.subtotal || apiOrder.subtotal_price || 0),
      tax: parseFloat(apiOrder.tax || apiOrder.total_tax || 0),
      shipping: parseFloat(apiOrder.shipping || apiOrder.shipping_price || 0),
      discount: parseFloat(apiOrder.discount || apiOrder.total_discounts || 0),
      currency: apiOrder.currency || 'PLN',
      items: this.transformOrderItems(apiOrder.items || apiOrder.line_items || []),
      source: apiOrder.source || apiOrder.referring_site || 'direct',
      utm_source: apiOrder.utm_source || apiOrder.source_name,
      utm_medium: apiOrder.utm_medium,
      utm_campaign: apiOrder.utm_campaign || apiOrder.campaign,
      created_at: apiOrder.created_at || apiOrder.order_date || new Date().toISOString(),
      updated_at: apiOrder.updated_at || apiOrder.modified_date || new Date().toISOString()
    };
  }

  private transformOrderItems(apiItems: any[]): PumoOrderItem[] {
    return apiItems.map(item => ({
      product_id: String(item.product_id || item.id),
      product_name: item.product_name || item.name || item.title || '',
      quantity: parseInt(item.quantity || 1),
      price: parseFloat(item.price || 0),
      total: parseFloat(item.total || item.subtotal || 0)
    }));
  }
}
