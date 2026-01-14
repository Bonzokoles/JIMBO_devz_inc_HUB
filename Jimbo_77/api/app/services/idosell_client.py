"""
IdoSell API Integration for Meble Pumo
"""
from __future__ import annotations
import os
import base64
import httpx
from typing import Optional, Dict, List, Any
from pydantic import BaseModel

# Configuration
IDOSELL_SHOP_URL = os.getenv("IDOSELL_SHOP_URL", "https://meblepumo.iai-shop.com")
IDOSELL_API_KEY = os.getenv("IDOSELL_API_KEY", "YXBwbGljYXRpb24yMDpDcGRCOVp3cE1adG9HY2JTMWVUMXhYUTlmU1dLb0VhWWJOd2lDbG5wN3FpQzEwUkx4cStUYVE1cUFjc041dEpT")

class IdoSellOrder(BaseModel):
    """IdoSell Order model"""
    id: str
    order_id: str
    status: str
    total: float
    currency: str
    created_at: str
    customer_email: Optional[str] = None
    items_count: int = 0

class IdoSellClient:
    def __init__(self, shop_url: str = None, api_key: str = None):
        self.shop_url = shop_url or IDOSELL_SHOP_URL
        self.api_key = api_key or IDOSELL_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        return {
            'X-API-KEY': self.api_key,  # Already base64 encoded
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection with basic endpoint"""
        try:
            url = f"{self.shop_url}/api/admin/v3/orders/orders"
            params = {"page": 1, "per_page": 1}  # Minimal request
            
            response = await self.client.get(
                url,
                headers=self.get_headers(),
                params=params
            )
            
            return {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "response_text": response.text[:500],  # First 500 chars
                "headers": dict(response.headers),
                "url": str(response.url)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "url": f"{self.shop_url}/api/admin/v3/orders/orders"
            }
    
    async def get_orders(self, page: int = 1, per_page: int = 100) -> Dict[str, Any]:
        """Get orders from IdoSell API"""
        try:
            url = f"{self.shop_url}/api/admin/v3/orders/orders"
            params = {"page": page, "per_page": per_page}
            
            response = await self.client.get(
                url,
                headers=self.get_headers(),
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "data": data,
                    "total_orders": len(data.get("orders", [])),
                    "page": page,
                    "per_page": per_page
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_order_details(self, order_id: str) -> Dict[str, Any]:
        """Get specific order details"""
        try:
            url = f"{self.shop_url}/api/admin/v3/orders/orders/{order_id}"
            
            response = await self.client.get(
                url,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "order": response.json()
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# Helper function for dependency injection
def get_idosell_client() -> IdoSellClient:
    """Get IdoSell client instance"""
    return IdoSellClient()
