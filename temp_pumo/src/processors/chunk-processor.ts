import { Env, ChunkData, PumoProduct } from '../types';

export class ChunkProcessor {
  constructor(private env: Env) {}

  async processChunk(chunk: ChunkData): Promise<void> {
    console.log(`📦 Processing chunk ${chunk.metadata.chunk_index}/${chunk.metadata.total_chunks}`);
    console.log(`   Products: ${chunk.metadata.products_count}`);

    const startTime = Date.now();

    try {
      // Log chunk start
      const logId = await this.logChunkStart(chunk);

      // Process products in parallel
      await Promise.all([
        this.saveToD1(chunk.products),
        this.generateEmbeddings(chunk.products),
        this.cacheChunk(chunk)
      ]);

      // Log chunk completion
      await this.logChunkComplete(logId);

      const duration = Date.now() - startTime;
      console.log(`✅ Chunk ${chunk.metadata.chunk_index} processed in ${duration}ms`);

      // If last chunk, trigger guide generation
      if (chunk.metadata.chunk_index === chunk.metadata.total_chunks) {
        console.log('🎯 Last chunk - triggering guide generation...');
        await this.triggerGuideGeneration();
      }

    } catch (error: any) {
      console.error(`❌ Chunk ${chunk.metadata.chunk_index} failed:`, error);
      throw error;
    }
  }

  private async saveToD1(products: PumoProduct[]): Promise<void> {
    console.log(`💾 Saving ${products.length} products to D1...`);

    for (const product of products) {
      await this.env.DB.prepare(`
        INSERT INTO products (
          id, name, description, category, price, 
          price_before_discount, stock, url, image_url, 
          sku, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          category = excluded.category,
          price = excluded.price,
          price_before_discount = excluded.price_before_discount,
          stock = excluded.stock,
          url = excluded.url,
          image_url = excluded.image_url,
          sku = excluded.sku,
          updated_at = excluded.updated_at
      `).bind(
        product.id,
        product.name,
        product.description || null,
        product.category || null,
        product.price,
        product.price_before_discount || null,
        product.stock,
        product.url,
        product.image_url || null,
        product.sku || null,
        new Date().toISOString()
      ).run();
    }

    console.log(`✅ D1 save complete`);
  }

  private async generateEmbeddings(products: PumoProduct[]): Promise<void> {
    console.log(`🧠 Generating embeddings for ${products.length} products...`);

    const vectors = [];

    for (const product of products) {
      const text = this.buildProductText(product);
      
      try {
        const embedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: text
        });

        vectors.push({
          id: product.id,
          values: embedding.data[0],
          metadata: {
            name: product.name,
            category: product.category || '',
            price: product.price,
            url: product.url
          }
        });

      } catch (error) {
        console.error(`Failed to generate embedding for ${product.id}:`, error);
      }
    }

    if (vectors.length > 0) {
      await this.env.VECTORIZE.upsert(vectors);
      console.log(`✅ ${vectors.length} embeddings generated`);
    }
  }

  private buildProductText(product: PumoProduct): string {
    let text = product.name;
    if (product.category) text += ` ${product.category}`;
    if (product.description) text += ` ${product.description.substring(0, 500)}`;
    return text;
  }

  private async cacheChunk(chunk: ChunkData): Promise<void> {
    const cacheKey = `chunk:${chunk.metadata.chunk_index}`;
    await this.env.CACHE.put(
      cacheKey,
      JSON.stringify(chunk),
      { expirationTtl: 86400 } // 24 hours
    );
  }

  private async logChunkStart(chunk: ChunkData): Promise<number> {
    const result = await this.env.DB.prepare(`
      INSERT INTO chunk_log (
        chunk_index, total_chunks, products_count, 
        started_at, status
      ) VALUES (?, ?, ?, ?, 'processing')
    `).bind(
      chunk.metadata.chunk_index,
      chunk.metadata.total_chunks,
      chunk.metadata.products_count,
      new Date().toISOString()
    ).run();

    return result.meta.last_row_id;
  }

  private async logChunkComplete(logId: number): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE chunk_log 
      SET completed_at = ?, status = 'completed'
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      logId
    ).run();
  }

  private async triggerGuideGeneration(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { GuideGenerator } = await import('../generators/guide-generator');
    const generator = new GuideGenerator(this.env);
    await generator.generateAllGuides();
  }
}
