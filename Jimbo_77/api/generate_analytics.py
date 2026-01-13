#!/usr/bin/env python3
"""
PUMO Analytics Generator - 6 Months Data
Generuje mock dane z ostatnich 6 miesięcy bezpośrednio w PostgreSQL
"""

import asyncio
import logging
from datetime import datetime, timedelta
import random
from decimal import Decimal

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

async def generate_pumo_analytics():
    """Generowanie 6 miesięcy danych analitycznych dla PUMO Hub"""
    
    print("🏪 PUMO Diagnosis Hub - Generowanie danych 6-miesięcznych")
    print("=" * 70)
    
    from app.db import get_async_session
    from app.models import ShopSyncStatus, ShopOrder, ShopProduct, ShopAnalytics, ShopStatus
    from sqlalchemy import select, update, func
    from sqlalchemy.dialects.postgresql import insert
    
    try:
        async with get_async_session() as session:
            # 1. Znajdź lub utwórz shop sync
            print("1️⃣  Inicjalizacja Shop Sync...")
            result = await session.execute(
                select(ShopSyncStatus).where(ShopSyncStatus.shop_name == "Meble Pumo")
            )
            shop_sync = result.scalar_one_or_none()
            
            if not shop_sync:
                shop_sync = ShopSyncStatus(
                    shop_name="Meble Pumo",
                    shop_url="https://meblepumo.iai-shop.com",
                    status=ShopStatus.active,
                    sync_frequency_minutes=15
                )
                session.add(shop_sync)
                await session.flush()
                print(f"   ✅ Utworzono nowy shop sync: {shop_sync.id}")
            else:
                print(f"   ✅ Używam istniejący shop sync: {shop_sync.id}")
            
            # 2. Generuj produkty mock
            print("\n2️⃣  Generowanie produktów...")
            products_data = [
                {"name": "Materac Comfort Plus 160x200", "category": "Materace", "price": 1899.99, "sku": "MAT-001"},
                {"name": "Szafa Classic Oak 220cm", "category": "Szafy", "price": 2499.99, "sku": "SZA-002"},
                {"name": "Fotel Relax Pro szary", "category": "Fotele", "price": 899.99, "sku": "FOT-003"},
                {"name": "Stół Family 180x90 dąb", "category": "Stoły", "price": 1299.99, "sku": "STO-004"},
                {"name": "Łóżko Dream 160x200 białe", "category": "Łóżka", "price": 1699.99, "sku": "LOZ-005"},
                {"name": "Komoda Nord 4-szuflady", "category": "Komody", "price": 699.99, "sku": "KOM-006"},
                {"name": "Regał Book Tower 200cm", "category": "Regały", "price": 599.99, "sku": "REG-007"},
                {"name": "Materac Ortho 140x200", "category": "Materace", "price": 1299.99, "sku": "MAT-008"},
                {"name": "Biurko Office Pro białe", "category": "Biurka", "price": 799.99, "sku": "BIU-009"},
                {"name": "Krzesło Comfort ergonomiczne", "category": "Krzesła", "price": 399.99, "sku": "KRZ-010"}
            ]
            
            for i, prod in enumerate(products_data, 1):
                stmt = insert(ShopProduct).values(
                    shop_sync_id=shop_sync.id,
                    idosell_product_id=f"prod_{i:03d}",
                    product_name=prod["name"],
                    product_sku=prod["sku"],
                    category_name=prod["category"],
                    price=Decimal(str(prod["price"])),
                    currency="PLN",
                    stock_quantity=random.randint(5, 50),
                    is_active=True,
                    product_url=f"https://meblepumo.iai-shop.com/product/{prod['sku'].lower()}",
                    description=f"Wysokiej jakości {prod['name'].lower()} w kategorii {prod['category'].lower()}"
                )
                
                stmt = stmt.on_conflict_do_update(
                    index_elements=['idosell_product_id'],
                    set_=dict(
                        product_name=stmt.excluded.product_name,
                        price=stmt.excluded.price,
                        stock_quantity=stmt.excluded.stock_quantity
                    )
                )
                
                await session.execute(stmt)
            
            print(f"   ✅ Wygenerowano {len(products_data)} produktów")
            
            # 3. Generuj dane historyczne (180 dni)
            print("\n3️⃣  Generowanie danych historycznych (180 dni)...")
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=180)
            
            total_revenue_6m = Decimal('0')
            total_orders_6m = 0
            total_revenue_30d = Decimal('0')
            total_orders_30d = 0
            today_revenue = Decimal('0')
            today_orders = 0
            
            current_date = start_date
            days_generated = 0
            
            while current_date <= end_date:
                # Realistyczne wzorce sprzedaży
                day_of_week = current_date.weekday()
                is_weekend = day_of_week >= 5
                is_today = current_date.date() == end_date.date()
                is_last_30_days = current_date >= (end_date - timedelta(days=30))
                
                # Base orders per day
                base_orders = random.randint(3, 15)
                if is_weekend:
                    base_orders = int(base_orders * 1.4)  # 40% więcej w weekendy
                
                daily_orders = max(1, base_orders + random.randint(-2, 4))
                
                # Revenue calculation
                avg_order_value = random.uniform(600, 2500)  # 600-2500 PLN per order
                daily_revenue = Decimal(str(daily_orders * avg_order_value))
                
                # Seasonal variations
                month = current_date.month
                if month in [11, 12, 1]:  # Zimowe wyprzedaże
                    daily_revenue *= Decimal('1.25')
                elif month in [6, 7]:  # Wakacyjne promocje
                    daily_revenue *= Decimal('1.15')
                
                # AI revenue split
                ai_revenue = daily_revenue * Decimal('0.672')  # 67.2% z AI
                organic_revenue = daily_revenue - ai_revenue
                
                # Upsert analytics
                analytics_stmt = insert(ShopAnalytics).values(
                    shop_sync_id=shop_sync.id,
                    analytics_date=current_date.replace(hour=0, minute=0, second=0, microsecond=0),
                    orders_count=daily_orders,
                    revenue=daily_revenue,
                    avg_order_value=daily_revenue / daily_orders if daily_orders > 0 else Decimal('0'),
                    new_customers=max(1, daily_orders // 3),
                    products_sold=daily_orders * random.randint(1, 4),
                    top_category=random.choice(['Materace', 'Szafy', 'Fotele', 'Stoły', 'Łóżka']),
                    analytics_data={
                        "ai_revenue": float(ai_revenue),
                        "organic_revenue": float(organic_revenue),
                        "conversion_rate": round(random.uniform(3.5, 6.2), 2),
                        "avg_session_duration": random.randint(180, 450),
                        "bounce_rate": round(random.uniform(0.35, 0.65), 2),
                        "traffic_source": random.choice(['google', 'facebook', 'direct', 'email']),
                        "generated": True,
                        "date": current_date.strftime("%Y-%m-%d"),
                        "day_of_week": day_of_week,
                        "is_weekend": is_weekend
                    }
                )
                
                analytics_stmt = analytics_stmt.on_conflict_do_update(
                    index_elements=['shop_sync_id', 'analytics_date'],
                    set_=dict(
                        orders_count=analytics_stmt.excluded.orders_count,
                        revenue=analytics_stmt.excluded.revenue,
                        avg_order_value=analytics_stmt.excluded.avg_order_value,
                        analytics_data=analytics_stmt.excluded.analytics_data
                    )
                )
                
                await session.execute(analytics_stmt)
                
                # Akumuluj statystyki
                total_revenue_6m += daily_revenue
                total_orders_6m += daily_orders
                
                if is_last_30_days:
                    total_revenue_30d += daily_revenue
                    total_orders_30d += daily_orders
                
                if is_today:
                    today_revenue = daily_revenue
                    today_orders = daily_orders
                
                days_generated += 1
                current_date += timedelta(days=1)
            
            # 4. Aktualizuj główne statystyki
            print("\n4️⃣  Aktualizacja głównych statystyk...")
            
            await session.execute(
                update(ShopSyncStatus).where(
                    ShopSyncStatus.id == shop_sync.id
                ).values(
                    total_orders_30d=total_orders_30d,
                    today_orders=today_orders,
                    total_revenue_30d=total_revenue_30d,
                    today_revenue=today_revenue,
                    avg_order_value=total_revenue_30d / total_orders_30d if total_orders_30d > 0 else Decimal('0'),
                    last_sync_at=datetime.now(),
                    status=ShopStatus.active,
                    last_error=None
                )
            )
            
            await session.commit()
            
            print("\n" + "=" * 70)
            print("🎉 DANE ANALITYCZNE WYGENEROWANE POMYŚLNIE!")
            print(f"\n📊 PODSUMOWANIE (6 miesięcy):")
            print(f"   🗓️  Dni: {days_generated}")
            print(f"   🛍️  Zamówienia: {total_orders_6m:,}")
            print(f"   💰 Przychód: {total_revenue_6m:,.2f} PLN")
            print(f"   💎 Średnia wartość: {(total_revenue_6m / total_orders_6m if total_orders_6m > 0 else 0):,.2f} PLN")
            
            print(f"\n📈 OSTATNIE 30 DNI:")
            print(f"   🛍️  Zamówienia: {total_orders_30d:,}")
            print(f"   💰 Przychód: {total_revenue_30d:,.2f} PLN")
            
            print(f"\n📅 DZISIAJ:")
            print(f"   🛍️  Zamówienia: {today_orders}")
            print(f"   💰 Przychód: {today_revenue:.2f} PLN")
            
            print(f"\n🚀 NEXT STEPS:")
            print(f"   1. Uruchom API: python run.py (port 8002)")
            print(f"   2. Test endpoints: http://localhost:8002/v1/shop-sync/pumo-kpis")
            print(f"   3. PUMO Hub: Zaktualizuj API_BASE na http://localhost:8002")
            print(f"   4. Dashboard wyświetli prawdziwe dane!")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Błąd: {str(e)}")
        logging.exception("Full error details")
        return False


if __name__ == "__main__":
    result = asyncio.run(generate_pumo_analytics())
    exit(0 if result else 1)