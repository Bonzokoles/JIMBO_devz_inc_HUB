export interface Env {
  EXTERNAL_SITEMAPS?: string[];
  LOCAL_PAGES?: string[];
}

// Default configuration (used when env vars are not available)
const DEFAULT_EXTERNAL_SITEMAPS = [
  "https://www.mybonzoaiblog.com/sitemap.xml",
  "https://zen-bro-wser.org/sitemap.xml",
];

const DEFAULT_LOCAL_PAGES = [
  "/",
  "/projects/",
  "/projects/pumo-furniture/",
  "/projects/bonzo-ai-blog/",
  "/projects/zen-browser/",
  "/projects/agents/",
  "/projects/mcp-tools/",
  "/docs/",
  "/blog/",
  "/llms.txt",
  "/.well-known/ai-plugin.json",
  "/.well-known/llm-context.json",
];

// Priority mapping for different page types
const PRIORITY_MAP: Record<string, number> = {
  "/": 1.0,
  "/projects/": 0.9,
  "/llms.txt": 1.0,
  "/.well-known/ai-plugin.json": 0.9,
  "/.well-known/llm-context.json": 0.9,
  "/docs/": 0.8,
  "/blog/": 0.7,
};

// Change frequency for different page types
const CHANGEFREQ_MAP: Record<string, string> = {
  "/": "weekly",
  "/projects/": "weekly",
  "/llms.txt": "daily",
  "/.well-known/ai-plugin.json": "monthly",
  "/.well-known/llm-context.json": "daily",
  "/docs/": "weekly",
  "/blog/": "daily",
};

function generateSitemapXML(
  urls: Array<{
    loc: string;
    lastmod: string;
    priority: number;
    changefreq: string;
  }>,
): string {
  const urlEntries = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function generateRobotsTxt(): string {
  return `# JIMBO77.org - AI-Friendly Robots.txt
User-agent: *
Allow: /

# AI Crawlers - Full Access
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: cohere-ai
Allow: /

# Sitemap location
Sitemap: https://jimbo77.org/sitemap.xml

# Master AI index
Crawl-delay: 1
`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle robots.txt
    if (url.pathname === "/robots.txt") {
      return new Response(generateRobotsTxt(), {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Handle sitemap.xml
    if (url.pathname === "/sitemap.xml") {
      try {
        const now = new Date().toISOString();
        const baseUrl = "https://jimbo77.org";

        // Use env vars or fallback to defaults
        const localPages = env.LOCAL_PAGES || DEFAULT_LOCAL_PAGES;
        const externalSitemaps =
          env.EXTERNAL_SITEMAPS || DEFAULT_EXTERNAL_SITEMAPS;

        // Build local URLs
        const localUrls = localPages.map((path) => {
          const priority = PRIORITY_MAP[path] || 0.8;
          const changefreq = CHANGEFREQ_MAP[path] || "weekly";

          return {
            loc: `${baseUrl}${path}`,
            lastmod: now,
            priority,
            changefreq,
          };
        });

        // Fetch external sitemaps (optional - comment out if causing issues)
        const externalUrls: Array<{
          loc: string;
          lastmod: string;
          priority: number;
          changefreq: string;
        }> = [];

        if (externalSitemaps && externalSitemaps.length > 0) {
          const fetchPromises = externalSitemaps.map(async (sitemapUrl) => {
            try {
              const response = await fetch(sitemapUrl, {
                headers: { "User-Agent": "JIMBO77-Sitemap-Aggregator/1.0" },
                cf: { cacheTtl: 3600 }, // Cache for 1 hour
              });

              if (response.ok) {
                const text = await response.text();
                // Simple XML parsing to extract <loc> URLs
                const locMatches = text.matchAll(/<loc>(.*?)<\/loc>/g);
                for (const match of locMatches) {
                  externalUrls.push({
                    loc: match[1],
                    lastmod: now,
                    priority: 0.7,
                    changefreq: "weekly",
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to fetch sitemap ${sitemapUrl}:`, error);
            }
          });

          await Promise.all(fetchPromises);
        }

        // Combine and generate XML
        const allUrls = [...localUrls, ...externalUrls];
        const xml = generateSitemapXML(allUrls);

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(`Error generating sitemap: ${error}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }

    // Default response
    return new Response("Not Found", { status: 404 });
  },
};
