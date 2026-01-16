# PHASE 2 - MoE-RAG Implementation TODO

**Status:** 65% Complete ✅  
**Data:** 16 stycznia 2026

---

## ✅ ZROBIONE (6/9 plików core):

### **1. State Machine & Data Structures**

- ✅ `app/moe_rag/graph_state.py` (179 linii)
  - GraphState (TypedDict)
  - RoutingDecision enum (FAST/EXPERT/HYBRID)
  - Working imports confirmed

### **2. Gating Network (Routing Logic)**

- ✅ `app/moe_rag/gating_network.py` (280 linii)
  - GatingNetwork class
  - QuerySignals dataclass
  - Heuristic routing (fast/expert/hybrid)

### **3. Embeddings Layer**

- ✅ `app/moe_rag/embeddings.py` (573 linie)
  - EmbeddingModel singleton
  - sentence-transformers integration
  - 539MB model loaded and working

### **4. Indices Registry (3 retrieval indices)**

- ✅ `app/moe_rag/indices_registry.py` (369 linii)
  - IndicesRegistry class
  - FAQ / Technical / Domain indices
  - RetrievalResult dataclass

### **5. Expert Groups (18 agents → 3 groups)**

- ✅ `app/agents/expert_groups.py` (339 linii)
  - ExpertGroup dataclass
  - EXPERT_GROUP_A, B, C
  - 18 agents mapped (research, writing, system)
  - ⚠️ **Missing:** `get_expert_groups()` function (tylko klasy)

### **6. API Routes**

- ✅ `app/routes/moe_rag.py` (420 linii)
  - `/api/moe-rag/health` ✅
  - `/api/moe-rag/` (POST) ✅
  - `/api/moe-rag/debug` ✅
  - Integrated with main.py ✅

---

## ❌ BRAKUJE (3/9 - Critical):

### **1. LangGraph DAG Definition** 🔴 **KRYTYCZNE**

**File:** `app/moe_rag/graph_definition.py`

**Co powinno zawierać:**

```python
from langgraph.graph import StateGraph, END

def route_node(state: GraphState) -> GraphState:
    """Router: decides FAST/EXPERT/HYBRID path"""
    pass

def retrieve_node(state: GraphState) -> GraphState:
    """Retrieval: query indices based on routing"""
    pass

def dispatch_node(state: GraphState) -> GraphState:
    """Dispatch: parallel agent execution"""
    pass

def synthesis_node(state: GraphState) -> GraphState:
    """Synthesis: combine agent responses"""
    pass

async def run_moe_rag(query: str, user_id: str, session_id: str) -> GraphState:
    """Main entry point - runs the DAG"""
    graph = StateGraph(GraphState)
    graph.add_node("route", route_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("dispatch", dispatch_node)
    graph.add_node("synthesis", synthesis_node)

    # Edges: route → retrieve → dispatch → synthesis → END
    graph.add_edge("route", "retrieve")
    graph.add_edge("retrieve", "dispatch")
    graph.add_edge("dispatch", "synthesis")
    graph.add_edge("synthesis", END)

    compiled = graph.compile()
    return await compiled.ainvoke({"user_input": query})
```

**Priorytety:**

- [ ] Create 4 node functions (route, retrieve, dispatch, synthesis)
- [ ] Define StateGraph with edges
- [ ] Implement `run_moe_rag()` async function
- [ ] Connect to `app/routes/moe_rag.py` endpoint

---

### **2. Package Init File**

**File:** `app/moe_rag/__init__.py`

**Co powinno zawierać:**

```python
"""MoE-RAG module exports"""
from .graph_state import GraphState, RoutingDecision
from .graph_definition import run_moe_rag
from .gating_network import GatingNetwork, QuerySignals
from .embeddings import EmbeddingModel
from .indices_registry import IndicesRegistry

__all__ = [
    "GraphState",
    "RoutingDecision",
    "run_moe_rag",
    "GatingNetwork",
    "QuerySignals",
    "EmbeddingModel",
    "IndicesRegistry",
]
```

