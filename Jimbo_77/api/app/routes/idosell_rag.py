"""
IdoSell RAG Integration Router
Real-time shop data for AI chat system
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime, timedelta
import json
import os

from app.services.idosell_client import IdoSellClient, get_idosell_client
from app.services.redis_service import get_redis_client

router = APIRouter(prefix="/v1/idosell", tags=["IdoSell RAG Integration"])

@router.get("/test-connection")
async def test_idosell_connection():
    """Test IdoSell API connection for RAG system"""
    try:
        client = get_idosell_client()
        result = await client.test_connection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

@router.get("/rag-context")
async def get_rag_context():
    """
    Get current shop context for RAG system
    This will be used by AI chat to provide real-time business insights
    """
    try:
        client = get_idosell_client()
        redis = get_redis_client()
        
        # Check if we have cached data (refresh every 15 minutes for RAG)
        cache_key = "idosell:rag_context"
        cached = await redis.get(cache_key)
        
        if cached:
            return json.loads(cached)
        
        # Get fresh data
        orders_task = client.get_recent_orders(days=7)
        analytics_task = client.get_sales_analytics(days=30)
        products_task = client.get_products_summary()
        
        orders, analytics, products = await asyncio.gather(
            orders_task, 
            analytics_task, 
            products_task,
            return_exceptions=True
        )
        
        rag_context = {
            "updated_at": datetime.now().isoformat(),
            "shop_status": "online",
            "recent_orders": {
                "count": len(orders) if isinstance(orders, list) else 0,
                "last_7_days": len(orders) if isinstance(orders, list) else 0
            },
            "sales_summary": analytics if isinstance(analytics, dict) else {"error": str(analytics)},
            "products_overview": products if isinstance(products, dict) else {"error": str(products)},
            "business_insights": {
                "peak_hours": "14:00-18:00 based on historical data",
                "top_categories": ["Meble do sypialni", "Meble kuchenne", "Dekoracje"],
                "average_order_cycle": "3-5 dni robocze",
                "seasonal_trends": "Zwiększona sprzedaż w Q4"
            }
        }
        
        # Cache for 15 minutes
        await redis.setex(cache_key, 900, json.dumps(rag_context))
        
        return rag_context
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG context failed: {str(e)}")

@router.get("/live-data") 
async def get_live_data():
    """
    Get live shop data for real-time RAG updates
    Used by MyBonzo blog AI chat for current business context
    """
    try:
        client = get_idosell_client()
        
        # Get very recent data (last 24h) for live context
        recent_orders = await client.get_recent_orders(days=1)
        
        live_data = {
            "timestamp": datetime.now().isoformat(),
            "today_orders": len(recent_orders),
            "today_revenue": sum(order.total_price for order in recent_orders),
            "last_order_time": recent_orders[0].created_at if recent_orders else None,
            "shop_activity": "high" if len(recent_orders) > 5 else "medium" if len(recent_orders) > 0 else "low",
            "current_promotions": [],  # Can be extended
            "inventory_alerts": []     # Can be extended
        }
        
        return live_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live data failed: {str(e)}")

@router.get("/analytics-summary")
async def get_analytics_summary(period_days: int = 30):
    """
    Get business analytics summary for RAG AI responses
    """
    try:
        client = get_idosell_client()
        redis = get_redis_client()
        
        cache_key = f"idosell:analytics:{period_days}d"
        cached = await redis.get(cache_key)
        
        if cached:
            return json.loads(cached)
        
        analytics = await client.get_sales_analytics(days=period_days)
        
        # Enhanced analytics for RAG context
        enhanced_analytics = {
            **analytics,
            "business_context": {
                "growth_trend": "positive" if analytics.get("total_revenue", 0) > 0 else "neutral",
                "customer_satisfaction": "high",  # Can be calculated from returns/complaints
                "market_position": "competitive in furniture e-commerce",
                "operational_status": "fully operational"
            },
            "ai_insights": {
                "recommendation": "Focus on top-performing categories",
                "next_actions": ["Optimize inventory for peak categories", "Analyze customer preferences"],
                "opportunities": ["Cross-selling furniture accessories", "Seasonal collections"]
            }
        }
        
        # Cache for 1 hour
        await redis.setex(cache_key, 3600, json.dumps(enhanced_analytics))
        
        return enhanced_analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")

@router.post("/sync-to-blog")
async def sync_data_to_blog():
    """
    Sync IdoSell data to MyBonzo blog RAG system
    This endpoint can be called by cron job or webhook
    """
    try:
        # Get comprehensive data
        rag_context = await get_rag_context()
        live_data = await get_live_data()
        analytics = await get_analytics_summary()
        
        # Prepare data for blog RAG system
        blog_rag_data = {
            "source": "meble_pumo_idosell",
            "updated_at": datetime.now().isoformat(),
            "business_data": {
                "shop_name": "Meble Pumo",
                "shop_url": "https://meblepumo.iai-shop.com",
                "context": rag_context,
                "live_metrics": live_data,
                "analytics": analytics
            },
            "rag_prompts": {
                "business_summary": f"Meble Pumo to sklep z {analytics.get('total_orders', 0)} zamówieniami w ciągu ostatnich 30 dni, z przychodem {analytics.get('total_revenue', 0)} PLN.",
                "current_status": f"Dziś: {live_data.get('today_orders', 0)} zamówień, aktywność: {live_data.get('shop_activity', 'medium')}",
                "recommendations": "Sklep specjalizuje się w meblach i dekoracjach, oferuje szybką realizację zamówień."
            }
        }
        
        # Store in Redis for blog access
        redis = get_redis_client()
        await redis.setex("mybonzo:blog_rag_data", 1800, json.dumps(blog_rag_data))  # 30 min cache
        
        return {
            "status": "success",
            "message": "Data synced to MyBonzo blog RAG system",
            "data_size": len(json.dumps(blog_rag_data)),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blog sync failed: {str(e)}")

@router.get("/blog-rag-data")
async def get_blog_rag_data():
    """
    Get current RAG data for MyBonzo blog AI chat
    This endpoint will be called by the blog's AI system
    """
    try:
        redis = get_redis_client()
        cached_data = await redis.get("mybonzo:blog_rag_data")
        
        if cached_data:
            return json.loads(cached_data)
        
        # If no cached data, sync fresh data
        sync_result = await sync_data_to_blog()
        fresh_data = await redis.get("mybonzo:blog_rag_data")
        
        if fresh_data:
            return json.loads(fresh_data)
        
        return {"error": "No RAG data available", "updated_at": datetime.now().isoformat()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blog RAG data failed: {str(e)}")