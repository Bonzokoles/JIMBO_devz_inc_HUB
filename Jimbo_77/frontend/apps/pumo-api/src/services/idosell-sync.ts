/**
 * MeblePumo XML Feed Sync Service
 * Fetches data from MeblePumo XML feed and saves to D1 Database (pumo-analiza)
 * Feed URL: https://www.meblepumo.pl/pl/products/*.feed10009
 */

export interface ProductData {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    category: string;
    description?: string;
    image_url?: string;
}

export class MeblePumoSyncService {
    private db: D1Database;
    private feedUrl = 'https://www.meblepumo.pl/pl/products/*.feed10009';

    constructor(db: D1Database) {
        this.db = db;
    }

    /**
     * Fetch and parse XML feed
     */
    async fetchXMLFeed(): Promise<ProductData[]> {
        console.log('Fetching XML feed from:', this.feedUrl);

        const response = await fetch(this.feedUrl, {
            headers: {
                'User-Agent': 'MeblePumo-Analytics/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const products = this.parseXML(xmlText);

        console.log(`Parsed ${products.length} products from XML`);
        return products;
    }

    /**
     * Parse XML to extract products
     */
    private parseXML(xml: string): ProductData[] {
        const products: ProductData[] = [];

        // Simple regex-based XML parsing (lightweight for Workers)
        const productRegex = /<o[^>]*>([\s\S]*?)<\/o>/g;
        const matches = xml.matchAll(productRegex);

        for (const match of matches) {
            const productXml = match[1];

            try {
                const id = this.extractTag(productXml, 'id') || '';
                const name = this.extractTag(productXml, 'name') || '';
                const sku = this.extractTag(productXml, 'producer_code') || id;
                const priceStr = this.extractTag(productXml, 'price') || '0';
                const stockStr = this.extractTag(productXml, 'stock') || '0';
                const category = this.extractTag(productXml, 'category') || '';
                const description = this.extractTag(productXml, 'description') || '';
                const imageUrl = this.extractTag(productXml, 'images')?.split(',')[0] || '';

                products.push({
                    id,
                    name,
                    sku,
                    price: parseFloat(priceStr) || 0,
                    stock_quantity: parseInt(stockStr) || 0,
                    category,
                    description,
                    image_url: imageUrl
                });
            } catch (error) {
                console.error('Failed to parse product:', error);
            }
        }

        return products;
    }

    /**
     * Extract tag value from XML string
     */
    private extractTag(xml: string, tagName: string): string | undefined {
        const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : undefined;
    }

    /**
     * Save products to D1 database
     */
    async saveProductsToD1(products: ProductData[]): Promise<number> {
        if (products.length === 0) return 0;

        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            const values = batch.map(p => {
                const productId = (p.id || '').replace(/'/g, "''");
                const name = (p.name || '').replace(/'/g, "''");
                const sku = (p.sku || '').replace(/'/g, "''");
                const price = p.price || 0;
                const stock = p.stock_quantity || 0;
                const category = (p.category || '').replace(/'/g, "''");

                return `('${productId}', '${name}', '${sku}', ${price}, ${stock}, '${category}', datetime('now'))`;
            }).join(',\n');

            const sql = `
                INSERT OR REPLACE INTO products (product_id, name, sku, price, stock_quantity, category, synced_at)
                VALUES ${values}
            `;

            await this.db.prepare(sql).run();
            inserted += batch.length;
        }

        return inserted;
    }

    /**
     * Log sync operation
     */
    async logSync(entityType: string, recordsFetched: number, recordsInserted: number, batches: number, status: string, errorMessage?: string): Promise<void> {
        const error = (errorMessage || '').replace(/'/g, "''");

        const sql = `
            INSERT INTO sync_log (entity_type, records_fetched, records_created, records_updated, batches, completed_at, status, error_message)
            VALUES ('${entityType}', ${recordsFetched}, ${recordsInserted}, 0, ${batches}, datetime('now'), '${status}', '${error}')
        `;

        await this.db.prepare(sql).run();
    }

    /**
     * Full export from XML feed to D1
     */
    async exportToD1(): Promise<{
        success: boolean;
        products: { fetched: number; inserted: number };
        errors: string[];
    }> {
        const errors: string[] = [];
        let productsFetched = 0;
        let productsInserted = 0;

        try {
            // Fetch and parse XML feed
            console.log('Starting XML feed sync...');
            const products = await this.fetchXMLFeed();
            productsFetched = products.length;
            console.log(`Fetched ${productsFetched} products from XML feed`);

            if (products.length > 0) {
                productsInserted = await this.saveProductsToD1(products);
                console.log(`Saved ${productsInserted} products to D1`);

                await this.logSync('products', productsFetched, productsInserted, Math.ceil(productsFetched / 100), 'success');
            }
        } catch (error) {
            const errorMsg = `Products sync failed: ${error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
            await this.logSync('products', productsFetched, productsInserted, 0, 'failed', errorMsg);
        }

        return {
            success: errors.length === 0,
            products: { fetched: productsFetched, inserted: productsInserted },
        };
    }
}
