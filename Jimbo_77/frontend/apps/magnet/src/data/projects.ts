export interface ProjectMeta {
    id: string;
    name: string;
    description: string;
    domain: string;
    role: "public" | "private" | "hybrid";
    stack: string[];
    docs?: string;
}

export const PROJECTS: ProjectMeta[] = [
    {
        id: "hub",
        name: "JIMBO77 HUB",
        description: "Unified Operations Center. Central command for all connected agents and services.",
        domain: "jimbo77.com",
        role: "private",
        stack: ["React", "Cloudflare Pages", "D1", "Python Agents"],
        docs: "/docs/hub"
    },
    {
        id: "magnet",
        name: "JIMBO77 MAGNET",
        description: "Public AI Index & Documentation. Semantic entry point for crawlers and LLMs.",
        domain: "jimbo77.org",
        role: "public",
        stack: ["React", "Cloudflare Pages", "Schema.org", "JSON-LD"],
        docs: "/docs/magnet"
    },
    {
        id: "blog",
        name: "My Bonzo AI Blog",
        description: "Content Engine & Experimentation Platform. High-performance Astro blog.",
        domain: "mybonzoaiblog.com",
        role: "public",
        stack: ["Astro", "Cloudflare Pages", "SEO", "Generative Content"],
        docs: "/docs/blog"
    },
    {
        id: "pumo-api",
        name: "PUMO API (Worker)",
        description: "Central Intelligence API. Handles Analytics, Sync, and Command orchestration.",
        domain: "api.ops.jimbo77.com",
        role: "hybrid",
        stack: ["Cloudflare Workers", "D1", "Vectorize", "AI"],
        docs: "/docs/api"
    }
];
