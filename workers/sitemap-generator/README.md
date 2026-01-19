# Sitemap Generator Worker

Cloudflare Worker that generates unified sitemap.xml and robots.txt for jimbo77.org, aggregating content from multiple projects.

## Features

- **Unified Sitemap**: Combines local pages + external project sitemaps
- **Robots.txt**: AI-friendly crawler configuration
- **Priority Mapping**: Different priorities for content types
- **Change Frequency**: Automated update frequency hints
- **External Aggregation**: Fetches sitemaps from MyBonzo Blog, Zen Browser, etc.
- **Edge Caching**: 1-hour cache for performance

## Routes

- `jimbo77.org/sitemap.xml` - Unified sitemap
- `jimbo77.org/robots.txt` - Robots configuration

## Deployment

```bash
# Development
npm run dev

# Production
npm run deploy:production
```

## Configuration

Edit `wrangler.toml`:

- `EXTERNAL_SITEMAPS`: Array of external sitemap URLs to aggregate
- `LOCAL_PAGES`: Array of local jimbo77.org pages

## Local Pages Included

- `/` - Homepage
- `/projects/` - Project directory
- `/projects/pumo-furniture/`
- `/projects/bonzo-ai-blog/`
- `/projects/zen-browser/`
- `/projects/agents/`
- `/projects/mcp-tools/`
- `/llms.txt` - AI crawler master index
- `/.well-known/ai-plugin.json` - ChatGPT plugin manifest
- `/.well-known/llm-context.json` - LLM context file

## Priority Levels

- **1.0**: Homepage, llms.txt (highest)
- **0.9**: Projects directory, AI manifests
- **0.8**: Documentation
- **0.7**: Blog, external content

## Change Frequency

- **Daily**: llms.txt, blog, llm-context.json
- **Weekly**: Homepage, projects, docs
- **Monthly**: AI plugin manifest

## AI Crawler Support

Robots.txt explicitly allows:

- GPTBot (OpenAI)
- ChatGPT-User
- Claude-Web (Anthropic)
- PerplexityBot
- Google-Extended
- anthropic-ai
- cohere-ai

## Version

1.0.0 - Initial release (2026-01-19)
