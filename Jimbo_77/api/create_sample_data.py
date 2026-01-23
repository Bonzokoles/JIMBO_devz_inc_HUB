#!/usr/bin/env python3
"""Create sample analytics data for PUMO Megastore"""
import json
from datetime import datetime
from pathlib import Path

EXPORTS_DIR = Path(
    "u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports"
)
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Analytics data (format matching backend expectations)
analytics = {
    "total_revenue": 35482.00,
    "orders_count": 10,
    "products_count": 15,
    "customer_segments": {
        "buyers": 10,
        "repeat_customers": 4,
        "new_customers": 6,
        "vip_customers": 2,
    },
    "summary": {
        "total_revenue": 35482.00,
        "total_orders": 10,
        "average_order_value": 3548.20,
        "total_products_sold": 15,
        "period": "2026-01-11 to 2026-01-20",
        "conversion_rate": 3.2,
        "returning_customers": 4,
    },
    "revenue_trend": [
        {"date": "2026-01-20", "revenue": 2499.00, "orders": 1},
        {"date": "2026-01-19", "revenue": 5098.00, "orders": 1},
        {"date": "2026-01-18", "revenue": 3299.00, "orders": 1},
        {"date": "2026-01-17", "revenue": 2898.00, "orders": 1},
        {"date": "2026-01-16", "revenue": 1648.00, "orders": 1},
        {"date": "2026-01-15", "revenue": 2698.00, "orders": 1},
        {"date": "2026-01-14", "revenue": 4798.00, "orders": 1},
        {"date": "2026-01-13", "revenue": 6097.00, "orders": 1},
        {"date": "2026-01-12", "revenue": 1599.00, "orders": 1},
        {"date": "2026-01-11", "revenue": 3948.00, "orders": 1},
    ],
    "top_products": [
        {
            "product_id": "P003",
            "name": "Szafa przesuwna Elegance 220cm",
            "revenue": 6598.00,
            "units_sold": 2,
        },
        {
            "product_id": "P004",
            "name": "Łóżko tapicerowane King Size",
            "revenue": 5598.00,
            "units_sold": 2,
        },
        {
            "product_id": "P001",
            "name": "Sofa Modena 3-osobowa",
            "revenue": 4998.00,
            "units_sold": 2,
        },
    ],
    "customer_segments": {
        "new_customers": 6,
        "returning_customers": 4,
        "vip_customers": 2,
    },
    "export_date": "2026-01-22T21:15:00Z",
}

# Products data
products = {
    "products": [
        {
            "id": "P001",
            "name": "Sofa Modena 3-osobowa",
            "category": "Sofy",
            "price": 2499.00,
            "stock": 15,
        },
        {
            "id": "P002",
            "name": "Stół rozkładany Harmony",
            "category": "Stoły",
            "price": 1899.00,
            "stock": 8,
        },
        {
            "id": "P003",
            "name": "Szafa przesuwna Elegance 220cm",
            "category": "Szafy",
            "price": 3299.00,
            "stock": 5,
        },
        {
            "id": "P004",
            "name": "Łóżko tapicerowane King Size",
            "category": "Łóżka",
            "price": 2799.00,
            "stock": 12,
        },
        {
            "id": "P005",
            "name": "Komoda Vintage 6 szuflad",
            "category": "Komody",
            "price": 1299.00,
            "stock": 20,
        },
    ],
    "total_products": 5,
    "export_date": "2026-01-22T21:15:00Z",
}

# Orders data
orders = {
    "orders": [
        {
            "order_id": "ORD-2026-001",
            "customer": "Jan Kowalski",
            "date": "2026-01-20",
            "total": 2499.00,
            "status": "completed",
        },
        {
            "order_id": "ORD-2026-002",
            "customer": "Anna Nowak",
            "date": "2026-01-19",
            "total": 5098.00,
            "status": "completed",
        },
        {
            "order_id": "ORD-2026-003",
            "customer": "Piotr Wiśniewski",
            "date": "2026-01-18",
            "total": 3299.00,
            "status": "processing",
        },
    ],
    "total_orders": 3,
    "export_date": "2026-01-22T21:15:00Z",
}

# Create files
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

files_created = []
for name, data in [
    ("analytics", analytics),
    ("products", products),
    ("orders", orders),
]:
    filename = f"{name}_{timestamp}.json"
    filepath = EXPORTS_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    files_created.append(filename)
    print(f"✅ Created: {filename}")

print(f"\n🎉 Success! Created {len(files_created)} files in {EXPORTS_DIR}")
