// Web Crawler Agent API

import type { AgentRequest, AgentResponse } from '../../Types/agent';
import { AGENT_CONFIG } from './config';

interface CrawlOptions {
    maxDepth?: number;
    maxPages?: number;
    followExternal?: boolean;
    respectRobotsTxt?: boolean;
    selectors?: string[];
}

interface CrawlResult {
    url: string;
    title: string;
    content: string;
    links: string[];
    meta: Record<string, string>;
    status: number;
}

export async function handleRequest(request: AgentRequest): Promise<AgentResponse> {
    const { action, data } = request;

    try {
        switch (action) {
            case 'test':
                return handleTest();
            case 'execute':
                return await handleExecute(data);
            case 'status':
                return handleStatus();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            data: { error: error instanceof Error ? error.name : 'Error' },
            timestamp: new Date().toISOString()
        };
    }
}

function handleTest(): AgentResponse {
    return {
        success: true,
        message: 'Web Crawler agent test successful',
        data: {
            agent: AGENT_CONFIG.id,
            capabilities: AGENT_CONFIG.capabilities,
            version: AGENT_CONFIG.version
        },
        timestamp: new Date().toISOString()
    };
}

async function handleExecute(data: any): Promise<AgentResponse> {
    const { task, url, options = {} } = data;

    switch (task) {
        case 'crawl':
            return await crawlWebsite(url, options);
        case 'extract':
            return await extractData(url, options);
        case 'analyze':
            return await analyzeSEO(url);
        default:
            throw new Error(`Unknown task: ${task}`);
    }
}

async function crawlWebsite(startUrl: string, options: CrawlOptions): Promise<AgentResponse> {
    const {
        maxDepth = 2,
        maxPages = 100,
        followExternal = false,
        respectRobotsTxt = true
    } = options;

    const visited = new Set<string>();
    const results: CrawlResult[] = [];
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    while (queue.length > 0 && visited.size < maxPages) {
        const { url, depth } = queue.shift()!;

        if (visited.has(url) || depth > maxDepth) continue;

        try {
            visited.add(url);

            const response = await fetch(url);
            const html = await response.text();

            // Parse HTML (simplified - in production use cheerio/jsdom)
            const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
            const links = extractLinks(html, url);

            const result: CrawlResult = {
                url,
                title,
                content: html.substring(0, 1000), // First 1000 chars
                links,
                meta: extractMetaTags(html),
                status: response.status
            };

            results.push(result);

            // Add links to queue
            for (const link of links) {
                if (!followExternal && !link.startsWith(new URL(startUrl).origin)) {
                    continue;
                }
                queue.push({ url: link, depth: depth + 1 });
            }
        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error);
        }
    }

    return {
        success: true,
        message: `Crawled ${results.length} pages`,
        data: {
            pages: results,
            totalVisited: visited.size,
            totalLinks: results.reduce((sum, r) => sum + r.links.length, 0)
        },
        timestamp: new Date().toISOString()
    };
}

async function extractData(url: string, options: CrawlOptions): Promise<AgentResponse> {
    const { selectors = [] } = options;

    try {
        const response = await fetch(url);
        const html = await response.text();

        const extracted: Record<string, any> = {};

        // Simple selector extraction (in production use cheerio/jsdom)
        for (const selector of selectors) {
            const regex = new RegExp(`<${selector}[^>]*>(.*?)</${selector}>`, 'gi');
            const matches = Array.from(html.matchAll(regex), m => m[1]);
            extracted[selector] = matches;
        }

        return {
            success: true,
            message: `Extracted data from ${url}`,
            data: {
                url,
                extracted,
                selectors
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Failed to extract data: ${error}`);
    }
}

async function analyzeSEO(url: string): Promise<AgentResponse> {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // SEO Analysis
        const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
        const meta = extractMetaTags(html);
        const headings = {
            h1: (html.match(/<h1[^>]*>.*?<\/h1>/gi) || []).length,
            h2: (html.match(/<h2[^>]*>.*?<\/h2>/gi) || []).length,
            h3: (html.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length
        };

        const images = (html.match(/<img[^>]*>/gi) || []).length;
        const imagesWithAlt = (html.match(/<img[^>]*alt=/gi) || []).length;

        const analysis = {
            title: {
                present: !!title,
                length: title.length,
                optimal: title.length >= 30 && title.length <= 60
            },
            meta: {
                description: !!meta.description,
                keywords: !!meta.keywords,
                og: Object.keys(meta).some(k => k.startsWith('og:'))
            },
            headings,
            images: {
                total: images,
                withAlt: imagesWithAlt,
                percentage: images > 0 ? (imagesWithAlt / images) * 100 : 0
            },
            links: extractLinks(html, url).length
        };

        return {
            success: true,
            message: 'SEO analysis completed',
            data: {
                url,
                analysis,
                score: calculateSEOScore(analysis)
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`SEO analysis failed: ${error}`);
    }
}

function extractLinks(html: string, baseUrl: string): string[] {
    const regex = /<a[^>]*href=["']([^"']*)["']/gi;
    const links: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        try {
            const url = new URL(match[1], baseUrl);
            links.push(url.href);
        } catch {
            // Invalid URL, skip
        }
    }

    return [...new Set(links)]; // Remove duplicates
}

function extractMetaTags(html: string): Record<string, string> {
    const meta: Record<string, string> = {};
    const regex = /<meta[^>]*name=["']([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        meta[match[1]] = match[2];
    }

    // Also check property="" format (for Open Graph)
    const ogRegex = /<meta[^>]*property=["']([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
    while ((match = ogRegex.exec(html)) !== null) {
        meta[match[1]] = match[2];
    }

    return meta;
}

function calculateSEOScore(analysis: any): number {
    let score = 0;

    if (analysis.title.optimal) score += 20;
    if (analysis.meta.description) score += 20;
    if (analysis.meta.og) score += 15;
    if (analysis.headings.h1 === 1) score += 15;
    if (analysis.images.percentage >= 80) score += 15;
    if (analysis.links > 0) score += 15;

    return score;
}

function handleStatus(): AgentResponse {
    return {
        success: true,
        message: 'Agent is running',
        data: {
            agent: AGENT_CONFIG.id,
            status: AGENT_CONFIG.status,
            capabilities: AGENT_CONFIG.capabilities
        },
        timestamp: new Date().toISOString()
    };
}
