"""
PUMO Diagnosis Hub Data Provider - Demo script

Ten system teraz ZASILĄ istniejący PUMO Diagnosis Hub prawdziwymi danymi
z IdoSell API → PostgreSQL → PUMO Hub Dashboard.

Nie tworzy nowego dashboardu, tylko dostarcza dane do istniejącego.
"""

import asyncio
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def demo_shop_sync():
    """Demonstracja pełnego workflow synchronizacji sklepu"""
    
    print("🏪 DEMO: PUMO Diagnosis Hub Data Provider")
    print("=" * 70)
    print("💡 INTEGRACJA z istniejącym PUMO Diagnosis Hub!")
    print("   - IdoSell API → PostgreSQL → PUMO Hub (http://localhost:5175)")
    print("   - Prawdziwe dane sklepu w dashboardzie")
    print("   - Bez duplikacji - zasilanie obecnego systemu")
    print("=" * 70)
    
    try:
        from app.services.shop_sync_service import ShopSyncService
        
        service = ShopSyncService()
        
        # 1. Inicjalizacja synchronizacji sklepu
        print("\n1️⃣  Inicjalizacja synchronizacji sklepu...")
        shop_sync_id = await service.initialize_shop_sync(
            shop_name="Meble Pumo",
            shop_url="https://meblepumo.iai-shop.com",
            sync_frequency_minutes=15
        )
        print(f"   ✅ Shop Sync ID: {shop_sync_id}")
        
        # 2. Test połączenia z IdoSell
        print("\n2️⃣  Test połączenia z IdoSell API...")
        connection_test = await service.idosell_client.test_connection()
        if connection_test["connected"]:
            print("   ✅ Połączenie z IdoSell: OK")
        else:
            print(f"   ❌ Błąd połączenia: {connection_test['error']}")
        
        # 3. Synchronizacja danych sklepu
        print("\n3️⃣  Synchronizacja danych sklepu...")
        sync_results = await service.sync_shop_data(shop_sync_id)
        
        print(f"   🛍️  Zamówienia zsynchronizowane: {sync_results['orders_synced']}")
        print(f"   📦 Produkty zsynchronizowane: {sync_results['products_synced']}")
        print(f"   📊 Analityki zaktualizowane: {'✅' if sync_results['analytics_updated'] else '❌'}")
        
        if sync_results["errors"]:
            print("   ⚠️  Błędy podczas synchronizacji:")
            for error in sync_results["errors"]:
                print(f"      - {error}")
        
        # 4. Status sklepu z bazy danych
        print("\n4️⃣  Status sklepu z bazy danych PostgreSQL...")
        status = await service.get_shop_status("Meble Pumo")
        
        if "error" not in status:
            print(f"   🏪 Sklep: {status['shop_name']}")
            print(f"   🌐 URL: {status['shop_url']}")
            print(f"   📊 Status: {status['status']}")
            print(f"   🕐 Ostatnia sync: {status['last_sync']}")
            
            stats = status['statistics']
            print(f"   📈 Zamówienia (30 dni): {stats['total_orders_30d']}")
            print(f"   📈 Zamówienia dzisiaj: {stats['today_orders']}")
            print(f"   💰 Przychód (30 dni): {stats['total_revenue_30d']:.2f} PLN")
            print(f"   💰 Przychód dzisiaj: {stats['today_revenue']:.2f} PLN")
            print(f"   🧮 Średnia wartość: {stats['avg_order_value']:.2f} PLN")
        else:
            print(f"   ❌ {status['error']}")
        
        print("\n" + "=" * 70)
        print("🎉 DEMO ZAKOŃCZONE!")
        print("\n💡 SYSTEM DZIAŁANIA:")
        print("   1. IdoSell API → Pobieranie danych sklepu")  
        print("   2. PostgreSQL D2 → Przechowywanie stanu sklepu")
        print("   3. FastAPI Endpoints → Dostarczanie danych")
        print("   4. PUMO Diagnosis Hub → Wyświetlanie dashboardu (http://localhost:5175)")
        print("   5. Background Tasks → Auto-synchronizacja co 15 min")
        
        print("\n🔗 PUMO HUB INTEGRATION:")
        print("   GET /v1/shop-sync/pumo-kpis - KPIs dla dashboardu")
        print("   GET /v1/shop-sync/pumo-revenue-trend - Wykres przychodów")
        print("   GET /v1/shop-sync/pumo-products - Top produkty")
        print("   GET /v1/shop-sync/pumo-hub-data - Wszystkie dane w jednym endpoint")
        
        print("\n🎯 REZULTAT:")
        print("   - Istniejący PUMO Diagnosis Hub dostaje prawdziwe dane z PostgreSQL")
        print("   - Revenue, zamówienia, produkty - wszystko live z IdoSell")
        print("   - Bez zmian w blogU - tylko aktualizacja dashboardu")
        print("   - Pełna integracja z obecnym systemem JIMBO77")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {str(e)}")
        print("💡 Uruchom najpierw: python create_shop_tables.py")
        return False
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        return False


async def quick_status_check():
    """Szybkie sprawdzenie statusu bez pełnej synchronizacji"""
    print("🔍 Quick Status Check...")
    
    try:
        from app.services.shop_sync_service import ShopSyncService
        
        service = ShopSyncService()
        status = await service.get_shop_status("Meble Pumo")
        
        if "error" not in status:
            stats = status['statistics']
            print(f"📊 {status['shop_name']}: {stats['today_orders']} zamówień dzisiaj, {stats['today_revenue']:.2f} PLN")
            return status
        else:
            print(f"❌ {status['error']}")
            return None
            
    except Exception as e:
        print(f"❌ Status check failed: {str(e)}")
        return None


if __name__ == "__main__":
    print("🚀 Shop Sync System Demo")
    print("Wybierz opcję:")
    print("1. Pełne demo (inicjalizacja + sync + status)")
    print("2. Szybki status check")
    print("3. Tylko test połączenia")
    
    choice = input("\nWybór (1-3): ").strip()
    
    if choice == "1":
        asyncio.run(demo_shop_sync())
    elif choice == "2":
        asyncio.run(quick_status_check())
    elif choice == "3":
        async def test_connection():
            from app.services.shop_sync_service import ShopSyncService
            service = ShopSyncService()
            result = await service.idosell_client.test_connection()
            print(f"IdoSell connection: {'✅ OK' if result['connected'] else '❌ FAILED'}")
            if not result['connected']:
                print(f"Error: {result['error']}")
        
        asyncio.run(test_connection())
    else:
        print("❌ Nieprawidłowy wybór")