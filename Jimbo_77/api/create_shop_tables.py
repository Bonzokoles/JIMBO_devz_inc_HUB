"""
Database Migration Script - Shop Sync Tables

Uruchom ten skrypt po zdefiniowaniu modeli shop sync aby utworzyć tabele w PostgreSQL.
"""

import asyncio
import logging
from sqlalchemy import text
from app.db import get_async_engine, get_async_session
from app.models import Base

logger = logging.getLogger(__name__)


async def create_shop_sync_tables():
    """Tworzenie tabel dla shop sync system"""
    engine = get_async_engine()
    
    try:
        # Utwórz wszystkie tabele
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Shop sync tables created successfully")
        
        # Sprawdź czy tabele zostały utworzone
        async with get_async_session() as session:
            result = await session.execute(
                text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE 'shop_%'
                    ORDER BY table_name
                """)
            )
            tables = [row[0] for row in result.fetchall()]
            
            print("✅ Created shop sync tables:")
            for table in tables:
                print(f"   - {table}")
            
            return tables
    
    except Exception as e:
        logger.error(f"Failed to create shop sync tables: {str(e)}")
        raise


async def verify_tables():
    """Sprawdzenie struktury tabel shop sync"""
    async with get_async_session() as session:
        tables_info = {}
        
        shop_tables = ['shop_sync_status', 'shop_orders', 'shop_products', 'shop_analytics']
        
        for table_name in shop_tables:
            result = await session.execute(
                text(f"""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}'
                    ORDER BY ordinal_position
                """)
            )
            
            columns = []
            for row in result.fetchall():
                columns.append({
                    "name": row[0],
                    "type": row[1], 
                    "nullable": row[2] == "YES"
                })
            
            tables_info[table_name] = columns
        
        print("\n📋 Shop Sync Tables Structure:")
        for table_name, columns in tables_info.items():
            print(f"\n🗂️  {table_name.upper()}")
            for col in columns:
                nullable = "NULL" if col["nullable"] else "NOT NULL"
                print(f"   - {col['name']}: {col['type']} ({nullable})")
        
        return tables_info


if __name__ == "__main__":
    async def main():
        print("🏗️  Creating Shop Sync Database Tables...")
        
        try:
            # Utwórz tabele
            tables = await create_shop_sync_tables()
            
            # Zweryfikuj strukturę
            await verify_tables()
            
            print(f"\n✅ Migration completed successfully!")
            print(f"   Created {len(tables)} tables for shop synchronization")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            return 1
        
        return 0
    
    import sys
    sys.exit(asyncio.run(main()))