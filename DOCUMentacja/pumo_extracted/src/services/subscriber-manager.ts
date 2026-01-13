import { Env } from '../types';

interface Subscriber {
  id: number;
  email: string;
  name?: string;
  subscribed_at: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  active: boolean;
}

export class SubscriberManager {
  constructor(private env: Env) {}

  async subscribe(email: string, name?: string, frequency: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<boolean> {
    try {
      const { results } = await this.env.DB.prepare(`SELECT * FROM email_subscribers WHERE email = ?`).bind(email).all();

      if (results.length > 0) {
        await this.env.DB.prepare(`
          UPDATE email_subscribers 
          SET active = 1, unsubscribed_at = NULL, frequency = ?
          WHERE email = ?
        `).bind(frequency, email).run();
        console.log(`✅ Reactivated subscriber: ${email}`);
      } else {
        await this.env.DB.prepare(`
          INSERT INTO email_subscribers (email, name, subscribed_at, frequency, active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(email, name || null, new Date().toISOString(), frequency).run();
        console.log(`✅ New subscriber: ${email}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  }

  async unsubscribe(email: string): Promise<boolean> {
    try {
      await this.env.DB.prepare(`
        UPDATE email_subscribers 
        SET active = 0, unsubscribed_at = ?
        WHERE email = ?
      `).bind(new Date().toISOString(), email).run();
      console.log(`✅ Unsubscribed: ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async getActiveSubscribers(frequency?: 'daily' | 'weekly' | 'monthly'): Promise<Subscriber[]> {
    let query = `SELECT * FROM email_subscribers WHERE active = 1`;
    const bindings: any[] = [];

    if (frequency) {
      query += ` AND frequency = ?`;
      bindings.push(frequency);
    }

    query += ` ORDER BY subscribed_at DESC`;

    const { results } = await this.env.DB.prepare(query).bind(...bindings).all();

    return results.map(r => ({
      id: r.id as number,
      email: r.email as string,
      name: r.name as string | undefined,
      subscribed_at: r.subscribed_at as string,
      frequency: r.frequency as 'daily' | 'weekly' | 'monthly',
      active: r.active === 1
    }));
  }

  async updateFrequency(email: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
    try {
      await this.env.DB.prepare(`UPDATE email_subscribers SET frequency = ? WHERE email = ?`).bind(frequency, email).run();
      console.log(`✅ Updated frequency for ${email} to ${frequency}`);
      return true;
    } catch (error) {
      console.error('Failed to update frequency:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    const { results } = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN frequency = 'daily' AND active = 1 THEN 1 ELSE 0 END) as daily,
        SUM(CASE WHEN frequency = 'weekly' AND active = 1 THEN 1 ELSE 0 END) as weekly,
        SUM(CASE WHEN frequency = 'monthly' AND active = 1 THEN 1 ELSE 0 END) as monthly
      FROM email_subscribers
    `).all();

    return results[0];
  }
}
