import { Env } from '../types';

export class DailySyncWorkflow {
  constructor(private env: Env) {}

  async run(): Promise<void> {
    console.log('🚀 Daily Sync Workflow started');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);

    const syncId = await this.startSync();

    try {
      // Step 1: Sync products
      await this.syncProducts();

      // Step 2: Sync orders (last 24h)
      await this.syncOrders();

      // Step 3: Update embeddings
      await this.regenerateEmbeddings();

      // Step 4: Generate guides
      await this.generateGuides();

      // Step 5: Generate reports
      await this.generateReports();

      // Step 6: Cleanup
      await this.cleanup();

      await this.completeSync(syncId, 'success');
      console.log('✅ Daily Sync completed successfully');

    } catch (error: any) {
      console.error('❌ Daily Sync failed:', error);
      await this.completeSync(syncId, 'failed', error.message);
      throw error;
    }
  }

  private async startSync(): Promise<number> {
    const result = await this.env.DB.prepare(`
      INSERT INTO sync_history (started_at, status)
      VALUES (?, 'running')
    `).bind(new Date().toISOString()).run();

    return result.meta.last_row_id;
  }

  private async completeSync(syncId: number, status: 'success' | 'failed', error?: string): Promise<void> {
    const startTime = await this.getSyncStartTime(syncId);
    const duration = Date.now() - new Date(startTime).getTime();

    await this.env.DB.prepare(`
      UPDATE sync_history
      SET completed_at = ?, status = ?, error = ?, duration_ms = ?
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      status,
      error || null,
      duration,
      syncId
    ).run();
  }

  private async getSyncStartTime(syncId: number): Promise<string> {
    const { results } = await this.env.DB.prepare(`
      SELECT started_at FROM sync_history WHERE id = ?
    `).bind(syncId).all();

    return results[0]?.started_at as string;
  }

  private async syncProducts(): Promise<void> {
    console.log('📦 Step 1: Syncing products...');
    
    const { ProductSync } = await import('../services/product-sync');
    const sync = new ProductSync(this.env);
    
    const today = new Date();
    if (today.getDay() === 0) {
      // Sunday - full sync
      await sync.fullSync();
    } else {
      // Other days - incremental
      await sync.incrementalSync();
    }
  }
  
  private async syncOrders(): Promise<void> {
    console.log('📦 Step 2: Syncing orders...');
    
    const { OrderSync } = await import('../services/order-sync');
    const sync = new OrderSync(this.env);
    
    await sync.syncRecentOrders(24);
  }

  private async regenerateEmbeddings(): Promise<void> {
    console.log('🧠 Step 3: Checking embeddings...');

    // Get products updated in last 24h
    const { results: recentProducts } = await this.env.DB.prepare(`
      SELECT * FROM products
      WHERE updated_at >= datetime('now', '-1 day')
    `).all();

    if (recentProducts.length === 0) {
      console.log('No recent product updates, skipping embedding regeneration');
      return;
    }

    console.log(`Regenerating embeddings for ${recentProducts.length} products...`);

    for (const product of recentProducts) {
      try {
        const text = `${product.name} ${product.category || ''} ${product.description?.substring(0, 500) || ''}`;
        
        const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', { text });

        await this.env.VECTORIZE.upsert([{
          id: product.id as string,
          values: embedding.data[0],
          metadata: {
            name: product.name as string,
            category: product.category as string || '',
            price: product.price as number,
            url: product.url as string
          }
        }]);

      } catch (error) {
        console.error(`Failed to regenerate embedding for ${product.id}:`, error);
      }
    }

    console.log('✅ Embeddings regenerated');
  }

  private async generateGuides(): Promise<void> {
    console.log('📚 Step 4: Generating buying guides...');

    const { GuideGenerator } = await import('../generators/guide-generator');
    const generator = new GuideGenerator(this.env);

    await generator.generateAllGuides();

    console.log('✅ Guides generated');
  }

  private async generateReports(): Promise<void> {
    console.log('📊 Step 5: Generating reports...');

    const { ReportGenerator } = await import('../services/report-generator');
    const generator = new ReportGenerator(this.env);

    // Generate and send daily report
    await generator.generateAndSendDailyReport();

    // Check if it's Monday - generate weekly report
    const today = new Date();
    if (today.getDay() === 1) {
      console.log('📅 Monday - generating weekly report...');
      await generator.generateAndSendWeeklyReport();
    }

    // Check if it's 1st of month - generate monthly report
    if (today.getDate() === 1) {
      console.log('📅 First of month - generating monthly report...');
      await generator.generateAndSendMonthlyReport();
    }

    console.log('✅ Reports generated and sent');
  }

  private async cleanup(): Promise<void> {
      console.log('🧹 Step 6: Cleaning up old data...');
      
      // Cleanup old sync history (> 30 days)
      await this.env.DB.prepare(`
        DELETE FROM sync_history 
        WHERE started_at < date('now', '-30 days')
      `).run();
      
      // Cleanup old reports from cache (older than 90 days)
      // Note: KV expiration handles most of this automatically
      
      console.log('✅ Cleanup completed');
    }
}
