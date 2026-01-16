"""
Expert Groups Registry
Maps 18 existing agents to 3 expert groups for MoE routing.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class ExpertType(str, Enum):
    """Expert group types matching gating_network.py"""

    RESEARCH = "research"  # Group A: Deep research, analysis, QA
    WRITING = "writing"  # Group B: Content creation, SEO, copywriting
    SYSTEM = "system"  # Group C: Code, analytics, verification, e-commerce


@dataclass
class AgentConfig:
    """Configuration for a single agent"""

    agent_id: str
    name: str
    description: str
    api_endpoint: str
    port: int
    capabilities: List[str]
    timeout: int = 30  # seconds
    max_retries: int = 3


@dataclass
class ExpertGroup:
    """Expert group containing multiple agents"""

    group_type: ExpertType
    name: str
    description: str
    agents: List[AgentConfig]

    def get_agent_by_id(self, agent_id: str) -> Optional[AgentConfig]:
        """Get agent by ID"""
        for agent in self.agents:
            if agent.agent_id == agent_id:
                return agent
        return None

    def get_agents_by_capability(self, capability: str) -> List[AgentConfig]:
        """Get all agents with specific capability"""
        return [agent for agent in self.agents if capability in agent.capabilities]


# EXPERT GROUP A: RESEARCH (Deep reasoning, analysis, verification)
EXPERT_GROUP_A = ExpertGroup(
    group_type=ExpertType.RESEARCH,
    name="Research Experts",
    description="Deep research, data analysis, quality assurance, reasoning",
    agents=[
        AgentConfig(
            agent_id="research_agent",
            name="Research Agent",
            description="Deep web research using Perplexity API",
            api_endpoint="http://localhost:6062/research",
            port=6062,
            capabilities=["web_search", "data_gathering", "fact_checking"],
            timeout=60,
        ),
        AgentConfig(
            agent_id="deepseek_agent",
            name="DeepSeek Reasoning Agent",
            description="Advanced reasoning using DeepSeek R1 model",
            api_endpoint="http://localhost:6063/reason",
            port=6063,
            capabilities=["logical_reasoning", "problem_solving", "chain_of_thought"],
            timeout=90,
        ),
        AgentConfig(
            agent_id="qa_agent",
            name="QA Agent",
            description="Quality assurance and testing",
            api_endpoint="http://localhost:6064/qa",
            port=6064,
            capabilities=["quality_check", "validation", "testing"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="data_analyst_agent",
            name="Data Analyst Agent",
            description="Statistical analysis and data insights",
            api_endpoint="http://localhost:6065/analyze",
            port=6065,
            capabilities=["data_analysis", "statistics", "visualization"],
            timeout=60,
        ),
        AgentConfig(
            agent_id="fact_checker_agent",
            name="Fact Checker Agent",
            description="Verify claims and check sources",
            api_endpoint="http://localhost:6066/verify",
            port=6066,
            capabilities=["fact_checking", "source_verification", "credibility"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="citation_agent",
            name="Citation Agent",
            description="Generate proper citations and references",
            api_endpoint="http://localhost:6067/cite",
            port=6067,
            capabilities=["citations", "references", "bibliography"],
            timeout=30,
        ),
    ],
)


# EXPERT GROUP B: WRITING (Content creation, SEO, copywriting)
EXPERT_GROUP_B = ExpertGroup(
    group_type=ExpertType.WRITING,
    name="Writing Experts",
    description="Content creation, SEO optimization, copywriting, translation",
    agents=[
        AgentConfig(
            agent_id="writer_agent",
            name="Content Writer Agent",
            description="High-quality content generation",
            api_endpoint="http://localhost:6070/write",
            port=6070,
            capabilities=["content_writing", "article_generation", "blogging"],
            timeout=60,
        ),
        AgentConfig(
            agent_id="seo_agent",
            name="SEO Optimizer Agent",
            description="SEO optimization and keyword research",
            api_endpoint="http://localhost:6071/optimize",
            port=6071,
            capabilities=["seo", "keywords", "meta_tags", "optimization"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="copywriter_agent",
            name="Copywriter Agent",
            description="Marketing copy and persuasive writing",
            api_endpoint="http://localhost:6072/copywrite",
            port=6072,
            capabilities=["copywriting", "marketing", "persuasion", "ads"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="translator_agent",
            name="Translator Agent",
            description="Multi-language translation",
            api_endpoint="http://localhost:6073/translate",
            port=6073,
            capabilities=["translation", "localization", "multilingual"],
            timeout=30,
        ),
        AgentConfig(
            agent_id="editor_agent",
            name="Editor Agent",
            description="Proofreading and editing",
            api_endpoint="http://localhost:6074/edit",
            port=6074,
            capabilities=["editing", "proofreading", "grammar", "style"],
            timeout=30,
        ),
        AgentConfig(
            agent_id="summary_agent",
            name="Summary Agent",
            description="Content summarization and extraction",
            api_endpoint="http://localhost:6075/summarize",
            port=6075,
            capabilities=["summarization", "extraction", "condensing"],
            timeout=30,
        ),
    ],
)


# EXPERT GROUP C: SYSTEM (Code, analytics, e-commerce, verification)
EXPERT_GROUP_C = ExpertGroup(
    group_type=ExpertType.SYSTEM,
    name="System Experts",
    description="Code generation, analytics, e-commerce, system operations",
    agents=[
        AgentConfig(
            agent_id="code_agent",
            name="Code Generation Agent",
            description="Code generation and refactoring",
            api_endpoint="http://localhost:6080/code",
            port=6080,
            capabilities=["code_generation", "refactoring", "debugging"],
            timeout=60,
        ),
        AgentConfig(
            agent_id="analytics_agent",
            name="Analytics Agent",
            description="System analytics and monitoring",
            api_endpoint="http://localhost:6081/analytics",
            port=6081,
            capabilities=["analytics", "monitoring", "metrics", "dashboards"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="ecommerce_agent",
            name="E-commerce Agent",
            description="Product catalog and order management",
            api_endpoint="http://localhost:6082/ecommerce",
            port=6082,
            capabilities=["products", "orders", "inventory", "pricing"],
            timeout=45,
        ),
        AgentConfig(
            agent_id="verification_agent",
            name="Verification Agent",
            description="System verification and validation",
            api_endpoint="http://localhost:6083/verify",
            port=6083,
            capabilities=["verification", "validation", "compliance"],
            timeout=30,
        ),
        AgentConfig(
            agent_id="deployment_coordinator",
            name="Deployment Coordinator",
            description="GitHub Actions monitoring and auto-deploy",
            api_endpoint="http://localhost:6001/deploy",
            port=6001,
            capabilities=["deployment", "ci_cd", "github_actions"],
            timeout=60,
        ),
        AgentConfig(
            agent_id="cost_optimizer",
            name="Cost Optimizer",
            description="Cloudflare and OpenRouter cost tracking",
            api_endpoint="http://localhost:6002/costs",
            port=6002,
            capabilities=["cost_tracking", "budget_alerts", "optimization"],
            timeout=30,
        ),
    ],
)


class ExpertGroupsRegistry:
    """
    Registry for all expert groups.
    Provides lookup and selection capabilities.
    """

    def __init__(self):
        """Initialize expert groups registry"""
        self.groups = {
            ExpertType.RESEARCH: EXPERT_GROUP_A,
            ExpertType.WRITING: EXPERT_GROUP_B,
            ExpertType.SYSTEM: EXPERT_GROUP_C,
        }

    def get_group(self, group_type: ExpertType) -> ExpertGroup:
        """Get expert group by type"""
        return self.groups[group_type]

    def get_all_agents(self) -> List[AgentConfig]:
        """Get all agents across all groups"""
        all_agents = []
        for group in self.groups.values():
            all_agents.extend(group.agents)
        return all_agents

    def get_agent_by_id(self, agent_id: str) -> Optional[AgentConfig]:
        """Find agent by ID across all groups"""
        for group in self.groups.values():
            agent = group.get_agent_by_id(agent_id)
            if agent:
                return agent
        return None

    def get_agents_by_capability(self, capability: str) -> List[AgentConfig]:
        """Find all agents with specific capability"""
        matching_agents = []
        for group in self.groups.values():
            matching_agents.extend(group.get_agents_by_capability(capability))
        return matching_agents

    def get_group_stats(self) -> Dict[ExpertType, Dict[str, Any]]:
        """Get statistics for all expert groups"""
        stats = {}
        for group_type, group in self.groups.items():
            stats[group_type] = {
                "name": group.name,
                "agent_count": len(group.agents),
                "total_capabilities": sum(len(a.capabilities) for a in group.agents),
                "agents": [
                    {
                        "id": agent.agent_id,
                        "name": agent.name,
                        "port": agent.port,
                        "capabilities": agent.capabilities,
                    }
                    for agent in group.agents
                ],
            }
        return stats


# Example usage
if __name__ == "__main__":
    registry = ExpertGroupsRegistry()

    # Get all agents
    all_agents = registry.get_all_agents()
    print(f"\n=== Total Agents: {len(all_agents)} ===")

    # Get group stats
    stats = registry.get_group_stats()
    print(f"\n=== Expert Groups Statistics ===")
    for group_type, stat in stats.items():
        print(f"\n{group_type.value.upper()} - {stat['name']}")
        print(f"  Agents: {stat['agent_count']}")
        print(f"  Total capabilities: {stat['total_capabilities']}")
        for agent in stat["agents"]:
            print(f"    - {agent['name']} (:{agent['port']})")
            print(f"      Capabilities: {', '.join(agent['capabilities'])}")

    # Search by capability
    print(f"\n=== Agents with 'fact_checking' capability ===")
    fact_checkers = registry.get_agents_by_capability("fact_checking")
    for agent in fact_checkers:
        print(f"  - {agent.name} ({agent.agent_id})")

    # Get specific agent
    print(f"\n=== Get Specific Agent ===")
    research_agent = registry.get_agent_by_id("research_agent")
    if research_agent:
        print(f"Found: {research_agent.name}")
        print(f"Endpoint: {research_agent.api_endpoint}")
        print(f"Capabilities: {', '.join(research_agent.capabilities)}")
