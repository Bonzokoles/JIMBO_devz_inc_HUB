"""
AI Buying Guides API - WHITECAT MOA Integration
Endpoints dla generowania i zarządzania poradnikami zakupowymi z AI
Integracja z LUCJAN MOA v3.0 Worker
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
import json
from pathlib import Path

router = APIRouter(prefix="/guides", tags=["guides"])

# LUCJAN MOA Worker URL
MOA_WORKER_URL = "https://lucjan-moa.stolarnia-ams.workers.dev"
STORAGE_DIR = Path("u:/JIMBO_UNIFIELD_WEBSIDES_hub/JIMBO77_DEVZ_inc_HUB/Jimbo_77/api/storage/guides")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Schemas
class GenerateGuideRequest(BaseModel):
    product_name: str = Field(..., description="Nazwa produktu")
    category: str = Field(..., description="Kategoria produktu")
    additional_context: Optional[str] = Field(None, description="Dodatkowy kontekst")

class BuyingGuide(BaseModel):
    id: str
    product_name: str
    category: str
    guide_content: str
    key_features: List[str]
    buying_tips: List[str]
    recommended_products: List[str]
    created_at: str
    confidence_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/generate", response_model=BuyingGuide)
async def generate_buying_guide(request: GenerateGuideRequest):
    """
    Generuj poradnik zakupowy używając LUCJAN MOA v3.0
    
    Wykorzystuje Multi-Agent Orchestration:
    - Agent 1 (GPT-4): Analiza produktu i trendy rynkowe
    - Agent 2 (DeepSeek): Szczegóły techniczne i porównania
    - Synthesis (Gemini 2.0): Synteza w kompletny poradnik
    """
    try:
        # Prepare prompt for MOA
        prompt = f"""Stwórz kompletny poradnik zakupowy dla produktu:

Produkt: {request.product_name}
Kategoria: {request.category}
{f'Dodatkowy kontekst: {request.additional_context}' if request.additional_context else ''}

Poradnik powinien zawierać:
1. **Kluczowe cechy** - najważniejsze parametry tego typu produktu
2. **Wskazówki zakupowe** - na co zwrócić uwagę przy wyborze
3. **Polecane produkty** - konkretne modele/marki warte uwagi
4. **Przewodnik** - kompletny opis i analiza

Format odpowiedzi (JSON):
{{
  "guide_content": "Kompletny przewodnik...",
  "key_features": ["Cecha 1", "Cecha 2", ...],
  "buying_tips": ["Wskazówka 1", "Wskazówka 2", ...],
  "recommended_products": ["Produkt 1", "Produkt 2", ...],
  "confidence_score": 0.95
}}

Odpowiedz TYLKO w formacie JSON, bez dodatkowego tekstu."""

        # Call MOA Worker
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{MOA_WORKER_URL}/api/chat",
                json={
                    "message": prompt,
                    "model": "gemini-2.0-flash-exp",  # Synthesis model
                    "enableMOA": True,
                    "maxTokens": 4000
                }
            )
            response.raise_for_status()
            moa_result = response.json()
        
        # Parse MOA response
        try:
            # MOA returns {response: "...", model: "...", timestamp: ...}
            moa_content = moa_result.get("response", "")
            
            # Extract JSON from response (może być otoczone ```json...)
            if "```json" in moa_content:
                json_start = moa_content.find("```json") + 7
                json_end = moa_content.find("```", json_start)
                json_str = moa_content[json_start:json_end].strip()
            elif "{" in moa_content:
                json_start = moa_content.find("{")
                json_end = moa_content.rfind("}") + 1
                json_str = moa_content[json_start:json_end]
            else:
                raise ValueError("No JSON found in MOA response")
            
            guide_data = json.loads(json_str)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback - create structured guide from raw text
            guide_data = {
                "guide_content": moa_result.get("response", "Błąd generowania"),
                "key_features": ["AI-generated content"],
                "buying_tips": ["Sprawdź opinie klientów", "Porównaj ceny"],
                "recommended_products": [],
                "confidence_score": 0.5
            }
        
        # Create guide object
        guide_id = f"guide_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{request.product_name[:20].replace(' ', '_')}"
        
        guide = BuyingGuide(
            id=guide_id,
            product_name=request.product_name,
            category=request.category,
            guide_content=guide_data.get("guide_content", ""),
            key_features=guide_data.get("key_features", []),
            buying_tips=guide_data.get("buying_tips", []),
            recommended_products=guide_data.get("recommended_products", []),
            created_at=datetime.utcnow().isoformat(),
            confidence_score=guide_data.get("confidence_score", 0.8),
            metadata={
                "moa_model": moa_result.get("model", "unknown"),
                "processing_time": moa_result.get("processingTime", 0),
                "additional_context": request.additional_context
            }
        )
        
        # Save to storage
        guide_file = STORAGE_DIR / f"{guide_id}.json"
        with open(guide_file, 'w', encoding='utf-8') as f:
            json.dump(guide.model_dump(), f, ensure_ascii=False, indent=2)
        
        return guide
        
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=503,
            detail=f"MOA Worker error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate guide: {str(e)}"
        )

@router.get("/", response_model=List[BuyingGuide])
async def list_buying_guides(
    category: Optional[str] = None,
    limit: int = 50
):
    """
    Lista wszystkich wygenerowanych poradników
    
    Query params:
    - category: Filtruj po kategorii
    - limit: Max liczba wyników (default: 50)
    """
    try:
        guides = []
        
        # Read all guide files
        guide_files = sorted(STORAGE_DIR.glob("guide_*.json"), reverse=True)
        
        for guide_file in guide_files[:limit]:
            with open(guide_file, 'r', encoding='utf-8') as f:
                guide_data = json.load(f)
                
                # Apply category filter
                if category and guide_data.get('category') != category:
                    continue
                
                guides.append(BuyingGuide(**guide_data))
        
        return guides
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list guides: {str(e)}"
        )

@router.get("/{guide_id}", response_model=BuyingGuide)
async def get_buying_guide(guide_id: str):
    """
    Pobierz konkretny poradnik po ID
    """
    try:
        guide_file = STORAGE_DIR / f"{guide_id}.json"
        
        if not guide_file.exists():
            raise HTTPException(status_code=404, detail="Guide not found")
        
        with open(guide_file, 'r', encoding='utf-8') as f:
            guide_data = json.load(f)
        
        return BuyingGuide(**guide_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get guide: {str(e)}"
        )

@router.delete("/{guide_id}")
async def delete_buying_guide(guide_id: str):
    """
    Usuń poradnik
    """
    try:
        guide_file = STORAGE_DIR / f"{guide_id}.json"
        
        if not guide_file.exists():
            raise HTTPException(status_code=404, detail="Guide not found")
        
        guide_file.unlink()
        
        return {"success": True, "message": f"Guide {guide_id} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete guide: {str(e)}"
        )

@router.get("/categories/list")
async def list_categories():
    """
    Lista wszystkich kategorii z poradnikami
    """
    try:
        categories = set()
        
        guide_files = STORAGE_DIR.glob("guide_*.json")
        for guide_file in guide_files:
            with open(guide_file, 'r', encoding='utf-8') as f:
                guide_data = json.load(f)
                if 'category' in guide_data:
                    categories.add(guide_data['category'])
        
        return {"categories": sorted(list(categories))}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list categories: {str(e)}"
        )
