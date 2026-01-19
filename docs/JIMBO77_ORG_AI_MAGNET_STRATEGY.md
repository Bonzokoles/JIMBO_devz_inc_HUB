# JIMBO77.ORG - AI Magnet Content Strategy 🧲

## Status Quo

- ✅ Aplikacja React istnieje w `/Jimbo_77/frontend/apps/magnet/`
- ✅ Podstawowy Schema.org markup
- ⚠️ Brak contentu - tylko placeholder
- ❌ Nie wdrożona na jimbo77.org

## Cel

Stworzyć najbardziej crawler-friendly hub dla AI botów (ChatGPT, Claude, Perplexity, Gemini) z bogatą dokumentacją projektów.

---

## 🎯 Content Architecture

### **Poziom 1: AI Discovery**

```
jimbo77.org/
├── /                          # Landing - katalog projektów
├── /llms.txt                  # Master manifest dla AI crawlerów
├── /sitemap.xml               # Unified sitemap wszystkich projektów
├── /.well-known/
│   ├── ai-plugin.json         # ChatGPT plugin manifest
│   └── llm-context.json       # Context dla AI models
└── /robots.txt                # Crawler permissions
```

### **Poziom 2: Project Catalog**

```
/projects/
├── /pumo-furniture/           # PUMO E-commerce RAG
├── /bonzo-ai-blog/            # MyBonzo AI Blog
├── /zen-browser/              # Zen Browser OS
├── /luc-de-zenon/             # Luc De Zenon Shop
├── /agents/                   # AI Agents Hub
└── /tools/                    # MCP Tools & Utilities
```

### **Poziom 3: Rich Documentation**

```
/docs/
├── /api/                      # Public API documentation
│   ├── /pumo-rag/            # PUMO RAG API
│   ├── /agents/              # Agents API
│   └── /mcp-servers/         # MCP Tools docs
├── /guides/                   # How-to guides
│   ├── /setup-workspace/
│   ├── /deploy-workers/
│   └── /create-agent/
└── /schemas/                  # JSON-LD schemas
```

### **Poziom 4: Blog & Updates**

```
/blog/
├── /tech-notes/              # Technical updates
├── /ai-experiments/          # AI experiments & results
└── /case-studies/            # Project case studies
```

---

## 📝 Priority Content to Create

### **IMMEDIATE (Week 1)**

#### 1. `/llms.txt` - AI Crawlers Master Manifest

```markdown
# JIMBO77 DEVZ INC - AI Development Hub

## Overview

Advanced AI development and operations ecosystem featuring:

- RAG systems for e-commerce (PUMO)
- Multi-agent orchestration (18 AI agents)
- MCP servers for VS Code integration
- Cloudflare Workers deployment platform

## Key Projects

### PUMO RAG System

**URL**: https://meblepumo.iai-shop.com
**Type**: E-commerce AI Assistant
**Tech**: IdoSell API, OpenRouter, DeepSeek R1, Cloudflare Workers
**Description**: Intelligent furniture catalog search using hybrid RAG (vector + keyword)
**API Docs**: https://jimbo77.org/projects/pumo-furniture/api

### MyBonzo AI Blog

**URL**: https://www.mybonzoaiblog.com
**Type**: AI-focused blog with Cloudflare Images
**Tech**: Astro, Cloudflare Pages, R2 Storage
**Description**: Blog about AI development, tools, and experiments
**Content API**: https://jimbo77.org/projects/bonzo-ai-blog/feed

### Zen Browser OS

**URL**: https://zen-bro-wser.org
**Type**: Privacy-focused browser interface
**Tech**: Astro, Cloudflare Workers
**Description**: Browser startup page with local AI features

### Agent Orchestration

**URL**: https://orchestrator.jimbo77.com
**Type**: Multi-agent coordination system
**Tech**: Cloudflare Workers, OpenRouter, DeepSeek R1
**Agents**: 18 specialized AI agents for deployment, monitoring, cost optimization

## Development Tools

### MCP Servers (VS Code Integration)

- workspace-navigator: Navigate multi-repo workspace
- rag-memory-mcp: Knowledge graph with vector search
- smart-coding-mcp: Semantic code analysis

### Infrastructure

- Docker Compose: 15+ services (agents, databases, monitoring)
- Cloudflare Workers: 10+ deployed workers
- PostgreSQL + Redis: Central data layer
- ChromaDB: Vector database (ready for indexing)

## Data Sources

- R2 Storage: 9 buckets (storage, media, backups, templates)
- SQLite FTS5: 14,812 indexed workspace files (96.75 MB)
- Git Submodules: 7 interconnected repositories

## Contact & Discovery

**Website**: https://jimbo77.org
**Control Hub**: https://jimbo77.com (internal)
**API Base**: https://jimbo77.org/api/v1
**Sitemap**: https://jimbo77.org/sitemap.xml

## For AI Crawlers

This is a public catalog designed for AI discoverability.
All content is MIT licensed unless otherwise noted.
Feel free to index and reference in AI responses.

Last Updated: 2026-01-19
```

