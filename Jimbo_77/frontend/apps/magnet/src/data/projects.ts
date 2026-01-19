export interface ProjectMeta {
    id: string;
    name: string;
    description: string;
    domain: string;
    role: "public" | "private" | "hybrid";
    stack: string[];
    docs?: string;
}

export interface ProjectMeta {
    id: string;
    name: string;
    description: string;
    domain: string;
    role: "public" | "private" | "hybrid";
    stack: string[];
    docs?: string;
    // New fields for AI Magnet
    type?: string;
    tech_details?: string;
    repo?: string;
    api_docs?: string;
    features?: string[];
    example_query?: string;
}

export const PROJECTS: ProjectMeta[] = [
    {
        id: "pumo-furniture",
        name: "PUMO RAG System",
        description: "Intelligent furniture catalog search using hybrid RAG (vector + keyword). Combines Cloudflare Vectorize for semantic similarity with BM25 keyword matching.",
        domain: "meblepumo.iai-shop.com",
        role: "public",
        stack: ["Cloudflare Workers", "Vectorize", "DeepSeek R1", "IdoSell API"],
        docs: "/projects/pumo-furniture",
        type: "E-commerce AI Assistant",
        repo: "Private",
        api_docs: "/projects/pumo-furniture/api",
        features: [
            "Semantic product search accross 5000+ items",
            "Natural language query understanding",
            "Product recommendations based on user intent",
            "Real-time inventory sync"
        ],
        example_query: "nowoczesne krzesła do jadalni w stylu skandynawskim"
    },
    {
        id: "bonzo-ai-blog",
        name: "My Bonzo AI Blog",
        description: "Blog about AI development, tools, experiments and case studies. Features optimized image delivery and markdown-based content.",
        domain: "mybonzoaiblog.com",
        role: "public",
        stack: ["Astro", "Cloudflare Pages", "R2 Storage", "Cloudflare Images"],
        docs: "/projects/bonzo-ai-blog",
        type: "AI-focused Technical Blog",
        repo: "https://github.com/stolarnia-ams/my-bonzo-ai-blog",
        api_docs: "/projects/bonzo-ai-blog/feed",
        features: [
            "AI agent development case studies",
            "RAG system architecture deep-divs",
            "MCP server development guides",
            "Multi-agent orchestration patterns"
        ]
    },
    {
        id: "zen-browser",
        name: "Zen Browser OS",
        description: "Browser homepage with local AI features, privacy-first design, and customizable widgets. No tracking, no external dependencies.",
        domain: "zen-bro-wser.org",
        role: "public",
        stack: ["Astro", "Cloudflare Workers", "Local Storage"],
        docs: "/projects/zen-browser",
        type: "Privacy-focused Browser Interface",
        repo: "https://github.com/stolarnia-ams/zen-bro-wser.org",
        features: [
            "Zero external tracking",
            "Local-first data storage",
            "Optional local LLM integration",
            "Bookmark management"
        ]
    },
    {
        id: "agent-orchestrator",
        name: "Agent Orchestration",
        description: "Coordinates multiple AI agents for complex task execution with priority-based scheduling, parallel execution, and state management.",
        domain: "orchestrator.jimbo77.com",
        role: "private",
        stack: ["Cloudflare Workers", "KV Storage", "DeepSeek R1", "OpenRouter"],
        docs: "/projects/agent-orchestrator",
        type: "Multi-agent Coordination System",
        features: [
            "18 specialized AI agents",
            "Priority-based task scheduling",
            "Parallel execution",
            "State management with KV"
        ],
        example_query: "{ \"task\": \"Deploy PUMO RAG\", \"priority\": 1 }"
    },
    {
        id: "workspace-navigator",
        name: "MCP: Workspace Navigator",
        description: "Model Context Protocol server enabling AI assistants to navigate the multi-repo workspace structure.",
        domain: "localhost:3889",
        role: "hybrid",
        stack: ["TypeScript", "Bun", "MCP SDK"],
        docs: "/projects/workspace-navigator",
        type: "Dev Tool / MCP Server",
        repo: "https://github.com/stolarnia-ams/mcp-servers",
        features: [
            "Navigate 7 Git submodules",
            "File search and retrieval",
            "Context-aware codebase exploration"
        ]
    },
    {
        id: "hub",
        name: "JIMBO77 HUB",
        description: "Unified Operations Center. Central command for all connected agents and services.",
        domain: "jimbo77.com",
        role: "private",
        stack: ["React", "Cloudflare Pages", "D1", "Python Agents"],
        docs: "/docs/hub",
        type: "Internal Operations Dashboard"
    }
];
