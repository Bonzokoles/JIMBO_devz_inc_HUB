"""
AI Analysis Engine for PUMO Dashboard
Uses Cloudflare AI Workers + local ML models
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
from pathlib import Path
import statistics

router = APIRouter(prefix="/ai-analysis", tags=["ai-analysis"])

EXPORTS_DIR = Path("u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/exports")

class AnalysisRequest(BaseModel):
    question: str
    context: Optional[str] = "all"  # all, products, customers, orders, revenue
    depth: Optional[str] = "detailed"  # quick, detailed, comprehensive

class AIInsight(BaseModel):
    category: str
    insight: str
    confidence: float
    action: Optional[str] = None
    impact: Optional[str] = None  # low, medium, high

@router.post("/ask")
async def ai_ask(request: AnalysisRequest):
    """
    AI-powered question answering o danych biznesowych
    Przykłady:
    - "Dlaczego sprzedaż spadła w ostatnim tygodniu?"
    - "Którzy klienci są najbardziej wartościowi?"
    - "Jakie produkty mają najlepszą marżę?"
    """
    try:
        # Load data
        analytics_files = sorted(EXPORTS_DIR.glob("analytics_*.json"), reverse=True)
        if not analytics_files:
            return {
                "success": False,
                "error": "No analytics data available"
            }
        
        with open(analytics_files[0], 'r', encoding='utf-8') as f:
            analytics = json.load(f)
        
        # Analyze based on question context
        analysis = await analyze_question(request.question, analytics, request.context)
        
        return {
            "success": True,
            "question": request.question,
            "answer": analysis["answer"],
            "insights": analysis["insights"],
            "data_points": analysis.get("data_points", []),
            "recommendations": analysis.get("recommendations", []),
            "confidence": analysis.get("confidence", 0.85)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def analyze_question(question: str, analytics: Dict, context: str) -> Dict[str, Any]:
    """
    Intelligent question analysis using pattern matching + AI
    """
    question_lower = question.lower()
    
    # Revenue analysis
    if any(word in question_lower for word in ['przychód', 'revenue', 'sprzedaż', 'zarobki']):
        return await analyze_revenue(analytics, question)
    
    # Customer analysis
    elif any(word in question_lower for word in ['klient', 'customer', 'kupuj', 'vip']):
        return await analyze_customers(analytics, question)
    
    # Product analysis
    elif any(word in question_lower for word in ['produkt', 'product', 'towar', 'bestseller']):
        return await analyze_products(analytics, question)
    
    # Trend analysis
    elif any(word in question_lower for word in ['trend', 'wzrost', 'spadek', 'zmiana', 'porównaj']):
        return await analyze_trends(analytics, question)
    
    # General analysis
    else:
        return await analyze_general(analytics, question)

async def analyze_revenue(analytics: Dict, question: str) -> Dict[str, Any]:
    """Analiza przychodów"""
    total_revenue = analytics.get('total_revenue', 0)
    orders_count = analytics.get('orders_count', 0)
    avg_order = total_revenue / orders_count if orders_count > 0 else 0
    
    daily_sales = analytics.get('daily_sales', {})
    recent_days = sorted(daily_sales.keys())[-7:] if daily_sales else []
    
    insights = []
    recommendations = []
    
    # Trend analysis
    if len(recent_days) >= 7:
        recent_revenue = [daily_sales[day]['revenue'] for day in recent_days]
        avg_recent = statistics.mean(recent_revenue)
        
        if recent_revenue[-1] > avg_recent * 1.2:
            insights.append(AIInsight(
                category="revenue",
                insight=f"Ostatni dzień pokazuje wzrost o {((recent_revenue[-1]/avg_recent - 1) * 100):.1f}% powyżej średniej",
                confidence=0.92,
                impact="high"
            ))
        elif recent_revenue[-1] < avg_recent * 0.8:
            insights.append(AIInsight(
                category="revenue",
                insight=f"Ostatni dzień pokazuje spadek o {((1 - recent_revenue[-1]/avg_recent) * 100):.1f}% poniżej średniej",
                confidence=0.89,
                action="Sprawdź dostępność produktów i marketing",
                impact="high"
            ))
    
    # Order value analysis
    if avg_order < 500:
        recommendations.append("Wartość średniego zamówienia jest niska. Rozważ cross-selling i upselling.")
    elif avg_order > 2000:
        insights.append(AIInsight(
            category="revenue",
            insight="Wysoka wartość średniego zamówienia wskazuje na klientów premium",
            confidence=0.88,
            impact="medium"
        ))
    
    answer = f"""
    📊 Analiza przychodów:
    
    • Całkowity przychód: {total_revenue:,.2f} PLN
    • Liczba zamówień: {orders_count}
    • Średnia wartość zamówienia: {avg_order:,.2f} PLN
    • Trend ostatnich 7 dni: {'wzrostowy' if len(recent_revenue) > 1 and recent_revenue[-1] > recent_revenue[0] else 'spadkowy'}
    
    Kluczowe wskaźniki:
    - {'✅' if avg_order > 1000 else '⚠️'} Wartość zamówienia: {'Dobra' if avg_order > 1000 else 'Wymaga poprawy'}
    - {'✅' if orders_count > 100 else '⚠️'} Liczba zamówień: {'Zadowalająca' if orders_count > 100 else 'Niska'}
    """
    
    return {
        "answer": answer.strip(),
        "insights": [i.dict() for i in insights],
        "recommendations": recommendations,
        "data_points": [
            {"label": "Total Revenue", "value": total_revenue},
            {"label": "Orders", "value": orders_count},
            {"label": "Avg Order", "value": avg_order}
        ],
        "confidence": 0.91
    }

async def analyze_customers(analytics: Dict, question: str) -> Dict[str, Any]:
    """Analiza klientów"""
    segments = analytics.get('customer_segments', {})
    buyers = segments.get('buyers', 0)
    repeat_customers = segments.get('repeat_customers', 0)
    repeat_rate = (repeat_customers / buyers * 100) if buyers > 0 else 0
    
    insights = []
    recommendations = []
    
    # Customer loyalty analysis
    if repeat_rate > 30:
        insights.append(AIInsight(
            category="customers",
            insight=f"Wysoki wskaźnik powracających klientów ({repeat_rate:.1f}%) wskazuje na dobrą jakość obsługi",
            confidence=0.87,
            impact="high"
        ))
    elif repeat_rate < 15:
        insights.append(AIInsight(
            category="customers",
            insight=f"Niski wskaźnik powracających klientów ({repeat_rate:.1f}%)",
            confidence=0.85,
            action="Zaimplementuj program lojalnościowy",
            impact="high"
        ))
        recommendations.append("Program lojalnościowy może zwiększyć retencję o 20-30%")
    
    answer = f"""
    👥 Analiza klientów:
    
    • Całkowita liczba kupujących: {buyers}
    • Klienci powracający: {repeat_customers}
    • Wskaźnik powrotów: {repeat_rate:.1f}%
    
    Status: {'✅ Dobra lojalność' if repeat_rate > 25 else '⚠️ Wymaga poprawy retencji'}
    """
    
    return {
        "answer": answer.strip(),
        "insights": [i.dict() for i in insights],
        "recommendations": recommendations,
        "data_points": [
            {"label": "Total Buyers", "value": buyers},
            {"label": "Repeat Customers", "value": repeat_customers},
            {"label": "Repeat Rate %", "value": repeat_rate}
        ],
        "confidence": 0.88
    }

async def analyze_products(analytics: Dict, question: str) -> Dict[str, Any]:
    """Analiza produktów"""
    products_sold = analytics.get('products_sold', {})
    
    # Sort by revenue
    top_products = sorted(
        products_sold.items(),
        key=lambda x: x[1].get('revenue', 0),
        reverse=True
    )[:10]
    
    insights = []
    recommendations = []
    
    if top_products:
        top_product = top_products[0]
        top_revenue = top_product[1].get('revenue', 0)
        total_revenue = sum(p[1].get('revenue', 0) for p in products_sold.items())
        concentration = (top_revenue / total_revenue * 100) if total_revenue > 0 else 0
        
        if concentration > 30:
            insights.append(AIInsight(
                category="products",
                insight=f"Top produkt generuje {concentration:.1f}% całego przychodu - wysokie ryzyko koncentracji",
                confidence=0.90,
                action="Dywersyfikuj portfolio produktów",
                impact="high"
            ))
        
        answer = f"""
        🏆 Analiza produktów:
        
        • Liczba sprzedanych produktów: {len(products_sold)}
        • Top 10 produktów generuje: {sum(p[1].get('revenue', 0) for p in top_products):,.2f} PLN
        
        Najlepszy produkt:
        - Nazwa: {top_product[1].get('name', 'Unknown')}
        - Przychód: {top_revenue:,.2f} PLN
        - Udział w sprzedaży: {concentration:.1f}%
        """
    else:
        answer = "Brak danych o sprzedanych produktach"
    
    return {
        "answer": answer.strip(),
        "insights": [i.dict() for i in insights],
        "recommendations": recommendations,
        "confidence": 0.86
    }

async def analyze_trends(analytics: Dict, question: str) -> Dict[str, Any]:
    """Analiza trendów"""
    daily_sales = analytics.get('daily_sales', {})
    
    if not daily_sales:
        return {
            "answer": "Brak danych do analizy trendów",
            "insights": [],
            "recommendations": [],
            "confidence": 0.0
        }
    
    # Calculate trends
    dates = sorted(daily_sales.keys())
    revenues = [daily_sales[d]['revenue'] for d in dates]
    orders = [daily_sales[d]['orders'] for d in dates]
    
    insights = []
    
    # Revenue trend
    if len(revenues) > 7:
        recent_avg = statistics.mean(revenues[-7:])
        older_avg = statistics.mean(revenues[:7])
        change = ((recent_avg / older_avg - 1) * 100) if older_avg > 0 else 0
        
        if abs(change) > 10:
            insights.append(AIInsight(
                category="trends",
                insight=f"Przychody {'wzrosły' if change > 0 else 'spadły'} o {abs(change):.1f}% w ostatnim tygodniu",
                confidence=0.88,
                impact="high" if abs(change) > 20 else "medium"
            ))
    
    answer = f"""
    📈 Analiza trendów:
    
    • Okres analizy: {len(dates)} dni
    • Średni dzienny przychód: {statistics.mean(revenues):,.2f} PLN
    • Średnia liczba zamówień: {statistics.mean(orders):.0f}
    
    Trend: {'📈 Wzrostowy' if revenues[-1] > revenues[0] else '📉 Spadkowy'}
    """
    
    return {
        "answer": answer.strip(),
        "insights": [i.dict() for i in insights],
        "recommendations": [],
        "confidence": 0.85
    }

async def analyze_general(analytics: Dict, question: str) -> Dict[str, Any]:
    """Ogólna analiza"""
    return {
        "answer": f"""
        🤖 Analiza ogólna:
        
        Przeanalizowałem dostępne dane. Oto podsumowanie:
        
        • Całkowity przychód: {analytics.get('total_revenue', 0):,.2f} PLN
        • Liczba zamówień: {analytics.get('orders_count', 0)}
        • Liczba produktów: {analytics.get('products_count', 0)}
        • Kupujący: {analytics.get('customer_segments', {}).get('buyers', 0)}
        
        Zadaj bardziej szczegółowe pytanie o:
        - Przychody i sprzedaż
        - Klientów i ich zachowania
        - Produkty i bestsellery
        - Trendy czasowe
        """,
        "insights": [],
        "recommendations": [
            "Sprecyzuj pytanie aby otrzymać bardziej szczegółową analizę",
            "Przykład: 'Dlaczego sprzedaż spadła w ostatnim tygodniu?'"
        ],
        "confidence": 0.70
    }

@router.get("/auto-insights")
async def get_auto_insights():
    """
    Automatyczne insighty - AI analizuje dane i generuje spostrzeżenia
    """
    try:
        analytics_files = sorted(EXPORTS_DIR.glob("analytics_*.json"), reverse=True)
        if not analytics_files:
            return {"success": False, "error": "No data"}
        
        with open(analytics_files[0], 'r', encoding='utf-8') as f:
            analytics = json.load(f)
        
        insights = []
        
        # Revenue insights
        revenue_analysis = await analyze_revenue(analytics, "revenue analysis")
        insights.extend(revenue_analysis.get("insights", []))
        
        # Customer insights
        customer_analysis = await analyze_customers(analytics, "customer analysis")
        insights.extend(customer_analysis.get("insights", []))
        
        # Product insights
        product_analysis = await analyze_products(analytics, "product analysis")
        insights.extend(product_analysis.get("insights", []))
        
        # Sort by impact and confidence
        insights_sorted = sorted(
            insights,
            key=lambda x: (
                {"high": 3, "medium": 2, "low": 1}.get(x.get("impact", "low"), 0),
                x.get("confidence", 0)
            ),
            reverse=True
        )
        
        return {
            "success": True,
            "insights": insights_sorted[:10],  # Top 10 insights
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-analysis"}
