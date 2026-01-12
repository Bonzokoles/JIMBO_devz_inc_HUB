import { Env } from '../types';
import { PumoOrdersClient } from './pumo-orders-client';

export class OrderSync {
  private ordersClient: PumoOrdersClient;

  constructor(private env: Env) {
    this.ordersClient = new PumoOrdersClient(env);
  }

  async syncRecentOrders(hours: number = 24): Promise<void> {
    console.log(`📦 Syncing orders from last ${hours} hours...`);

    try {
      const orders = await this.ordersClient.getRecentOrders(hours);

      if (orders.length === 0) {
        console.log('No recent orders found');
        return;
      }

      console.log(`Processing ${orders.length} orders...`);

      for (const order of orders) {
        await this.processOrder(order);
      }

      console.log('✅ Orders synced successfully');

    } catch (error) {
      console.error('❌ Order sync failed:', error);
      throw error;
    }
  }

  private async processOrder(order: any): Promise<void> {
    // Store order in database
    await this.saveOrder(order);

    // Track analytics events for each item
    for (const item of order.items) {
      await this.trackPurchaseEvent(order, item);
    }

    // Update product analytics
    await this.updateProductStats(order.items);

    // Track revenue attribution
    await this.trackRevenueAttribution(order);
  }

  private async saveOrder(order: any): Promise<void> {
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO orders (
        id, order_number, customer_id, customer_email, status,
        total, subtotal, tax, shipping, discount, currency,
        source, utm_source, utm_medium, utm_campaign,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      order.id,
      order.order_number,
      order.customer_id,
      order.customer_email,
      order.status,
      order.total,
      order.subtotal,
      order.tax,
      order.shipping,
      order.discount,
      order.currency,
      order.source,
      order.utm_source || null,
      order.utm_medium || null,
      order.utm_campaign || null,
      order.created_at,
      order.updated_at
    ).run();

    // Save order items
    // First remove existing items for this order to avoid duplicates on resync
    await this.env.DB.prepare(`DELETE FROM order_items WHERE order_id = ?`).bind(order.id).run();

    for (const item of order.items) {
      await this.env.DB.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        order.id,
        item.product_id,
        item.product_name,
        item.quantity,
        item.price,
        item.total
      ).run();
    }
  }

  private async trackPurchaseEvent(order: any, item: any): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO analytics_events (
        event_type, product_id, source, utm_source, utm_medium, utm_campaign,
        session_id, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'purchase',
      item.product_id,
      order.source || 'direct',
      order.utm_source || null,
      order.utm_medium || null,
      order.utm_campaign || null,
      `order_${order.id}`,
      order.created_at
    ).run();
  }

  private async updateProductStats(items: any[]): Promise<void> {
    for (const item of items) {
      // Update product purchase count and revenue
      await this.env.DB.prepare(`
        UPDATE products
        SET 
          total_purchases = COALESCE(total_purchases, 0) + ?,
          total_revenue = COALESCE(total_revenue, 0) + ?
        WHERE id = ?
      `).bind(item.quantity, item.total, item.product_id).run();
    }
  }

  private async trackRevenueAttribution(order: any): Promise<void> {
    // Track which source generated this revenue
    await this.env.DB.prepare(`
      INSERT INTO revenue_attribution (
        order_id, source, utm_source, utm_medium, utm_campaign, revenue, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      order.id,
      order.source,
      order.utm_source || null,
      order.utm_medium || null,
      order.utm_campaign || null,
      order.total,
      order.created_at
    ).run();
  }

  async getOrderStats(days: number = 30): Promise<any> {
    const { results } = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value,
        SUM(CASE WHEN utm_source = 'mybonzo' THEN total ELSE 0 END) as ai_revenue,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM orders
      WHERE created_at >= datetime('now', '-' || ? || ' days')
        AND status = 'completed'
    `).bind(days).all();

    return results[0];
  }
}