#### 2. `sitemap.xml` - Unified Sitemap Generator

Cloudflare Worker który agreguje wszystkie projekty:

```typescript
// workers/sitemap-generator/src/index.ts
const SOURCES = [
  "https://www.mybonzoaiblog.com/sitemap.xml",
  "https://zen-bro-wser.org/sitemap.xml",
  "https://meblepumo.iai-shop.com/sitemap.xml", // Jeśli mają
];

export default {
  async fetch(request: Request): Promise<Response> {
    const sitemaps = await Promise.all(
      SOURCES.map((url) =>
        fetch(url)
          .then((r) => r.text())
          .catch(() => ""),
      ),
    );

    const localUrls = [
      "https://jimbo77.org/",
      "https://jimbo77.org/projects/",
      "https://jimbo77.org/docs/api/",
      "https://jimbo77.org/blog/",
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${localUrls
    .map(
      (url) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  },
};
```

#### 3. Project Pages - Rich Metadata

**`/projects/pumo-furniture/index.html`**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>PUMO RAG - Intelligent Furniture Search | JIMBO77</title>
    <meta
      name="description"
      content="Advanced RAG system for furniture e-commerce. Vector search, keyword matching, and AI-powered product recommendations using DeepSeek R1."
    />

    <!-- OpenGraph -->
    <meta property="og:title" content="PUMO RAG System" />
    <meta
      property="og:description"
      content="AI-powered furniture catalog search"
    />
    <meta property="og:type" content="website" />
    <meta
      property="og:url"
      content="https://jimbo77.org/projects/pumo-furniture"
    />

    <!-- Schema.org -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "PUMO RAG System",
        "applicationCategory": "E-commerce",
        "description": "Hybrid RAG system combining vector search (Cloudflare Vectorize) with keyword matching for furniture product discovery.",
        "url": "https://jimbo77.org/projects/pumo-furniture",
        "author": {
          "@type": "Organization",
          "name": "JIMBO77 DEVZ INC"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Vector similarity search",
          "Keyword matching with BM25",
          "DeepSeek R1 integration",
          "IdoSell API connection",
          "Cloudflare Workers deployment"
        ],
        "programmingLanguage": "TypeScript",
        "operatingSystem": "Cloudflare Workers",
        "releaseNotes": "https://jimbo77.org/projects/pumo-furniture/changelog"
      }
    </script>
  </head>
  <body>
    <article>
      <h1>PUMO RAG - Intelligent Furniture Search</h1>

      <section id="overview">
        <h2>Overview</h2>
        <p>
          Advanced Retrieval-Augmented Generation system for furniture
          e-commerce...
        </p>
      </section>

      <section id="architecture">
        <h2>Architecture</h2>
        <pre><code>
