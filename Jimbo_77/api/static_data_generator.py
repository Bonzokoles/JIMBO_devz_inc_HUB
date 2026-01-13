#!/usr/bin/env python3
"""
PUMO Static Data Generator
Generuje statyczne pliki JSON z danymi 6-miesięcznymi dla PUMO Hub
"""

import json
import random
from datetime import datetime, timedelta
from decimal import Decimal
import os

def generate_static_pumo_data():
    """Generuje statyczne dane PUMO w formacie JSON"""
    
    print("🏪 Generowanie statycznych danych PUMO (6 miesięcy)")
    print("=" * 60)
    
    # 1. Generuj produkty
    products_data = [
        {"name": "Materac Comfort Plus 160x200", "category": "Materace", "price": 1899.99, "sku": "MAT-001", "stock": 25},
        {"name": "Szafa Classic Oak 220cm", "category": "Szafy", "price": 2499.99, "sku": "SZA-002", "stock": 12},
        {"name": "Fotel Relax Pro szary", "category": "Fotele", "price": 899.99, "sku": "FOT-003", "stock": 35},
        {"name": "Stół Family 180x90 dąb", "category": "Stoły", "price": 1299.99, "sku": "STO-004", "stock": 18},
        {"name": "Łóżko Dream 160x200 białe", "category": "Łóżka", "price": 1699.99, "sku": "LOZ-005", "stock": 8},
        {"name": "Komoda Nord 4-szuflady", "category": "Komody", "price": 699.99, "sku": "KOM-006", "stock": 42},
        {"name": "Regał Book Tower 200cm", "category": "Regały", "price": 599.99, "sku": "REG-007", "stock": 28},
        {"name": "Materac Ortho 140x200", "category": "Materace", "price": 1299.99, "sku": "MAT-008", "stock": 33},
        {"name": "Biurko Office Pro białe", "category": "Biurka", "price": 799.99, "sku": "BIU-009", "stock": 15},
        {"name": "Krzesło Comfort ergonomiczne", "category": "Krzesła", "price": 399.99, "sku": "KRZ-010", "stock": 67}
    ]
    
    # 2. Generuj historię sprzedaży (180 dni)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    total_revenue_6m = 0
    total_orders_6m = 0
    total_revenue_30d = 0
    total_orders_30d = 0
    today_revenue = 0
    today_orders = 0
    
    daily_data = []
    revenue_trend = []
    
    current_date = start_date
    
    while current_date <= end_date:
        day_of_week = current_date.weekday()
        is_weekend = day_of_week >= 5
        is_today = current_date.date() == end_date.date()
        is_last_30_days = current_date >= (end_date - timedelta(days=30))
        
        # Realistyczne dane
        base_orders = random.randint(3, 15)
        if is_weekend:
            base_orders = int(base_orders * 1.4)
        
        daily_orders = max(1, base_orders + random.randint(-2, 4))
        avg_order_value = random.uniform(600, 2500)
        daily_revenue = daily_orders * avg_order_value
        
        # Seasonal variations
        month = current_date.month
        if month in [11, 12, 1]:
            daily_revenue *= 1.25
        elif month in [6, 7]:
            daily_revenue *= 1.15
        
        # AI vs Organic
        ai_revenue = daily_revenue * 0.672
        organic_revenue = daily_revenue - ai_revenue
        
        daily_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "orders": daily_orders,
            "revenue": round(daily_revenue, 2),
            "avg_order_value": round(daily_revenue / daily_orders, 2),
            "ai_revenue": round(ai_revenue, 2),
            "organic_revenue": round(organic_revenue, 2),
            "conversion_rate": round(random.uniform(3.5, 6.2), 2),
            "traffic": {
                "visits": daily_orders * random.randint(15, 35),
                "bounce_rate": round(random.uniform(0.35, 0.65), 2),
                "avg_session": random.randint(180, 450)
            }
        })
        
        # Akumuluj statystyki
        total_revenue_6m += daily_revenue
        total_orders_6m += daily_orders
        
        if is_last_30_days:
            total_revenue_30d += daily_revenue
            total_orders_30d += daily_orders
            
            # Revenue trend (last 30 days)
            revenue_trend.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "revenue": round(daily_revenue, 2)
            })
        
        if is_today:
            today_revenue = daily_revenue
            today_orders = daily_orders
        
        current_date += timedelta(days=1)
    
    # 3. Struktura głównych KPI
    pumo_kpis = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "shop_name": "Meble Pumo",
        "shop_url": "https://meblepumo.iai-shop.com",
        "period": "6_months",
        "kpis": {
            "today": {
                "orders": int(today_orders),
                "revenue": round(today_revenue, 2),
                "avg_order_value": round(today_revenue / today_orders if today_orders > 0 else 0, 2)
            },
            "last_30_days": {
                "orders": int(total_orders_30d),
                "revenue": round(total_revenue_30d, 2),
                "avg_order_value": round(total_revenue_30d / total_orders_30d if total_orders_30d > 0 else 0, 2),
                "growth_rate": round(random.uniform(8.5, 24.7), 1)
            },
            "last_6_months": {
                "orders": int(total_orders_6m),
                "revenue": round(total_revenue_6m, 2),
                "avg_order_value": round(total_revenue_6m / total_orders_6m if total_orders_6m > 0 else 0, 2),
                "products_sold": int(total_orders_6m * 2.3),
                "new_customers": int(total_orders_6m * 0.68)
            }
        },
        "ai_impact": {
            "total_ai_revenue": round(total_revenue_6m * 0.672, 2),
            "ai_percentage": 67.2,
            "organic_revenue": round(total_revenue_6m * 0.328, 2),
            "organic_percentage": 32.8,
            "roi_improvement": "+340%"
        },
        "top_categories": [
            {"name": "Materace", "revenue": round(total_revenue_6m * 0.28, 2), "orders": int(total_orders_6m * 0.25)},
            {"name": "Szafy", "revenue": round(total_revenue_6m * 0.22, 2), "orders": int(total_orders_6m * 0.18)},
            {"name": "Fotele", "revenue": round(total_revenue_6m * 0.19, 2), "orders": int(total_orders_6m * 0.22)},
            {"name": "Łóżka", "revenue": round(total_revenue_6m * 0.17, 2), "orders": int(total_orders_6m * 0.15)},
            {"name": "Stoły", "revenue": round(total_revenue_6m * 0.14, 2), "orders": int(total_orders_6m * 0.20)}
        ]
    }
    
    # 4. Revenue trend (30 days)
    pumo_revenue_trend = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "period": "last_30_days",
        "data": revenue_trend[-30:]  # Last 30 days only
    }
    
    # 5. Products data
    pumo_products = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "total_products": len(products_data),
        "products": products_data
    }
    
    # 6. Hub data (combined)
    pumo_hub_data = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "shop_info": {
            "name": "Meble Pumo",
            "url": "https://meblepumo.iai-shop.com",
            "status": "active",
            "last_sync": datetime.now().isoformat()
        },
        "summary": pumo_kpis["kpis"],
        "ai_impact": pumo_kpis["ai_impact"],
        "recent_data": daily_data[-7:],  # Last 7 days
        "top_products": products_data[:5]  # Top 5
    }
    
    # 7. Zapisz pliki JSON
    static_dir = "static_data"
    os.makedirs(static_dir, exist_ok=True)
    
    files_to_create = {
        f"{static_dir}/pumo-kpis.json": pumo_kpis,
        f"{static_dir}/pumo-revenue-trend.json": pumo_revenue_trend,
        f"{static_dir}/pumo-products.json": pumo_products,
        f"{static_dir}/pumo-hub-data.json": pumo_hub_data,
        f"{static_dir}/daily-data-full.json": {"success": True, "data": daily_data}
    }
    
    for filename, data in files_to_create.items():
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Zapisano: {filename}")
    
    # 8. Wyniki
    print("\n" + "=" * 60)
    print("🎉 DANE STATYCZNE WYGENEROWANE!")
    print(f"\n📊 STATYSTYKI:")
    print(f"   🗓️  Dni: {len(daily_data)}")
    print(f"   🛍️  Zamówienia (6m): {total_orders_6m:,}")
    print(f"   💰 Przychód (6m): {total_revenue_6m:,.2f} PLN")
    print(f"   💎 Średnia wartość: {(total_revenue_6m / total_orders_6m):,.2f} PLN")
    print(f"   🤖 AI Revenue: {(total_revenue_6m * 0.672):,.2f} PLN (67.2%)")
    
    print(f"\n📁 PLIKI JSON:")
    for filename in files_to_create.keys():
        print(f"   📄 {filename}")
    
    print(f"\n🚀 URUCHOM SERWER:")
    print(f"   python simple_server.py")
    print(f"   Test: http://localhost:8003/pumo-kpis.json")
    
    return True

if __name__ == "__main__":
    result = generate_static_pumo_data()
    exit(0 if result else 1)