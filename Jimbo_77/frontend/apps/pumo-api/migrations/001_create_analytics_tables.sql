-- Migration: Create Analytics Tables for D1 Database pumo-analiza
-- Database ID: 7b17dccb-96bd-4bec-adc6-92b164ce10f1
-- Created: 2026-01-13

-- Products table (IdoSell products export)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    price REAL,
    stock_quantity INTEGER,
    category TEXT,
    description TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_synced_at ON products(synced_at);

-- Orders table (IdoSell orders export)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    status TEXT,
    total REAL,
    currency TEXT DEFAULT 'PLN',
    customer_email TEXT,
    customer_name TEXT,
    items_count INTEGER,
    order_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_synced_at ON orders(synced_at);

-- Order Items table (products in orders)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT,
    quantity INTEGER,
    price REAL,
    total REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Returns table (IdoSell returns export)
CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id TEXT UNIQUE NOT NULL,
    order_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    reason TEXT,
    status TEXT,
    return_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX idx_returns_return_id ON returns(return_id);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_return_date ON returns(return_date);

-- Customers table (IdoSell customers export)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'PL',
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    first_order_date TEXT,
    last_order_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    synced_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_synced_at ON customers(synced_at);

-- Sync Log table (track sync operations)
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,  -- 'products', 'orders', 'returns', 'customers'
    records_fetched INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    batches INTEGER,
    started_at TEXT,
    completed_at TEXT,
    status TEXT,  -- 'success', 'partial', 'failed'
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_log_entity_type ON sync_log(entity_type);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);

-- Analytics Summary table (pre-computed KPIs)
CREATE TABLE IF NOT EXISTS analytics_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,  -- YYYY-MM-DD
    total_revenue REAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_products_sold INTEGER DEFAULT 0,
    average_order_value REAL DEFAULT 0,
    conversion_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_analytics_summary_date ON analytics_summary(date);

-- Migration metadata
CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT UNIQUE NOT NULL,
    applied_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO _migrations (migration_name) VALUES ('001_create_analytics_tables');