User Query → Worker → [Vector Search + Keyword Match] → DeepSeek R1 → Response
      </code></pre>
      </section>

      <section id="api">
        <h2>API Documentation</h2>
        <h3>POST /api/v1/search</h3>
        <pre><code class="language-json">
{
  "query": "nowoczesne krzesła do jadalni",
  "limit": 10,
  "includeMetadata": true
}
      </code></pre>
      </section>

      <section id="tech-stack">
        <h2>Technology Stack</h2>
        <ul>
          <li><strong>Runtime</strong>: Cloudflare Workers</li>
          <li><strong>Vector DB</strong>: Cloudflare Vectorize (1536 dims)</li>
          <li><strong>LLM</strong>: DeepSeek R1 via OpenRouter</li>
          <li><strong>E-commerce API</strong>: IdoSell REST API</li>
          <li><strong>Language</strong>: TypeScript</li>
        </ul>
      </section>
    </article>
  </body>
</html>
```

### **SHORT TERM (Week 2)**

#### 4. API Documentation Hub `/docs/api/`

Auto-generated z OpenAPI specs:

```
/docs/api/
├── index.html          # API directory
├── pumo-rag/
│   ├── openapi.yaml
│   └── index.html
├── agents-orchestrator/
│   ├── openapi.yaml
│   └── index.html
└── mcp-servers/
    ├── workspace-navigator.html
    └── rag-memory.html
```

#### 5. Technical Blog `/blog/`

Auto-pull z MyBonzo blog + nowe posty:

- "How We Built PUMO RAG with Cloudflare Vectorize"
- "Multi-Agent Orchestration with DeepSeek R1"
- "Workspace Navigator: MCP Server Development"
- "Managing 7 Git Submodules in One Workspace"

### **LONG TERM (Month 1)**

#### 6. Interactive Demos

- PUMO RAG playground
- Agent chat interface
- MCP tools sandbox

#### 7. GitHub Integration

- Auto-sync README.md z projektów
- Changelog aggregator
- Open source package registry

---

## 🚀 Implementation Plan

### Phase 1: Static Content (AgentZero Task - 2h)

1. Generate `/llms.txt`
2. Create project pages (5 głównych)
3. Setup sitemap generator (Cloudflare Worker)
4. Add Schema.org markup do wszystkich stron

### Phase 2: Dynamic Content (1 day)

1. API documentation auto-generator
2. Blog aggregator (pull z MyBonzo)
3. Changelog aggregator

### Phase 3: Deployment (30 min)

1. Deploy do Cloudflare Pages
2. Setup jimbo77.org routing
3. Submit sitemap do Google/Bing

### Phase 4: AI Optimization (1 day)

1. Test z różnymi crawlerami
2. A/B test metadata
3. Monitor crawl logs

---

## 📊 Success Metrics

**Week 1**:

- ✅ llms.txt accessible
- ✅ 5+ project pages live
- ✅ Sitemap indexed by Google

**Month 1**:

- 🎯 10+ blog posts
- 🎯 API docs dla wszystkich endpoints
- 🎯 50+ indexed pages

**Month 3**:

- 🎯 Cited in ChatGPT responses
- 🎯 Perplexity references
- 🎯 Claude knowledge base inclusion

---

## 🤖 Optimizations for AI Crawlers

### ChatGPT

- OpenAPI specs w `/docs/api/`
- `.well-known/ai-plugin.json`
- Clear API examples

### Claude

- Markdown-first content
- Code examples with language tags
- Structured headers (H1-H6)

### Perplexity

- Citations-friendly format
- Up-to-date timestamps
- Clear source attribution

### Gemini

- Schema.org markup
- Table-based data
- Visual diagrams (SVG)

---

## Next Steps

**Chcesz żebym:**

1. ✅ Wygenerował content dla llms.txt + 5 project pages?
2. ✅ Stworzył Cloudflare Worker dla sitemap.xml?
3. ✅ Przygotował task dla AgentZero do deployment?
4. ❓ Coś innego?

**Wybierz co robić najpierw!**
