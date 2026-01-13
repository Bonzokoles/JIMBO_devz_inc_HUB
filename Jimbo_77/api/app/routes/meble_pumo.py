from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Optional
from pydantic import BaseModel, Field

from ..db import get_session
from ..services.meble_pumo_sync import MeblePumoSyncService
from ..services.idosell_client import get_idosell_client
from ..services.d1_service import get_d1_service

router = APIRouter(prefix="/meble-pumo", tags=["MeblePumo"])

# ===== REQUEST MODELS =====
class IdoSellExportRequest(BaseModel):
    """Request model for IdoSell to D1 export"""
    api_key: str = Field(..., description="IdoSell API key")
    method: str = Field(default="x-api-key", description="Auth method: 'x-api-key' or 'oauth'")
    entities: list[str] = Field(default=["products", "orders"], description="Entities to export: products, orders, returns, customers")
    since_date: Optional[str] = Field(None, description="Export data from this date (YYYY-MM-DD)")
    cloudflare_account_id: Optional[str] = Field(None, description="Cloudflare Account ID (for direct D1 API)")
    cloudflare_api_token: Optional[str] = Field(None, description="Cloudflare API Token (for direct D1 API)")

@router.post("/sync", response_model=Dict)
async def sync_meble_pumo_products(db: AsyncSession = Depends(get_session)):
    """
    Synchronizuje produkty z MeblePumo.pl (IdoSell XML feed)
    
    - Parsuje 529k+ produktów z XML
    - Upsertuje do PostgreSQL
    - Zwraca statystyki synchronizacji
    """
    sync_service = MeblePumoSyncService(db)
    try:
        result = await sync_service.sync_products_from_xml()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/idosell/export-to-d1", response_model=Dict)