---

### **3. Unit Tests**

**File:** `tests/moe_rag/test_graph_state.py`

**Co powinno zawierać:**

```python
import pytest
from app.moe_rag.graph_state import GraphState, RoutingDecision

def test_graphstate_initialization():
    state = GraphState(user_input="Test query")
    assert state["user_input"] == "Test query"
    assert state.get("routing_decision") is None

def test_routing_decision_enum():
    assert RoutingDecision.FAST_PATH == "fast"
    assert RoutingDecision.EXPERT_PATH == "expert"
```

---

## ⚙️ KONFIGURACJA (Wymagane):

### **Dependencies to install:**

```bash
pip install langgraph langchain langchain-openai sentence-transformers
```

**Missing packages:**

- `langgraph` - core DAG framework
- `langchain` - LLM orchestration
- `langchain-openai` - OpenAI integration
- (już masz: `sentence-transformers`, `fastapi`, `redis`)

### **Environment Variables (.env.local):**

```env
# API Keys (currently missing)
OPENAI_API_KEY=sk-proj-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=AIza...

# MoE Config
MOE_CACHE_TTL=3600
MOE_AGENT_TIMEOUT=15
MOE_MAX_PARALLEL_AGENTS=3
```

---

## 🔧 FIXES NEEDED:

### **1. expert_groups.py - Missing function**

**Location:** `app/agents/expert_groups.py` line ~340

**Add this function:**

```python
def get_expert_groups() -> Dict[ExpertType, ExpertGroup]:
    """
    Get all expert groups mapped by type

    Returns:
        Dict mapping ExpertType to ExpertGroup
    """
    return {
        ExpertType.RESEARCH: EXPERT_GROUP_A,
        ExpertType.WRITING: EXPERT_GROUP_B,
        ExpertType.SYSTEM: EXPERT_GROUP_C,
    }
```

**Current error:**

```
❌ expert_groups.py - cannot import name 'get_expert_groups'
```

---

## 📊 IMPLEMENTATION PRIORITY:

**Phase 2A - Critical Path (1-2 dni):**

1. 🔴 Fix `get_expert_groups()` function (5 min)
2. 🔴 Create `graph_definition.py` with 4 nodes (2-3 h)
3. 🟡 Create `__init__.py` exports (5 min)
4. 🟡 Install missing dependencies (10 min)

**Phase 2B - Testing & Integration (1 dzień):** 5. 🟢 Write unit tests (1 h) 6. 🟢 Integration test with real API endpoint (1 h) 7. 🟢 Connect to dashboard jimbo77.com (Phase 3)

---

## 🎯 NEXT STEPS:

**Immediate (Today):**

```bash
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api

# 1. Fix expert_groups
# Add get_expert_groups() function at end of file

# 2. Install dependencies
pip install langgraph langchain langchain-openai

# 3. Create graph_definition.py
# Copy template from PHASE_2.md DAY 2-3
```

**Tomorrow:**

- Implement 4 node functions (route, retrieve, dispatch, synthesis)
- Test end-to-end `/api/moe-rag` flow
- Connect to PHASE_3 dashboard integration

---

## 📁 FILE STRUCTURE (Current):

```
Jimbo_77/api/app/
├── moe_rag/
│   ✅ graph_state.py        (179 lines)
│   ✅ gating_network.py     (280 lines)
│   ✅ embeddings.py         (573 lines)
│   ✅ indices_registry.py   (369 lines)
│   ❌ graph_definition.py   (MISSING)
│   ❌ __init__.py           (MISSING)
├── agents/
│   ✅ expert_groups.py      (339 lines - needs fix)
├── routes/
│   ✅ moe_rag.py            (420 lines)
│   ✅ agents.py
tests/
├── moe_rag/
│   ❌ test_graph_state.py   (MISSING)
│   ✅ graph_integration_test.py (exists)
```

---

**TOTAL REMAINING WORK:** ~4-6 godzin implementacji + 2h testowania
