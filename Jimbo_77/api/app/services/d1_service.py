"""
D1 Database Service for Cloudflare D1
Handles data export to pumo-analiza database
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime
import os

D1_API_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query"
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
D1_DATABASE_ID = "7b17dccb-96bd-4bec-adc6-92b164ce10f1"  # pumo-analiza


class D1Service:
    """Service for interacting with Cloudflare D1 database"""
    
    def __init__(self, account_id: str = None, api_token: str = None, database_id: str = None):
        self.account_id = account_id or CLOUDFLARE_ACCOUNT_ID
        self.api_token = api_token or CLOUDFLARE_API_TOKEN
        self.database_id = database_id or D1_DATABASE_ID
        self.api_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/d1/database/{self.database_id}/query"
        self.client = httpx.AsyncClient(timeout=60.0)
    
    def get_headers(self) -> Dict[str, str]:
        """Get API headers for D1 requests"""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    async def execute_query(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """
        Execute SQL query on D1 database
        
        Args:
            sql: SQL query string
            params: Optional query parameters
        
        Returns:
            Query result with rows and metadata
        """
        try:
            payload = {
                "sql": sql
            }
            if params:
                payload["params"] = params
            
            response = await self.client.post(
                self.api_url,
                headers=self.get_headers(),
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "result": data.get("result", [{}])[0],
                    "meta": data.get("result", [{}])[0].get("meta", {}),
                    "rows": data.get("result", [{}])[0].get("results", [])
                }
            else:
                return {
                    "success": False,
                    "error": response.text,
                    "status_code": response.status_code
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def bulk_insert_products(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk insert products into D1 database
        
        Args:
            products: List of product dictionaries
        
        Returns:
            Insert result with count
        """
        if not products:
            return {"success": True, "inserted": 0}
        
        try:
            # Build INSERT OR REPLACE statement
            sql_values = []
            for product in products:
                product_id = product.get("id", "")
                name = product.get("name", "").replace("'", "''")
                sku = product.get("sku", "")
                price = product.get("price", 0)
                stock = product.get("stock_quantity", 0)
                category = product.get("category", "").replace("'", "''")
                
                sql_values.append(
                    f"('{product_id}', '{name}', '{sku}', {price}, {stock}, '{category}', datetime('now'))"
                )
            
            sql = f"""
            INSERT OR REPLACE INTO products (product_id, name, sku, price, stock_quantity, category, synced_at)
            VALUES {', '.join(sql_values)}
            """
            
            result = await self.execute_query(sql)
            
            return {
                "success": result.get("success"),
                "inserted": len(products) if result.get("success") else 0,
                "error": result.get("error")
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "inserted": 0
            }
    
    async def bulk_insert_orders(self, orders: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk insert orders into D1 database
        
        Args:
            orders: List of order dictionaries
        
        Returns:
            Insert result with count
        """
        if not orders:
            return {"success": True, "inserted": 0}
        
        try:
            sql_values = []
            for order in orders:
                order_id = order.get("id", "")
                status = order.get("status", "")
                total = order.get("total", 0)
                currency = order.get("currency", "PLN")
                customer_email = order.get("customer_email", "").replace("'", "''")
                items_count = order.get("items_count", 0)
                order_date = order.get("created_at", datetime.utcnow().isoformat())
                
                sql_values.append(
                    f"('{order_id}', '{status}', {total}, '{currency}', '{customer_email}', {items_count}, '{order_date}', datetime('now'))"
                )
            
            sql = f"""
            INSERT OR REPLACE INTO orders (order_id, status, total, currency, customer_email, items_count, order_date, synced_at)
            VALUES {', '.join(sql_values)}
            """
            
            result = await self.execute_query(sql)
            
            return {
                "success": result.get("success"),
                "inserted": len(orders) if result.get("success") else 0,
                "error": result.get("error")
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "inserted": 0
            }
    
    async def log_sync(self, entity_type: str, records_fetched: int, 
                      records_created: int, records_updated: int, 
                      batches: int, status: str, error_message: str = None) -> Dict[str, Any]:
        """
        Log sync operation to sync_log table
        
        Args:
            entity_type: Type of entity synced ('products', 'orders', etc.)
            records_fetched: Number of records fetched
            records_created: Number of records created
            records_updated: Number of records updated
            batches: Number of batches processed
            status: Sync status ('success', 'partial', 'failed')
            error_message: Optional error message
        
        Returns:
            Log result
        """
        error_msg = (error_message or "").replace("'", "''")
        
        sql = f"""
        INSERT INTO sync_log (entity_type, records_fetched, records_created, records_updated, batches, completed_at, status, error_message)
        VALUES ('{entity_type}', {records_fetched}, {records_created}, {records_updated}, {batches}, datetime('now'), '{status}', '{error_msg}')
        """
        
        return await self.execute_query(sql)
    
    async def get_analytics_summary(self, date: str = None) -> Dict[str, Any]:
        """
        Get analytics summary for a specific date
        
        Args:
            date: Date string (YYYY-MM-DD), defaults to today
        
        Returns:
            Analytics summary data
        """
        if not date:
            date = datetime.utcnow().strftime("%Y-%m-%d")
        
        sql = f"SELECT * FROM analytics_summary WHERE date = '{date}'"
        result = await self.execute_query(sql)
        
        if result.get("success") and result.get("rows"):
            return {
                "success": True,
                "summary": result["rows"][0]
            }
        else:
            return {
                "success": False,
                "error": "No data found for date"
            }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


def get_d1_service() -> D1Service:
    """Get D1 service instance"""
    return D1Service()
