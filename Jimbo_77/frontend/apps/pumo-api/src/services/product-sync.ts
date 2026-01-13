import { ChunkProcessor } from '../processors/chunk-processor';
import { Env, PumoProduct } from '../types';
import { PumoAPIClient } from './pumo-api-client';

interface SyncResult {
  total_fetched: number;
  new_products: number;
  updated_products: number;
  deleted_products: number;
  unchanged_products: number;
  errors: number;
  duration_ms: number;
}

interface ProductChange {
  product_id: string;
  change_type: 'new' | 'updated' | 'deleted' | 'price_change' | 'stock_change';
  old_value?: any;
  new_value?: any;
  timestamp: string;
}

export class ProductSync {
  private apiClient: PumoAPIClient;

  constructor(private env: Env) {
    this.apiClient = new PumoAPIClient(env);
  }

  async fullSync(): Promise<SyncResult> {
    console.log('🔄 Starting FULL product sync...');
    const startTime = Date.now();

    try {
      // Fetch all products from API
      const apiProducts = await this.apiClient.getAllProducts();

      if (apiProducts.length === 0) {
        throw new Error('No products fetched from API');
      }

      // ⬇️ SAVE RAW DATA TO R2
      await this.saveToR2(apiProducts, 'full');

      // Get existing products from database
      const existingProducts = await this.getExistingProducts();
      const existingIds = new Set(existingProducts.map(p => p.id));

      // Detect changes
      const changes = await this.detectChanges(apiProducts, existingProducts);

      console.log(`📊 Changes detected:`, {
        new: changes.filter(c => c.change_type === 'new').length,
        updated: changes.filter(c => c.change_type === 'updated').length,
        deleted: changes.filter(c => c.change_type === 'deleted').length
      });

      // Process products in chunks
      const chunkSize = 100;
      const chunks = this.chunkArray(apiProducts, chunkSize);

      console.log(`📦 Processing ${chunks.length} chunks of ${chunkSize} products each...`);

      const processor = new ChunkProcessor(this.env);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = {
          metadata: {
            chunk_index: i + 1,
            total_chunks: chunks.length,
            products_count: chunks[i].length,
            start_index: i * chunkSize,
            end_index: (i + 1) * chunkSize,
            created_at: new Date().toISOString(),
            source: 'pumo_api_sync',
            version: '1.0'
          },
          products: chunks[i]
        };

        await processor.processChunk(chunk);
      }

      // Mark deleted products
      const apiProductIds = new Set(apiProducts.map(p => p.id));
      const deletedIds = Array.from(existingIds).filter(id => !apiProductIds.has(id));

      if (deletedIds.length > 0) {
        await this.markProductsAsDeleted(deletedIds);
      }

      // Log changes
      await this.logChanges(changes);

      // Send alerts if needed
      if (changes.length > 0) {
        await this.sendChangeAlerts(changes);
      }

      const duration = Date.now() - startTime;

      const result: SyncResult = {
        total_fetched: apiProducts.length,
        new_products: changes.filter(c => c.change_type === 'new').length,
        updated_products: changes.filter(c => c.change_type === 'updated').length,
        deleted_products: deletedIds.length,
        unchanged_products: apiProducts.length - changes.filter(c => c.change_type !== 'deleted').length,
        errors: 0,
        duration_ms: duration
      };

      console.log('✅ Full sync completed:', result);

      return result;

    } catch (error: any) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  async incrementalSync(): Promise<SyncResult> {
    console.log('🔄 Starting INCREMENTAL product sync...');
    const startTime = Date.now();

    try {
      // Get last sync time
      const lastSyncTime = await this.getLastSyncTime();
      console.log(`Last sync: ${lastSyncTime}`);

      // Fetch all products (or use 'updated_since' param if API supports it)
      const apiProducts = await this.apiClient.getAllProducts();

      // Filter products updated since last sync
      const updatedProducts = apiProducts.filter(p =>
        new Date(p.updated_at || 0) > new Date(lastSyncTime)
      );

      console.log(`📊 ${updatedProducts.length} products updated since last sync`);

      if (updatedProducts.length === 0) {
        return {
          total_fetched: apiProducts.length,
          new_products: 0,
          updated_products: 0,
          deleted_products: 0,
          unchanged_products: apiProducts.length,
          errors: 0,
          duration_ms: Date.now() - startTime
        };
      }

      // ⬇️ SAVE UPDATED PRODUCTS TO R2
      await this.saveToR2(updatedProducts, 'incremental');

      // Process updated products
      const existingProducts = await this.getExistingProductsByIds(
        updatedProducts.map(p => p.id)
      );

      const changes = await this.detectChanges(updatedProducts, existingProducts);

      // Process in chunks
      const chunks = this.chunkArray(updatedProducts, 50);
      const processor = new ChunkProcessor(this.env);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = {
          metadata: {
            chunk_index: i + 1,
            total_chunks: chunks.length,
            products_count: chunks[i].length,
            start_index: i * 50,
            end_index: (i + 1) * 50,
            created_at: new Date().toISOString(),
            source: 'pumo_api_incremental',
            version: '1.0'
          },
          products: chunks[i]
        };

        await processor.processChunk(chunk);
      }

      await this.logChanges(changes);

      const duration = Date.now() - startTime;

      const result: SyncResult = {
        total_fetched: updatedProducts.length,
        new_products: changes.filter(c => c.change_type === 'new').length,
        updated_products: changes.filter(c => c.change_type === 'updated').length,
        deleted_products: 0,
        unchanged_products: 0,
        errors: 0,
        duration_ms: duration
      };

      console.log('✅ Incremental sync completed:', result);

      return result;

    } catch (error: any) {
      console.error('❌ Incremental sync failed:', error);
      throw error;
    }
  }

  private async detectChanges(
    apiProducts: PumoProduct[],
    existingProducts: PumoProduct[]
  ): Promise<ProductChange[]> {
    const changes: ProductChange[] = [];
    const existingMap = new Map(existingProducts.map(p => [p.id, p]));

    for (const apiProduct of apiProducts) {
      const existing = existingMap.get(apiProduct.id);

      if (!existing) {
        // New product
        changes.push({
          product_id: apiProduct.id,
          change_type: 'new',
          new_value: apiProduct,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      // Check for price changes
      if (existing.price !== apiProduct.price) {
        changes.push({
          product_id: apiProduct.id,
          change_type: 'price_change',
          old_value: existing.price,
          new_value: apiProduct.price,
          timestamp: new Date().toISOString()
        });
      }

      // Check for stock changes
      if (existing.stock !== apiProduct.stock) {
        changes.push({
          product_id: apiProduct.id,
          change_type: 'stock_change',
          old_value: existing.stock,
          new_value: apiProduct.stock,
          timestamp: new Date().toISOString()
        });
      }

      // Check for other updates
      if (
        existing.name !== apiProduct.name ||
        existing.description !== apiProduct.description ||
        existing.category !== apiProduct.category
      ) {
        changes.push({
          product_id: apiProduct.id,
          change_type: 'updated',
          old_value: existing,
          new_value: apiProduct,
          timestamp: new Date().toISOString()
        });
      }
    }

    return changes;
  }

  private async getExistingProducts(): Promise<PumoProduct[]> {
    const { results } = await this.env.DB.prepare(`
      SELECT * FROM products WHERE deleted_at IS NULL
    `).all();

    return results as PumoProduct[];
  }

  private async getExistingProductsByIds(ids: string[]): Promise<PumoProduct[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const { results } = await this.env.DB.prepare(`
      SELECT * FROM products WHERE id IN (${placeholders})
    `).bind(...ids).all();

    return results as PumoProduct[];
  }

  private async markProductsAsDeleted(productIds: string[]): Promise<void> {
    console.log(`🗑️  Marking ${productIds.length} products as deleted`);

    for (const id of productIds) {
      await this.env.DB.prepare(`
        UPDATE products 
        SET deleted_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), id).run();
    }
  }

  private async logChanges(changes: ProductChange[]): Promise<void> {
    // Create product_changes table if needed (moved to schema.sql but keeping check just in case)
    // Actually we assume it exists now.

    for (const change of changes) {
      await this.env.DB.prepare(`
        INSERT INTO product_changes (
          product_id, change_type, old_value, new_value, timestamp
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        change.product_id,
        change.change_type,
        JSON.stringify(change.old_value),
        JSON.stringify(change.new_value),
        change.timestamp
      ).run();
    }
  }

  private async sendChangeAlerts(changes: ProductChange[]): Promise<void> {
    // Send email alerts for important changes
    const importantChanges = changes.filter(c =>
      c.change_type === 'price_change' &&
      (c.new_value && c.old_value && Math.abs((c.new_value - c.old_value) / c.old_value) > 0.1) // >10% price change
    );

    if (importantChanges.length > 0) {
      console.log(`⚠️  ${importantChanges.length} important price changes detected`);

      // Send alert email
      const { EmailService } = await import('./email-service');
      const emailService = new EmailService(this.env);

      // Just log for now as sendAlertEmail isn't in EmailService interface yet
      console.log('Sending alert email would happen here regarding price changes.');
      /* await emailService.sendAlertEmail(
       'Important Product Changes Detected',
       `${importantChanges.length} products have significant price changes (>10%)`,
       ['alerts@mybonzoaiblog.com'] 
     );*/
    }
  }

  private async getLastSyncTime(): Promise<string> {
    const { results } = await this.env.DB.prepare(`
      SELECT completed_at FROM sync_history
      WHERE status = 'success'
      ORDER BY completed_at DESC
      LIMIT 1
    `).all();

    if (results.length > 0) {
      return results[0].completed_at as string;
    }

    // Default: 24 hours ago
    return new Date(Date.now() - 86400000).toISOString();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async testAPIConnection(): Promise<boolean> {
    return await this.apiClient.testConnection();
  }

  async saveToR2(products: PumoProduct[], syncType: 'full' | 'incremental'): Promise<void> {
    console.log(`📦 Saving ${products.length} products to R2...`);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `sync-${syncType}-${timestamp}.json`;

      const data = {
        sync_type: syncType,
        timestamp: new Date().toISOString(),
        product_count: products.length,
        products: products
      };

      await this.env.PUMO_RAW_BUCKET.put(
        filename,
        JSON.stringify(data, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json'
          },
          customMetadata: {
            sync_type: syncType,
            product_count: String(products.length)
          }
        }
      );

      console.log(`✅ Saved to R2: ${filename}`);
    } catch (error) {
      console.error('❌ R2 save failed:', error);
      // Nie przerwamy synca jeśli R2 fail
    }
  }
}