async def export_idosell_to_d1(request: IdoSellExportRequest = Body(...)):
    """
    🚀 NOWY ENDPOINT: Export danych z IdoSell API do Cloudflare D1
    
    Body JSON:
    {
        "api_key": "TWÓJ_KLUCZ_IDOSELL",
        "method": "x-api-key",  // lub "oauth"
        "entities": ["products", "orders"],  // co exportować
        "since_date": "2025-07-13",  // opcjonalnie - data od
        "cloudflare_account_id": "...",  // opcjonalnie - dla direct D1 API
        "cloudflare_api_token": "..."  // opcjonalnie - dla direct D1 API
    }
    
    Process:
    1. Testuje klucz API IdoSell
    2. Pobiera dane (products, orders, returns, customers)
    3. Zapisuje do Cloudflare D1 database (pumo-analiza)
    4. Zwraca statystyki eksportu
    
    Returns:
    - test_results: Status testów API key
    - export_summary: Statystyki pobranych danych
    - d1_results: Statystyki zapisu do D1
    """
    import os
    from ..services.idosell_client import IdoSellClient
    
    # Step 1: Test API key
    test_client = IdoSellClient(
        base_url=os.getenv("IDOSELL_SHOP_URL", "https://meblepumo.iai-shop.com"),
        api_key=request.api_key,
        auth_method=request.method
    )
    
    test_results = {"tested_endpoints": [], "working_endpoints": []}
    
    # Test products endpoint
    try:
        test_products = await test_client.fetch_products(limit=1)
        if test_products.get("success"):
            test_results["tested_endpoints"].append("products")
            test_results["working_endpoints"].append("products")
    except Exception as e:
        test_results["tested_endpoints"].append("products")
        test_results["products_error"] = str(e)
    
    # Test orders endpoint
    try:
        test_orders = await test_client.fetch_orders(limit=1)
        if test_orders.get("success"):
            test_results["tested_endpoints"].append("orders")
            test_results["working_endpoints"].append("orders")
    except Exception as e:
        test_results["tested_endpoints"].append("orders")
        test_results["orders_error"] = str(e)
    
    await test_client.close()
    
    # If no endpoints work, return error
    if not test_results["working_endpoints"]:
        raise HTTPException(
            status_code=401,
            detail=f"API key nie działa! Tested: {test_results['tested_endpoints']}, Errors: {test_results}"
        )
    
    # Step 2: Export data based on entities
    idosell_client = IdoSellClient(
        base_url=os.getenv("IDOSELL_SHOP_URL"),
        api_key=request.api_key,
        auth_method=request.method
    )
    
    try:
        export_result = await idosell_client.export_all_data(
            order_date_from=request.since_date,
            product_date_from=request.since_date
        )
        
        if not export_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Export failed: {export_result.get('errors')}"
            )
        
        # Step 3: Save to D1
        d1_service = get_d1_service()
        d1_results = {}
        
        # Products
        if "products" in request.entities:
            products_data = export_result["data"].get("products", {})
            if products_data.get("success") and products_data.get("all_products"):
                products_insert = await d1_service.bulk_insert_products(
                    products_data["all_products"]
                )
                d1_results["products"] = products_insert
                
                await d1_service.log_sync(
                    entity_type="products",
                    records_fetched=products_data.get("total_fetched", 0),
                    records_created=products_insert.get("inserted", 0),
                    records_updated=0,
                    batches=products_data.get("batches", 0),
                    status="success" if products_insert.get("success") else "failed",
                    error_message=products_insert.get("error")
                )
        
        # Orders
        if "orders" in request.entities:
            orders_data = export_result["data"].get("orders", {})
            if orders_data.get("success") and orders_data.get("all_orders"):
                orders_insert = await d1_service.bulk_insert_orders(
                    orders_data["all_orders"]
                )
                d1_results["orders"] = orders_insert
                
                await d1_service.log_sync(
                    entity_type="orders",
                    records_fetched=orders_data.get("total_fetched", 0),
                    records_created=orders_insert.get("inserted", 0),
                    records_updated=0,
                    batches=orders_data.get("batches", 0),
                    status="success" if orders_insert.get("success") else "failed",
                    error_message=orders_insert.get("error")
                )
        
        await d1_service.close()
        
        return {
            "success": True,
            "test_results": test_results,
            "export_summary": export_result,
            "d1_results": d1_results,
            "timestamp": export_result.get("timestamp")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await idosell_client.close()


@router.get("/analytics", response_model=Dict)
async def get_meble_pumo_analytics(db: AsyncSession = Depends(get_session)):
    """
    Zwraca podsumowanie analytics dla MeblePumo.pl
    
    - Total produktów
    - Kategorie
    - Status synchronizacji
    - Ostatni sync timestamp
    """
    sync_service = MeblePumoSyncService(db)
    try:
        analytics = await sync_service.get_analytics_summary()
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status", response_model=Dict)
async def get_meble_pumo_status(db: AsyncSession = Depends(get_session)):
    """Zwraca status sklepu MeblePumo"""
    sync_service = MeblePumoSyncService(db)
    shop_sync = await sync_service.get_or_create_shop_sync()
    
    return {
        "shop_name": shop_sync.shop_name,
        "status": shop_sync.status.value,
        "last_sync": shop_sync.last_sync_at.isoformat() if shop_sync.last_sync_at else None,
        "sync_frequency_minutes": shop_sync.sync_frequency_minutes,
        "last_error": shop_sync.last_error
    }

@router.get("/idosell/export-all", response_model=Dict)
async def export_all_idosell_data(
    order_date_from: Optional[str] = Query(None, description="Filter orders from date (YYYY-MM-DD)"),
    product_date_from: Optional[str] = Query(None, description="Filter products from date (YYYY-MM-DD)")
):
    """
    PEŁNY EKSPORT wszystkich danych z IdoSell API v3
    
    Endpoints:
    - GET /products (paginacja)
    - GET /orders (paginacja + filtr po dacie)
    - GET /returns (paginacja)
    - GET /customers (paginacja)
    
    Returns:
    - all_products: Lista wszystkich produktów
    - all_orders: Lista wszystkich zamówień
    - all_returns: Lista wszystkich zwrotów
    - all_customers: Lista wszystkich klientów
    - summary: Statystyki eksportu
    """
    client = get_idosell_client()
    try:
        result = await client.export_all_data(
            order_date_from=order_date_from,
            product_date_from=product_date_from
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()

@router.get("/idosell/products", response_model=Dict)
async def fetch_all_idosell_products(
    created_after: Optional[str] = Query(None, description="Filter products created after (YYYY-MM-DD)")
):
    """
    Pobierz WSZYSTKIE produkty z IdoSell z paginacją
    
    Parametry:
    - created_after: Filtruj po dacie utworzenia (opcjonalne)
    
    Returns:
    - all_products: Lista produktów
    - total_fetched: Liczba pobranych produktów
    - batches: Liczba batch-y
    """
    client = get_idosell_client()
    try:
        result = await client.fetch_all_products(created_after=created_after)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()

@router.get("/idosell/orders", response_model=Dict)
async def fetch_all_idosell_orders(
    order_add_date_from: Optional[str] = Query(None, description="Filter orders from date (YYYY-MM-DD)")
):
    """
    Pobierz WSZYSTKIE zamówienia z IdoSell z paginacją
    
    Parametry:
    - order_add_date_from: Filtruj po dacie dodania (opcjonalne)
    
    Returns:
    - all_orders: Lista zamówień
    - total_fetched: Liczba pobranych zamówień
    - batches: Liczba batch-y
    """
    client = get_idosell_client()
    try:
        result = await client.fetch_all_orders(order_add_date_from=order_add_date_from)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()

@router.get("/idosell/returns", response_model=Dict)
async def fetch_all_idosell_returns():
    """
    Pobierz WSZYSTKIE zwroty z IdoSell z paginacją
    
    Returns:
    - all_returns: Lista zwrotów
    - total_fetched: Liczba pobranych zwrotów
    - batches: Liczba batch-y
    """
    client = get_idosell_client()
    try:
        result = await client.fetch_all_returns()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()

@router.get("/idosell/customers", response_model=Dict)
async def fetch_all_idosell_customers():
    """
    Pobierz WSZYSTKICH klientów z IdoSell z paginacją
    
    Returns:
    - all_customers: Lista klientów
    - total_fetched: Liczba pobranych klientów
    - batches: Liczba batch-y
    """
    client = get_idosell_client()
    try:
        result = await client.fetch_all_customers()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()

@router.post("/idosell/export-to-d1", response_model=Dict)
async def export_idosell_data_to_d1(
    order_date_from: Optional[str] = Query(None, description="Filter orders from date (YYYY-MM-DD)"),
    product_date_from: Optional[str] = Query(None, description="Filter products from date (YYYY-MM-DD)")
):
    """
    EKSPORT DANYCH Z IDOSELL DO D1 DATABASE (pumo-analiza)
    
    Process:
    1. Fetch wszystkich danych z IdoSell API v3 (products, orders, returns, customers)
    2. Insert do D1 database (7b17dccb-96bd-4bec-adc6-92b164ce10f1)
    3. Log sync operation
    
    Returns:
    - export_summary: Podsumowanie eksportu
    - d1_results: Wyniki zapisu do D1
    - sync_log: Log synchronizacji
    """
    idosell_client = get_idosell_client()
    d1_service = get_d1_service()
    
    try:
        # Step 1: Fetch all data from IdoSell
        export_result = await idosell_client.export_all_data(
            order_date_from=order_date_from,
            product_date_from=product_date_from
        )
        
        if not export_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"IdoSell export failed: {export_result.get('errors')}"
            )
        
        # Step 2: Insert to D1 database
        d1_results = {}
        
        # Insert products
        products_data = export_result["data"].get("products", {})
        if products_data.get("success"):
            products_insert = await d1_service.bulk_insert_products(
                products_data.get("all_products", [])
            )
            d1_results["products"] = products_insert
            
            # Log sync
            await d1_service.log_sync(
                entity_type="products",
                records_fetched=products_data.get("total_fetched", 0),
                records_created=products_insert.get("inserted", 0),
                records_updated=0,
                batches=products_data.get("batches", 0),
                status="success" if products_insert.get("success") else "failed",
                error_message=products_insert.get("error")
            )
        
        # Insert orders
        orders_data = export_result["data"].get("orders", {})
        if orders_data.get("success"):
            orders_insert = await d1_service.bulk_insert_orders(
                orders_data.get("all_orders", [])
            )
            d1_results["orders"] = orders_insert
            
            # Log sync
            await d1_service.log_sync(
                entity_type="orders",
                records_fetched=orders_data.get("total_fetched", 0),
                records_created=orders_insert.get("inserted", 0),
                records_updated=0,
                batches=orders_data.get("batches", 0),
                status="success" if orders_insert.get("success") else "failed",
                error_message=orders_insert.get("error")
            )
        
        return {
            "success": True,
            "export_summary": export_result,
            "d1_results": d1_results,
            "timestamp": export_result.get("timestamp")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await idosell_client.close()
        await d1_service.close()

@router.get("/d1/analytics-summary", response_model=Dict)
async def get_d1_analytics_summary(
    date: Optional[str] = Query(None, description="Date (YYYY-MM-DD), defaults to today")
):
    """
    Pobierz analytics summary z D1 database
    
    Returns:
    - summary: KPIs dla wybranej daty
    """
    d1_service = get_d1_service()
    try:
        result = await d1_service.get_analytics_summary(date=date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await d1_service.close()
