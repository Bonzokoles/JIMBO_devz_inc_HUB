export interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  CACHE: KVNamespace;
  AI: any;
  PUMO_RAW_BUCKET: R2Bucket;
  ALLOWED_ORIGINS: string;

  // Dashboard config
  DASHBOARD_API_BASE?: string;
  DASHBOARD_PASSWORD?: string;
  DASHBOARD_DISABLE_AUTH?: string;

  // Cloudflare Access (for protecting dashboard)
  CF_ACCESS_AUD?: string;
  CF_ACCESS_JWKS_URL?: string;

  // APIs
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DKIM_PRIVATE_KEY?: string;
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
  GA4_PROPERTY_ID?: string;
  GA4_SERVICE_ACCOUNT_JSON?: string;

  // Pumo API Config
  PUMO_API_BASE_URL?: string;
  PUMO_API_KEY?: string;
  PUMO_PRODUCTS_API_KEY?: string;
  PUMO_ORDERS_API_KEY?: string;
  PUMO_ANALYTICS_API_KEY?: string;
  PUMO_CUSTOMERS_API_KEY?: string;
  PUMO_INVENTORY_API_KEY?: string;
  PUMO_REVIEWS_API_KEY?: string;
}

export interface PumoProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  price_before_discount?: number;
  stock: number;
  url: string;
  image_url?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  total_purchases?: number;
  total_revenue?: number;
}

export interface PumoAPIConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  productsKey?: string;
  ordersKey?: string;
  analyticsKey?: string;
  customersKey?: string;
  inventoryKey?: string;
  reviewsKey?: string;
}

export interface ChunkData {
  metadata: {
    chunk_index: number;
    total_chunks: number;
    products_count: number;
    start_index: number;
    end_index: number;
    created_at: string;
    source: string;
    version: string;
  };
  products: PumoProduct[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
  };
  limit?: number;
  mode?: 'semantic' | 'hybrid' | 'keyword';
}

export interface SearchResult {
  product: PumoProduct;
  score: number;
  match_type: 'semantic' | 'keyword' | 'hybrid';
}
