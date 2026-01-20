import React, { useState, useMemo } from "react";
import { PromptCard } from "./components/PromptCard";
import { Prompt, Category } from "./types";

const EXAMPLE_PROMPTS: Prompt[] = [
  {
    id: 1,
    title: "Code Review Expert",
    category: "Development",
    prompt:
      "Review this code for bugs, performance, and best practices. Provide specific suggestions with examples. Focus on:\n1. Security vulnerabilities\n2. Performance bottlenecks\n3. Code readability and maintainability",
    tags: ["code", "review", "quality"],
  },
  {
    id: 2,
    title: "Product Description",
    category: "Marketing",
    prompt:
      "Create a compelling product description that highlights benefits, features, and unique selling points. Use the AIDA framework (Attention, Interest, Desire, Action).",
    tags: ["copywriting", "ecommerce", "sales"],
  },
  {
    id: 3,
    title: "Unit Test Generator",
    category: "Development",
    prompt:
      "Generate comprehensive unit tests for the following function using Jest. Cover happy paths, edge cases, and error handling.",
    tags: ["testing", "jest", "code"],
  },
  {
    id: 4,
    title: "Email Sequence",
    category: "Marketing",
    prompt:
      "Draft a 3-part email sequence for welcoming new subscribers to a SaaS platform. \nEmail 1: Welcome & Value Prop\nEmail 2: Helpful Tip/Resource\nEmail 3: Soft Upsell to Premium",
    tags: ["email", "marketing", "copy"],
  },
  {
    id: 5,
    title: "React Component Optimizer",
    category: "Development",
    prompt:
      "Analyze this React component and pinpoint detailed optimization opportunities. Suggest where to use useMemo, useCallback, or React.memo to prevent unnecessary re-renders.",
    tags: ["react", "performance", "frontend"],
  },
  {
    id: 6,
    title: "Social Media Strategy",
    category: "Strategy",
    prompt:
      "Outline a one-month social media content calendar for a tech startup launching a new AI tool. detailed daily posts including format (video/image/text) and key message.",
    tags: ["social-media", "marketing", "planning"],
  },
  {
    id: 7,
    title: "SQL Query Improver",
    category: "Analyst",
    prompt:
      "Optimize the following SQL query for better execution time on a large PostgreSQL dataset. Explain the indexing strategy required.",
    tags: ["sql", "database", "backend"],
  },
  {
    id: 8,
    title: "Executive Summary",
    category: "Business",
    prompt:
      "Summarize the following technical report into a concise executive summary suitable for non-technical stakeholders. Focus on ROI and strategic impact.",
    tags: ["business", "writing", "summary"],
  },
  {
    id: 9,
    title: "Fast API Endpoint",
    category: "Development",
    prompt:
      "Create a FastAPI endpoint in Python that accepts a JSON payload, validates it using Pydantic, and processes the data asynchronously.",
    tags: ["python", "api", "backend"],
  },
  {
    id: 10,
    title: "SEO Blog Post",
    category: "Content",
    prompt:
      "Write a 1500-word SEO-optimized blog post about 'The Future of AI Agents'. Include H2/H3 headers, bullet points, and target keywords: 'AI automation', 'autonomous agents', 'future of work'.",
    tags: ["seo", "blog", "content"],
  },
];

const CATEGORIES: Category[] = ["All", "Development", "Marketing", "Strategy", "Analyst", "Business", "Content"];

export const ZenonView: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredPrompts = useMemo(() => {
    return EXAMPLE_PROMPTS.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.prompt.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 50 }}>
      {/* Header */}
         <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "20px 0", borderBottom: '1px solid var(--line)' }}>
             <div style={{ fontSize: 48 }}>🧠</div>
             <div>
                <h2 style={{ margin: 0, letterSpacing: "2px", fontFamily: "var(--font-brand)", fontSize: 42, lineHeight: 1 }}>
                    ZENON PROMPT MASTER
                </h2>
                <div style={{ fontSize: 16, color: "var(--muted)", letterSpacing: "1px", opacity: 0.8 }}>
                    Central Knowledge Base & Prompt Repository
                </div>
             </div>
        </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 250 }}>
            <input
                type="text"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--line)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    outline: 'none'
                }}
            />
        </div>
        
        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                        padding: '8px 16px',
                        background: activeCategory === cat ? 'var(--accent)' : 'transparent',
                        color: activeCategory === cat ? '#000' : 'var(--muted)',
                        border: '1px solid',
                        borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--line)',
                        cursor: 'pointer',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        letterSpacing: 1
                    }}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filteredPrompts.map(prompt => (
            <PromptCard key={prompt.id} prompt={prompt} />
        ))}
        {filteredPrompts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>
                No prompts found matching your criteria.
            </div>
        )}
      </div>
    </div>
  );
};
