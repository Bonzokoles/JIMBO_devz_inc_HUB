"""
Export data from PostgreSQL to Cloudflare D1 Database
Reads from local PostgreSQL (pumo-hub data) and sends to D1 via API
"""
import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.models import ShopProduct
from sqlalchemy import select

CLOUDFLARE_ACCOUNT_ID = "YOUR_ACCOUNT_ID"
CLOUDFLARE_API_TOKEN = "YOUR_API_TOKEN"
D1_DATABASE_ID = "7b17dccb-96bd-4bec-adc6-92b164ce10f1"
D1_API_URL = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/d1/database/{D1_DATABASE_ID}/query"


async def export_products_to_d1():
    """Export products from PostgreSQL to D1"""
    
    # Get PostgreSQL session
    async for session in get_session():
        # Fetch products from PostgreSQL
        query = select(ShopProduct).where(ShopProduct.shop_id == 1).limit(100)
        result = await session.execute(query)
        products = result.scalars().all()
        
        print(f"Fetched {len(products)} products from PostgreSQL")
        
        # Prepare batch insert for D1
        if not products:
            print("No products to export")
            return
        
        values = []
        for product in products:
            product_id = (product.product_id or '').replace("'", "''")
            name = (product.name or '').replace("'", "''")
            price = float(product.price) if product.price else 0
            stock = product.stock_quantity or 0
            
            values.append(
                f"('{product_id}', '{name}', '', {price}, {stock}, '', datetime('now'))"
            )
        
        sql = f"""
        INSERT OR REPLACE INTO products (product_id, name, sku, price, stock_quantity, category, synced_at)
        VALUES {', '.join(values)}
        """
        
        # Send to D1 via API
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            }
            
            payload = {"sql": sql}
            
            response = await client.post(D1_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                print(f"✅ Successfully exported {len(products)} products to D1")
                data = response.json()
                print(f"Response: {data}")
            else:
                print(f"❌ Failed to export: {response.status_code}")
                print(f"Error: {response.text}")
        
        break


if __name__ == "__main__":
    print("🚀 Exporting data from PostgreSQL to D1...")
    asyncio.run(export_products_to_d1())
