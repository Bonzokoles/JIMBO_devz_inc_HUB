from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from ..db import get_session
from ..services.meble_pumo_sync import MeblePumoSyncService

router = APIRouter(prefix="/meble-pumo", tags=["MeblePumo"])

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
