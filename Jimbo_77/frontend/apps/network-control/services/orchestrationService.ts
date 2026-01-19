"""
Orchestration Service - Jimbo77 System
Rozszerzenie Network Control o orkiestrację zadań

Używa istniejącej infrastruktury:
- Agent Zero (50100) - Primary AI
- OpenRouter (Qwen 2.5 72B) - Fallback
- Network Control Frontend - UI
"""

from typing import Optional, Dict, List, Any
from datetime import datetime
import httpx

class OrchestrationService:
    """
    Orkiestrator zadań zgodnie z Blueprint:
    Jimbo → Brain → Pinky → Workers → Elwirka
    """
    
    def __init__(self):
        self.agent_zero_url = "http://localhost:50100/api/v1/chat"
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_key = None  # Set via env
        
    async def orchestrate_task(
        self,
        task: str,
        context: Optional[Dict] = None,
        agents: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Main orchestration flow:
        1. Jimbo decomposes task
        2. Brain creates strategy
        3. Pinky validates (can STOP)
        4. Execute on selected agents
        5. Elwirka finalizes
        """
        
        result = {
            "task": task,
            "timestamp": datetime.utcnow().isoformat(),
            "steps": {}
        }
        
        # Step 1: Jimbo - Task Decomposition
        jimbo_result = await self._jimbo_decompose(task, context)
        result["steps"]["jimbo"] = jimbo_result
        
        if not jimbo_result.get("success"):
            result["status"] = "failed_at_jimbo"
            return result
        
        # Step 2: Brain - Strategy Planning
        brain_result = await self._brain_strategy(
            task,
            jimbo_result["decomposition"]
        )
        result["steps"]["brain"] = brain_result
        
        if not brain_result.get("success"):
            result["status"] = "failed_at_brain"
            return result
        
        # Step 3: Pinky - Validation & Edge Cases
        pinky_result = await self._pinky_validate(
            task,
            brain_result["strategy"]
        )
        result["steps"]["pinky"] = pinky_result
        
        # Check if Pinky stopped execution
        if pinky_result.get("stop_execution"):
            result["status"] = "stopped_by_pinky"
            result["reason"] = pinky_result.get("reason")
            return result
        
        # Step 4: Execute on Workers
        selected_agents = agents or brain_result["strategy"].get("agents", [])
        execution_results = []
        
        for agent_id in selected_agents:
            exec_result = await self._execute_on_agent(agent_id, task)
            execution_results.append(exec_result)
        
        result["steps"]["execution"] = execution_results
        
        # Step 5: Elwirka - Finalization
        elwirka_result = await self._elwirka_finalize(
            task,
            brain_result["strategy"],
            execution_results
        )
        result["steps"]["elwirka"] = elwirka_result
        
        result["status"] = "completed"
        result["final_output"] = elwirka_result.get("output")
        
        return result
    
    async def _call_ai(self, prompt: str, system_prompt: str) -> Dict[str, Any]:
        """Call Agent Zero, fallback to OpenRouter"""
        
        # Try Agent Zero first
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    self.agent_zero_url,
                    json={
                        "message": prompt,
                        "system": system_prompt,
                        "context": "orchestration"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "content": data.get("response", data.get("message")),
                        "provider": "agent-zero"
                    }
        
        except Exception as e:
            print(f"Agent Zero failed: {e}, falling back to OpenRouter")
        
        # Fallback to OpenRouter
        if not self.openrouter_key:
            return {
                "success": False,
                "error": "Both Agent Zero and OpenRouter unavailable"
            }
        
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    self.openrouter_url,
                    headers={
                        "Authorization": f"Bearer {self.openrouter_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "qwen/qwen-2.5-72b-instruct",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "content": data["choices"][0]["message"]["content"],
                        "provider": "openrouter"
                    }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"OpenRouter failed: {e}"
            }
    
    async def _jimbo_decompose(self, task: str, context: Optional[Dict]) -> Dict:
        """Jimbo: Master Orchestrator - Decomposes task"""
        
        system_prompt = """You are JIMBO, the master orchestrator.
Your job: Break down tasks into actionable steps.

Rules:
1. Brief (1-3 sentences)
2. Plan (5-12 points)
3. Identify required agents
4. List dependencies

Output JSON:
{
  "brief": "...",
  "plan": ["step1", "step2", ...],
  "agents": ["agent-id1", "agent-id2"],
  "dependencies": [...],
  "estimated_time": "..."
}
"""
        
        prompt = f"""Task: {task}

Context: {context or 'None provided'}

Decompose this task into a structured plan."""
        
        result = await self._call_ai(prompt, system_prompt)
        
        if result.get("success"):
            # Parse JSON from content
            import json
            try:
                decomposition = json.loads(result["content"])
                return {
                    "success": True,
                    "decomposition": decomposition,
                    "provider": result["provider"]
                }
            except:
                # Fallback: treat as text
                return {
                    "success": True,
                    "decomposition": {"raw": result["content"]},
                    "provider": result["provider"]
                }
        
        return result
    
    async def _brain_strategy(self, task: str, decomposition: Dict) -> Dict:
        """Brain: Strategic Orchestrator - Creates execution strategy"""
        
        system_prompt = """You are BRAIN, the strategic orchestrator.
Your job: Create optimal execution strategies.

Output format:
{
  "strategy": {
    "approach": "...",
    "agents": ["id1", "id2"],
    "sequence": ["parallel" | "sequential"],
    "delegations": [
      {"agent": "...", "task": "...", "input": "...", "expected_output": "..."}
    ]
  },
  "risks": ["risk1", "risk2"],
  "estimated_duration": "..."
}
"""
        
        prompt = f"""Task: {task}

Jimbo's Decomposition: {decomposition}

Create an execution strategy."""
        
        result = await self._call_ai(prompt, system_prompt)
        
        if result.get("success"):
            import json
            try:
                strategy = json.loads(result["content"])
                return {
                    "success": True,
                    "strategy": strategy.get("strategy", {}),
                    "risks": strategy.get("risks", []),
                    "provider": result["provider"]
                }
            except:
                return {
                    "success": True,
                    "strategy": {"raw": result["content"]},
                    "provider": result["provider"]
                }
        
        return result
    
    async def _pinky_validate(self, task: str, strategy: Dict) -> Dict:
        """Pinky: Edge-case Orchestrator - Validates plans (can STOP)"""
        
        system_prompt = """You are PINKY, the edge-case critic.
Your job: Find flaws and stop bad plans.

Output format:
{
  "verdict": "APPROVE" | "STOP",
  "risks": ["risk1", "risk2", ...],  // Top 5
  "edge_cases": ["case1", "case2", ...],  // Top 5
  "failure_scenarios": ["scenario1", ...],  // Top 3
  "stop_reason": "..." // If STOP
}

Use "STOP" if:
- Plan will break production
- Security risk > 50
- Missing critical dependencies
- Circular logic detected
"""
        
        prompt = f"""Task: {task}

Brain's Strategy: {strategy}

Validate this plan. Find edge cases. STOP if dangerous."""
        
        result = await self._call_ai(prompt, system_prompt)
        
        if result.get("success"):
            import json
            try:
                validation = json.loads(result["content"])
                
                return {
                    "success": True,
                    "verdict": validation.get("verdict"),
                    "stop_execution": validation.get("verdict") == "STOP",
                    "reason": validation.get("stop_reason"),
                    "risks": validation.get("risks", []),
                    "edge_cases": validation.get("edge_cases", []),
                    "provider": result["provider"]
                }
            except:
                return {
                    "success": True,
                    "stop_execution": False,
                    "provider": result["provider"]
                }
        
        return result
    
    async def _execute_on_agent(self, agent_id: str, task: str) -> Dict:
        """Execute task on specific agent"""
        
        # This will call actual agents (Docker, personal agents, etc.)
        # For now, simulate
        
        return {
            "agent_id": agent_id,
            "status": "completed",
            "output": f"Executed {task} on {agent_id}",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _elwirka_finalize(
        self,
        task: str,
        strategy: Dict,
        execution_results: List[Dict]
    ) -> Dict:
        """Elwirka: Finalizer - Assembles final output"""
        
        system_prompt = """You are ELWIRKA, the finalizer.
Your job: Package results for deployment.

Output format:
{
  "output": {
    "result": "...",
    "deliverables": [...]
  },
  "checklist": ["step1", "step2", ...],
  "risks_and_mitigations": [
    {"risk": "...", "mitigation": "..."}
  ],
  "next_steps": ["action1", "action2"]
}
"""
        
        prompt = f"""Task: {task}

Strategy Used: {strategy}

Execution Results: {execution_results}

Create final output with checklist and next steps."""
        
        result = await self._call_ai(prompt, system_prompt)
        
        if result.get("success"):
            import json
            try:
                final = json.loads(result["content"])
                return {
                    "success": True,
                    "output": final.get("output"),
                    "checklist": final.get("checklist", []),
                    "risks": final.get("risks_and_mitigations", []),
                    "next_steps": final.get("next_steps", []),
                    "provider": result["provider"]
                }
            except:
                return {
                    "success": True,
                    "output": result["content"],
                    "provider": result["provider"]
                }
        
        return result


# Global instance
orchestration_service = OrchestrationService()
