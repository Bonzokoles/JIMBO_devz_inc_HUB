import { Env, PumoProduct } from '../types';

interface PumoAPIConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

interface PumoAPIResponse {
  products: any[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export class PumoAPIClient {
  private config: PumoAPIConfig;
  
  constructor(private env: Env) {
    this.config = {
      baseUrl: env.PUMO_API_BASE_URL || 'https://api.meblepumo.pl/v1',
      apiKey: env.PUMO_API_KEY || '',
      timeout: 30000
    };
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.config.apiKey) {
      headers['X-API-KEY'] = this.config.apiKey;
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return { ...headers, ...(extra || {}) };
  }

  async getAllProducts(): Promise<PumoProduct[]> {
    console.log('📡 Fetching all products from Pumo API...');

    if (!this.config.apiKey) {
      throw new Error('PUMO_API_KEY missing (configure secret for this worker environment)');
    }
    
    const allProducts: PumoProduct[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 100; // Pobieraj po 100 produktów na stronę

    while (hasMore) {
      try {
        const response = await this.fetchProductsPage(page, perPage);
        
        const products = this.transformProducts(response.products);
        allProducts.push(...products);

        console.log(`✅ Fetched page ${page}: ${products.length} products (total: ${allProducts.length})`);

        hasMore = response.has_more;
        page++;

        // Rate limiting - 100ms delay between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Failed to fetch page ${page}:`, error);
        throw error;
      }
    }

    console.log(`✅ Total products fetched: ${allProducts.length}`);
    return allProducts;
  }

  private async fetchProductsPage(page: number, perPage: number): Promise<PumoAPIResponse> {
    const url = `${this.config.baseUrl}/products?page=${page}&per_page=${perPage}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Pumo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Adapt to your actual API structure
      return {
        products: data.products || data.items || data.data || [],
        total: data.total || data.count || 0,
        page: data.page || page,
        per_page: data.per_page || perPage,
        has_more: data.has_more ?? (data.products?.length === perPage)
      };

    } catch (error: any) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  async getProduct(productId: string): Promise<PumoProduct | null> {
    console.log(`📡 Fetching product: ${productId}`);
    
    try {
      const url = `${this.config.baseUrl}/products/${productId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders({ 'Accept': 'application/json' })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Pumo API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.transformProduct(data.product || data);

    } catch (error) {
      console.error(`❌ Failed to fetch product ${productId}:`, error);
      return null;
    }
  }

  async getCategories(): Promise<string[]> {
    console.log('📡 Fetching categories from Pumo API...');
    
    try {
      const url = `${this.config.baseUrl}/categories`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders({ 'Accept': 'application/json' })
      });

      if (!response.ok) {
        throw new Error(`Pumo API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.categories || data.items || [];

    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      return [];
    }
  }

  private transformProducts(apiProducts: any[]): PumoProduct[] {
    return apiProducts.map(p => this.transformProduct(p));
  }

  private transformProduct(apiProduct: any): PumoProduct {
    // Transform API response to our internal format
    // Adapt field names based on actual Pumo API structure
    
    return {
      id: String(apiProduct.id || apiProduct.product_id || apiProduct.sku),
      name: apiProduct.name || apiProduct.title || '',
      description: apiProduct.description || apiProduct.desc || '',
      category: apiProduct.category || apiProduct.category_name || '',
      price: parseFloat(apiProduct.price || apiProduct.regular_price || 0),
      price_before_discount: apiProduct.price_before_discount 
        ? parseFloat(apiProduct.price_before_discount)
        : apiProduct.compare_at_price 
        ? parseFloat(apiProduct.compare_at_price)
        : undefined,
      stock: parseInt(apiProduct.stock || apiProduct.quantity || 0),
      url: apiProduct.url || apiProduct.permalink || `https://www.meblepumo.pl/product/${apiProduct.id}`,
      image_url: apiProduct.image_url || apiProduct.image || apiProduct.thumbnail || '',
      sku: apiProduct.sku || String(apiProduct.id),
      updated_at: apiProduct.updated_at || new Date().toISOString()
    };
  }

  async testConnection(): Promise<boolean> {
    console.log('🔌 Testing Pumo API connection...');

    if (!this.config.apiKey) {
      throw new Error('PUMO_API_KEY missing (configure secret for this worker environment)');
    }
    
    try {
      const url = `${this.config.baseUrl}/products?page=1&per_page=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders({ 'Accept': 'application/json' })
      });

      if (response.ok) {
        console.log('✅ Pumo API connection successful');
        return true;
      } else {
        console.error(`❌ Pumo API connection failed: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error('❌ Pumo API connection error:', error);
      return false;
    }
  }
}
