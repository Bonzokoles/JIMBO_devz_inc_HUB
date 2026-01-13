from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
import uuid

from ..models import ShopSyncStatus, ShopProduct, ShopAnalytics, ShopStatus
from .idosell_parser import IdoSellFeedParser, ProductData

class MeblePumoSyncService:
    """Service do synchronizacji MeblePumo.pl z bazą danych"""
    
    SHOP_NAME = "Meble Pumo"
    FEED_URL = "https://www.meblepumo.pl/pl/products/*.feed10009"  # Może wymagać dostosowania
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.parser = IdoSellFeedParser(self.FEED_URL)
    
    async def get_or_create_shop_sync(self) -> ShopSyncStatus:
        """Pobiera lub tworzy rekord ShopSyncStatus dla MeblePumo"""
        result = await self.db.execute(
            select(ShopSyncStatus).where(ShopSyncStatus.shop_name == self.SHOP_NAME)
        )
        shop_sync = result.scalar_one_or_none()
        
        if not shop_sync:
            shop_sync = ShopSyncStatus(
                id=uuid.uuid4(),
                shop_name=self.SHOP_NAME,
                shop_url="https://www.meblepumo.pl",
                status=ShopStatus.active,
                sync_frequency_minutes=15
            )
            self.db.add(shop_sync)
            await self.db.commit()
            await self.db.refresh(shop_sync)
        
        return shop_sync
    
    async def sync_products_from_xml(self) -> Dict:
        """Synchronizuje produkty z XML feed do bazy"""
        shop_sync = await self.get_or_create_shop_sync()
        
        try:
            # Parse XML feed
            products_data = await self.parser.sync_products()
            
            # Upsert products do bazy
            updated = 0
            created = 0
            
            for product_data in products_data:
                result = await self.db.execute(
                    select(ShopProduct).where(
                        ShopProduct.idosell_product_id == product_data.idosell_product_id
                    )
                )
                existing_product = result.scalar_one_or_none()
                
                if existing_product:
                    # Update existing
                    existing_product.product_name = product_data.product_name
                    existing_product.category_name = product_data.category_name
                    existing_product.price = product_data.price_retail_gross
                    existing_product.stock_quantity = product_data.stock_quantity
                    existing_product.product_url = product_data.product_url
                    existing_product.is_active = product_data.is_active
                    updated += 1
                else:
                    # Create new
                    new_product = ShopProduct(
                        id=uuid.uuid4(),
                        shop_sync_id=shop_sync.id,
                        idosell_product_id=product_data.idosell_product_id,
                        product_name=product_data.product_name,
                        category_name=product_data.category_name,
                        price=product_data.price_retail_gross,
                        currency=product_data.currency,
                        stock_quantity=product_data.stock_quantity,
                        product_url=product_data.product_url,
                        is_active=product_data.is_active
                    )
                    self.db.add(new_product)
                    created += 1
            
            # Update shop sync status
            shop_sync.last_sync_at = datetime.utcnow()
            shop_sync.status = ShopStatus.active
            shop_sync.last_error = None
            
            await self.db.commit()
            
            return {
                "status": "success",
                "products_created": created,
                "products_updated": updated,
                "total_products": len(products_data),
                "synced_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            # Update error status
            shop_sync.last_error = str(e)
            shop_sync.status = ShopStatus.error
            await self.db.commit()
            
            raise Exception(f"Sync failed: {str(e)}")
    
    async def get_analytics_summary(self) -> Dict:
        """Zwraca podsumowanie analytics dla MeblePumo"""
        shop_sync = await self.get_or_create_shop_sync()
        
        # Count products
        result = await self.db.execute(
            select(ShopProduct).where(ShopProduct.shop_sync_id == shop_sync.id)
        )
        products = result.scalars().all()
        
        total_products = len(products)
        active_products = len([p for p in products if p.is_active])
        
        # Get categories
        categories = list(set([p.category_name for p in products if p.category_name]))
        
        return {
            "shop_name": shop_sync.shop_name,
            "shop_url": shop_sync.shop_url,
            "status": shop_sync.status.value,
            "last_sync": shop_sync.last_sync_at.isoformat() if shop_sync.last_sync_at else None,
            "total_products": total_products,
            "active_products": active_products,
            "categories_count": len(categories),
            "categories": categories[:10],  # Top 10 categories
            "last_error": shop_sync.last_error
        }
