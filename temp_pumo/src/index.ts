import { ChunkData, Env } from './types';

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

let jwksCache: { fetchedAt: number; jwks: any } | null = null;

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64UrlToString(input: string): string {
  const bytes = base64UrlToBytes(input);
  return new TextDecoder().decode(bytes);
}

async function getAccessJwks(env: Env): Promise<any> {
  const url = (env.CF_ACCESS_JWKS_URL || '').trim();
  if (!url) throw new Error('CF_ACCESS_JWKS_URL missing');

  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < 5 * 60_000) {
    return jwksCache.jwks;
  }

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  const jwks = await res.json();
  jwksCache = { fetchedAt: now, jwks };
  return jwks;
}

async function requireDashboardAccess(request: Request, env: Env): Promise<void> {
  // Check if auth is disabled
  let disableAuth = String(env.DASHBOARD_DISABLE_AUTH || '').trim().toLowerCase();
  disableAuth = disableAuth.replace(/^['\"]+|['\"]+$/g, '');
  if (disableAuth === '1' || disableAuth === 'true' || disableAuth === 'yes') {
    return;
  }

  // Check if running locally
  const u = new URL(request.url);
  const hostname = u.hostname;
  const hostHeader = (request.headers.get('Host') || '').toLowerCase();
  const isLocal = hostname === '127.0.0.1'
    || hostname === 'localhost'
    || hostHeader.startsWith('127.0.0.1')
    || hostHeader.startsWith('localhost');

  if (isLocal) {
    return;
  }

  // Option 1: Simple password-based auth (if DASHBOARD_PASSWORD is set)
  const dashboardPassword = String(env.DASHBOARD_PASSWORD || '').trim();
  if (dashboardPassword) {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Basic ')) {
      throw new Error('BASIC_AUTH_REQUIRED');
    }
    
    try {
      const base64Credentials = authHeader.substring(6).trim();
      if (!base64Credentials || !/^[A-Za-z0-9+/=]+$/.test(base64Credentials)) {
        throw new Error('Invalid credentials format');
      }
      
      const credentials = atob(base64Credentials);
      const colonIndex = credentials.indexOf(':');
      if (colonIndex === -1) {
        throw new Error('Invalid credentials format');
      }
      
      const password = credentials.substring(colonIndex + 1);
      
      if (!constantTimeCompare(password, dashboardPassword)) {
        throw new Error('Invalid credentials');
      }
      return; // Password auth successful
    } catch (error: any) {
      if (error.message === 'BASIC_AUTH_REQUIRED') {
        throw error;
      }
      throw new Error('Invalid credentials');
    }
  }

  // Option 2: Cloudflare Access JWT auth (enterprise SSO)
  const aud = (env.CF_ACCESS_AUD || '').trim();
  const jwksUrl = (env.CF_ACCESS_JWKS_URL || '').trim();
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  
  if (!token) throw new Error('Missing Cf-Access-Jwt-Assertion');
  if (!aud) throw new Error('CF_ACCESS_AUD missing');
  if (!jwksUrl) throw new Error('CF_ACCESS_JWKS_URL missing');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const [h, p, s] = parts;

  const header = JSON.parse(base64UrlToString(h)) as any;
  const payload = JSON.parse(base64UrlToString(p)) as any;

  const payloadAud = payload?.aud;
  const audOk = Array.isArray(payloadAud) ? payloadAud.includes(aud) : payloadAud === aud;
  if (!audOk) throw new Error('Invalid audience');

  const exp = typeof payload?.exp === 'number' ? payload.exp : 0;
  if (exp && Date.now() / 1000 > exp) throw new Error('Token expired');

  const jwks = await getAccessJwks(env);
  const kid = header?.kid;
  const keys: any[] = Array.isArray(jwks?.keys) ? jwks.keys : [];
  const jwk = keys.find(k => k.kid === kid) || null;
  if (!jwk) throw new Error('JWKS key not found');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = new TextEncoder().encode(`${h}.${p}`);
  const sig = base64UrlToBytes(s);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
  if (!ok) throw new Error('Invalid signature');
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const hostname = url.hostname;
    const isLocal = hostname === '127.0.0.1' || hostname === 'localhost';

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Dashboard - main page
      if (path === '/' && request.method === 'GET') {
        if (isLocal) {
          return Response.redirect(`${url.origin}/dashboard`, 302);
        }
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, corsHeaders);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, corsHeaders);
      }

      // Favicon routes
      if (path === '/favicon.ico' || path === '/apple-touch-icon.png' || path.startsWith('/favicon/')) {
        return await handleFavicon(path, corsHeaders);
      }

      // Chunk processing
      if (path === '/api/chunk/process' && request.method === 'POST') {
        return await handleChunkProcess(request, env, corsHeaders);
      }

      // Search
      if (path === '/api/search' && request.method === 'POST') {
        return await handleSearch(request, env, corsHeaders);
      }

      // Guide generation
      if (path === '/api/generate-guides' && request.method === 'POST') {
        return await handleGenerateGuides(env, corsHeaders);
      }

      if (path.startsWith('/api/guide/')) {
        const guidePath = path.replace('/api/guide', '');
        return await handleGetGuide(guidePath, env, corsHeaders);
      }

      // Analytics endpoints
      if (path === '/api/track' && request.method === 'POST') {
        return await handleTrackEvent(request, env, corsHeaders);
      }

      if (path === '/api/analytics/kpis' && request.method === 'GET') {
        return await handleKPIs(request, env, corsHeaders);
      }

      if (path === '/api/analytics/ai-impact' && request.method === 'GET') {
        return await handleAIImpact(env, corsHeaders);
      }

      if (path === '/api/analytics/revenue-trend' && request.method === 'GET') {
        return await handleRevenueTrend(request, env, corsHeaders);
      }

      if (path === '/api/analytics/traffic-sources' && request.method === 'GET') {
        return await handleTrafficSources(env, corsHeaders);
      }

      if (path === '/api/analytics/category-performance' && request.method === 'GET') {
        return await handleCategoryPerformance(env, corsHeaders);
      }

      if (path === '/api/analytics/top-products' && request.method === 'GET') {
        return await handleTopProducts(request, env, corsHeaders);
      }

      if (path === '/api/analytics/realtime' && request.method === 'GET') {
        return await handleRealtimeStats(env, corsHeaders);
      }

      if (path === '/api/analytics/reports' && request.method === 'GET') {
        return await handleGetReports(env, corsHeaders);
      }

      if (path.startsWith('/api/analytics/report/')) {
        const reportId = path.split('/').pop();
        return await handleGetReport(reportId!, env, corsHeaders);
      }

      // Dashboard
      if (path === '/dashboard' && request.method === 'GET') {
        try {
          await requireDashboardAccess(request, env);
        } catch (error: any) {
          const errorMsg = error?.message || 'Unauthorized';
          const headers: any = {
            'Content-Type': 'text/plain; charset=utf-8',
            ...(corsHeaders || {})
          };
          
          // If password-based auth is enabled, request Basic Auth
          if (errorMsg === 'BASIC_AUTH_REQUIRED') {
            headers['WWW-Authenticate'] = 'Basic realm="PUMO Dashboard", charset="UTF-8"';
          }
          
          return new Response(errorMsg === 'BASIC_AUTH_REQUIRED' ? 'Authentication required' : errorMsg, {
            status: 401,
            headers
          });
        }
        return await handleDashboard(env, corsHeaders);
      }

      // Analytics endpoint for dashboard
      if (path === '/analytics' && request.method === 'POST') {
        return await handleDashboardAnalytics(request, env, corsHeaders);
      }

      // Manual sync trigger
      if (path === '/api/sync/trigger' && request.method === 'POST') {
        return await handleManualSync(env, corsHeaders);
      }

      // Email endpoints
      if (path === '/api/email/subscribe' && request.method === 'POST') {
        return await handleEmailSubscribe(request, env, corsHeaders);
      }

      if (path === '/api/email/unsubscribe' && request.method === 'POST') {
        return await handleEmailUnsubscribe(request, env, corsHeaders);
      }

      if (path === '/api/email/update-frequency' && request.method === 'POST') {
        return await handleUpdateFrequency(request, env, corsHeaders);
      }

      if (path === '/api/email/subscribers' && request.method === 'GET') {
        return await handleGetSubscribers(request, env, corsHeaders);
      }

      if (path === '/api/email/stats' && request.method === 'GET') {
        return await handleEmailStats(env, corsHeaders);
      }

      if (path === '/api/email/send-test' && request.method === 'POST') {
        return await handleSendTestEmail(request, env, corsHeaders);
      }

      // === NEW SYNC ENDPOINTS ===

      // Product sync
      if (path === '/api/sync/full' && request.method === 'POST') {
        return await handleFullSync(env, corsHeaders);
      }

      if (path === '/api/sync/incremental' && request.method === 'POST') {
        return await handleIncrementalSync(env, corsHeaders);
      }

      if (path === '/api/sync/test' && request.method === 'GET') {
        return await handleTestAPIConnection(env, corsHeaders);
      }

      if (path === '/api/sync/status' && request.method === 'GET') {
        return await handleSyncStatus(env, corsHeaders);
      }

      if (path === '/api/changes' && request.method === 'GET') {
        return await handleGetChanges(request, env, corsHeaders);
      }

      // Order sync & stats
      if (path === '/api/orders/sync' && request.method === 'POST') {
        return await handleOrdersSync(request, env, corsHeaders);
      }

      if (path === '/api/orders/stats' && request.method === 'GET') {
        return await handleOrdersStats(request, env, corsHeaders);
      }

      if (path.startsWith('/api/orders/')) {
        const orderId = path.split('/').pop();
        return await handleGetOrder(orderId!, env, corsHeaders);
      }

      if (path === '/api/revenue/attribution' && request.method === 'GET') {
        return await handleRevenueAttribution(request, env, corsHeaders);
      }

      // GA4 Data API (read reports)
      if (path === '/api/ga4/run-report' && request.method === 'POST') {
        return await handleGA4RunReport(request, env, corsHeaders);
      }

      // R2 cleanup - delete old backups (>30 days)
      if (path === '/api/cleanup-r2' && request.method === 'POST') {
        return await handleR2Cleanup(env, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error: any) {
      console.error('Request error:', error);
      return jsonResponse({ error: error.message }, 500, corsHeaders);
    }
  },

  async scheduled(event: any, env: Env, ctx: any) {
    console.log('⏰ Cron triggered at:', new Date().toISOString());
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const hour = now.getHours();

    try {
      // Daily sync (every 6 hours)
      const { DailySyncWorkflow } = await import('./workflows/daily-sync');
      const workflow = new DailySyncWorkflow(env);
      await workflow.run();
      console.log('✅ Scheduled sync completed');

      // Weekly R2 cleanup (Sundays at 3:00)
      if (dayOfWeek === 0 && hour === 3) {
        console.log('🧹 Running weekly R2 cleanup');
        const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion'
        };
        const cleanupResult = await handleR2Cleanup(env, corsHeaders);
        console.log('✅ Weekly R2 cleanup completed');
      }

    } catch (error) {
      console.error('❌ Scheduled task failed:', error);
    }
  }
};

// Helper function
function jsonResponse(data: any, status = 200, additionalHeaders = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
  });
}

// === HANDLER IMPLEMENTATIONS ===

async function handleChunkProcess(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const chunkData: ChunkData = await request.json();
    const { ChunkProcessor } = await import('./processors/chunk-processor');
    const processor = new ChunkProcessor(env);
    await processor.processChunk(chunkData);
    return jsonResponse({
      success: true,
      message: `Chunk ${chunkData.metadata.chunk_index}/${chunkData.metadata.total_chunks} processed`,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleSearch(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const searchQuery = await request.json();
    const { SearchService } = await import('./services/search-service');
    const searchService = new SearchService(env);
    const results = await searchService.search(searchQuery);
    return jsonResponse({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGenerateGuides(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { GuideGenerator } = await import('./generators/guide-generator');
    const generator = new GuideGenerator(env);
    const guides = await generator.generateAllGuides();
    return jsonResponse({
      success: true,
      data: { guides_generated: guides.size, paths: Array.from(guides.keys()) }
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetGuide(guidePath: string, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const cached = await env.CACHE.get(`guide:${guidePath}`);
    if (!cached) {
      return jsonResponse({ success: false, error: 'Guide not found' }, 404, corsHeaders);
    }
    return new Response(cached, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', ...corsHeaders }
    });
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleKPIs(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const metrics = await aggregator.getDailyMetrics(days);

    const currentPeriod = metrics.slice(0, days);
    const previousPeriod = metrics.slice(days, days * 2);

    const totalRevenue = currentPeriod.reduce((sum, m) => sum + m.revenue, 0);
    const prevRevenue = previousPeriod.reduce((sum, m) => sum + m.revenue, 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

    const totalClicks = currentPeriod.reduce((sum, m) => sum + m.product_clicks, 0);
    const prevClicks = previousPeriod.reduce((sum, m) => sum + m.product_clicks, 0);
    const clicksChange = prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks * 100) : 0;

    const avgConversion = currentPeriod.reduce((sum, m) => sum + m.conversion_rate, 0) / currentPeriod.length;
    const prevAvgConversion = previousPeriod.reduce((sum, m) => sum + m.conversion_rate, 0) / previousPeriod.length;
    const conversionChange = avgConversion - prevAvgConversion;

    const aiClicks = currentPeriod.reduce((sum, m) => sum + m.ai_seo_clicks, 0);
    const aiRevenue = totalRevenue * (aiClicks / totalClicks);
    const aiRevenueShare = (aiRevenue / totalRevenue * 100) || 0;

    return jsonResponse({
      success: true,
      data: {
        total_revenue: totalRevenue,
        revenue_change: revenueChange,
        ai_revenue: aiRevenue,
        ai_revenue_share: aiRevenueShare,
        total_clicks: totalClicks,
        clicks_change: clicksChange,
        conversion_rate: avgConversion,
        conversion_change: conversionChange
      }
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleAIImpact(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const impact = await aggregator.getAISEOImpact();
    return jsonResponse({ success: true, data: impact }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleRevenueTrend(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const metrics = await aggregator.getDailyMetrics(days);

    const enrichedMetrics = metrics.map(m => ({
      date: m.date,
      total_revenue: m.revenue,
      ai_revenue: m.revenue * (m.ai_seo_clicks / m.product_clicks || 0)
    }));

    return jsonResponse({ success: true, data: enrichedMetrics }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleTrafficSources(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const sources = await aggregator.getSourceAttribution();

    const aiSEO = sources.find(s => s.source === 'mybonzo')?.clicks || 0;
    const organic = sources.filter(s => s.source.includes('google') || s.source.includes('organic')).reduce((sum, s) => sum + s.clicks, 0);
    const paid = sources.filter(s => s.source.includes('ads') || s.source.includes('paid')).reduce((sum, s) => sum + s.clicks, 0);
    const direct = sources.find(s => s.source === 'direct')?.clicks || 0;

    return jsonResponse({
      success: true,
      data: { ai_seo: aiSEO, organic, paid, direct }
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleCategoryPerformance(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const categories = await aggregator.getCategoryPerformance();
    return jsonResponse({ success: true, data: categories }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleTopProducts(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const products = await aggregator.getTopProducts(limit);
    return jsonResponse({ success: true, data: products }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleRealtimeStats(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { AnalyticsAggregator } = await import('./services/analytics-aggregator');
    const aggregator = new AnalyticsAggregator(env);
    const stats = await aggregator.getRealtimeStats();

    const { results } = await env.DB.prepare(`
      SELECT SUM(p.price) as revenue_24h
      FROM analytics_events ae
      JOIN products p ON ae.product_id = p.id
      WHERE ae.event_type = 'purchase'
        AND ae.timestamp >= datetime('now', '-24 hours')
    `).all();

    stats.current.revenue_24h = results[0]?.revenue_24h || 0;
    return jsonResponse({ success: true, data: stats }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetReports(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { ReportGenerator } = await import('./services/report-generator');
    const generator = new ReportGenerator(env);
    const [daily, weekly, monthly] = await Promise.all([
      generator.listReports('daily', 7),
      generator.listReports('weekly', 4),
      generator.listReports('monthly', 3)
    ]);
    return jsonResponse({ success: true, data: { daily, weekly, monthly } }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetReport(reportId: string, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { ReportGenerator } = await import('./services/report-generator');
    const generator = new ReportGenerator(env);
    const report = await generator.getReport(reportId);
    if (!report) {
      return jsonResponse({ success: false, error: 'Report not found' }, 404, corsHeaders);
    }
    return jsonResponse({ success: true, data: report }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleEmailSubscribe(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email, name, frequency } = body;
    if (!email || !email.includes('@')) {
      return jsonResponse({ success: false, error: 'Invalid email' }, 400, corsHeaders);
    }
    const { SubscriberManager } = await import('./services/subscriber-manager');
    const manager = new SubscriberManager(env);
    const success = await manager.subscribe(email, name, frequency || 'daily');
    return jsonResponse({
      success,
      message: success ? 'Successfully subscribed to reports' : 'Failed to subscribe'
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleEmailUnsubscribe(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email } = body;
    if (!email) {
      return jsonResponse({ success: false, error: 'Email required' }, 400, corsHeaders);
    }
    const { SubscriberManager } = await import('./services/subscriber-manager');
    const manager = new SubscriberManager(env);
    const success = await manager.unsubscribe(email);
    return jsonResponse({
      success,
      message: success ? 'Successfully unsubscribed' : 'Failed to unsubscribe'
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleUpdateFrequency(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email, frequency } = body;
    if (!email || !frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return jsonResponse({ success: false, error: 'Invalid parameters' }, 400, corsHeaders);
    }
    const { SubscriberManager } = await import('./services/subscriber-manager');
    const manager = new SubscriberManager(env);
    const success = await manager.updateFrequency(email, frequency);
    return jsonResponse({
      success,
      message: success ? 'Frequency updated' : 'Failed to update'
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetSubscribers(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const frequency = url.searchParams.get('frequency') as 'daily' | 'weekly' | 'monthly' | undefined;
    const { SubscriberManager } = await import('./services/subscriber-manager');
    const manager = new SubscriberManager(env);
    const subscribers = await manager.getActiveSubscribers(frequency);
    return jsonResponse({ success: true, data: subscribers }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleEmailStats(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { SubscriberManager } = await import('./services/subscriber-manager');
    const manager = new SubscriberManager(env);
    const stats = await manager.getStats();
    const { results: emailStats } = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM email_log
      WHERE sent_at >= date('now', '-30 days')
    `).all();
    return jsonResponse({
      success: true,
      data: { subscribers: stats, emails: emailStats[0] }
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleSendTestEmail(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email } = body;
    if (!email) {
      return jsonResponse({ success: false, error: 'Email required' }, 400, corsHeaders);
    }
    const { ReportGenerator } = await import('./services/report-generator');
    const generator = new ReportGenerator(env);
    const report = await generator.generateDailyReport();
    const { EmailService } = await import('./services/email-service');
    const emailService = new EmailService(env);
    const success = await emailService.sendReportEmail({
      report,
      recipient: email,
      recipientName: 'Test User'
    });
    return jsonResponse({
      success,
      message: success ? 'Test email sent' : 'Failed to send test email'
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

// === NEW HANDLERS ===

async function handleFullSync(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { ProductSync } = await import('./services/product-sync');
    const sync = new ProductSync(env);
    const result = await sync.fullSync();
    return jsonResponse({ success: true, data: result }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleIncrementalSync(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { ProductSync } = await import('./services/product-sync');
    const sync = new ProductSync(env);
    const result = await sync.incrementalSync();
    return jsonResponse({ success: true, data: result }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleTestAPIConnection(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { ProductSync } = await import('./services/product-sync');
    const sync = new ProductSync(env);
    const connected = await sync.testAPIConnection();
    return jsonResponse({
      success: connected,
      message: connected ? 'API connection successful' : 'API connection failed'
    }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleSyncStatus(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM sync_history
      ORDER BY started_at DESC
      LIMIT 10
    `).all();
    return jsonResponse({ success: true, data: results }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetChanges(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type');
    let query = `
      SELECT * FROM product_changes
      ${type ? 'WHERE change_type = ?' : ''}
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    const bindings = type ? [type, limit] : [limit];
    const { results } = await env.DB.prepare(query).bind(...bindings).all();
    return jsonResponse({ success: true, data: results }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleOrdersSync(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const hours = body.hours || 24;
    const { OrderSync } = await import('./services/order-sync');
    const sync = new OrderSync(env);
    await sync.syncRecentOrders(hours);
    return jsonResponse({ success: true, message: `Orders from last ${hours}h synced` }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleOrdersStats(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const { OrderSync } = await import('./services/order-sync');
    const sync = new OrderSync(env);
    const stats = await sync.getOrderStats(days);
    return jsonResponse({ success: true, data: stats }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGetOrder(orderId: string, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(`
      SELECT o.*, 
        json_group_array(
          json_object(
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `).bind(orderId).all();

    if (results.length === 0) {
      return jsonResponse({ success: false, error: 'Order not found' }, 404, corsHeaders);
    }

    const order = results[0];
    order.items = JSON.parse(order.items as string);
    return jsonResponse({ success: true, data: order }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleRevenueAttribution(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const { results } = await env.DB.prepare(`
      SELECT 
        COALESCE(utm_source, source, 'direct') as source,
        COUNT(*) as orders_count,
        SUM(revenue) as total_revenue,
        AVG(revenue) as avg_order_value
      FROM revenue_attribution
      WHERE timestamp >= datetime('now', '-' || ? || ' days')
      GROUP BY source
      ORDER BY total_revenue DESC
    `).bind(days).all();
    return jsonResponse({ success: true, data: results }, 200, corsHeaders);
  } catch (error: any) {
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleTrackEvent(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const eventData = await request.json() as any;

    // Validate required fields
    if (!eventData.name) {
      return jsonResponse({ success: false, error: 'Event name required' }, 400, corsHeaders);
    }

    const { GA4Analytics } = await import('./services/ga4-analytics');
    const analytics = new GA4Analytics(env);

    // Extract client ID from request headers or body, fallback to random
    const clientId = request.headers.get('x-client-id') || eventData.client_id || 'anonymous';

    // Track the event (Dual-write: D1 + GA4)
    await analytics.trackEvent({
      name: eventData.name,
      params: eventData.params || {}
    }, clientId);

    return jsonResponse({ success: true, message: 'Event tracked' }, 200, corsHeaders);
  } catch (error: any) {
    console.error('Track error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

async function handleGA4RunReport(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { GA4DataAPI } = await import('./services/ga4-data-api');
    const ga4 = new GA4DataAPI(env);
    const data = await ga4.runReport(body || {});
    return jsonResponse({ success: true, data }, 200, corsHeaders);
  } catch (error: any) {
    console.error('GA4 runReport error:', error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
  }
}

// Dashboard Handler
async function handleDashboard(env: Env, corsHeaders?: any): Promise<Response> {
  const { DASHBOARD_HTML } = await import('./templates/dashboard');

  const defaultApiBase = String(env.DASHBOARD_API_BASE || '').trim();
  const injected = `<script>window.__DEFAULT_API_BASE__=${JSON.stringify(defaultApiBase)};</script>`;
  const html = DASHBOARD_HTML.includes('<head>')
    ? DASHBOARD_HTML.replace('<head>', '<head>' + injected)
    : injected + DASHBOARD_HTML;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...(corsHeaders || {})
    }
  });
}

// Manual Sync Handler
async function handleManualSync(env: Env, corsHeaders: any): Promise<Response> {
  try {
    console.log('🚀 Manual sync triggered at:', new Date().toISOString());

    const { DailySyncWorkflow } = await import('./workflows/daily-sync');
    const workflow = new DailySyncWorkflow(env);

    // Run async without waiting (fire and forget)
    workflow.run().then(() => {
      console.log('✅ Manual sync completed');
    }).catch((error) => {
      console.error('❌ Manual sync failed:', error);
    });

    return jsonResponse({
      success: true,
      message: 'Manual sync started',
      timestamp: new Date().toISOString()
    }, 200, corsHeaders);

  } catch (error: any) {
    console.error('Manual sync error:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, 500, corsHeaders);
  }
}

// Dashboard Analytics Handler
async function handleDashboardAnalytics(request: Request, env: Env, corsHeaders: any): Promise<Response> {
  try {
    const body = await request.json();
    const action = body.action || 'dashboard';

    if (action === 'dashboard') {
      // Get basic dashboard data
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(DISTINCT category) as total_categories
        FROM products 
        WHERE status = 'active'
      `).first();

      const requests24h = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM analytics_events 
        WHERE timestamp > datetime('now', '-1 day')
      `).first();

      return jsonResponse({
        totalProducts: stats?.total_products || 0,
        totalCategories: stats?.total_categories || 0,
        apiRequests24h: requests24h?.count || 0,
        avgResponseTime: 150 + Math.floor(Math.random() * 100) // Mock response time
      }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Unknown action' }, 400, corsHeaders);

  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return jsonResponse({
      totalProducts: '--',
      totalCategories: '--',
      apiRequests24h: '--',
      avgResponseTime: '--'
    }, 200, corsHeaders);
  }
}

// Favicon Handler
async function handleFavicon(path: string, corsHeaders: any): Promise<Response> {
  let contentType = 'image/x-icon';
  let content: string | Uint8Array | null = null;

  if (path === '/favicon.ico' || path === '/apple-touch-icon.png') {
    // Real PNG icon from favicon folder - apple-touch-icon.png
    const pngBase64 = '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\n';

    contentType = 'image/png';
    const buffer = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
    content = buffer;
  } else if (path.startsWith('/favicon/')) {
    const filename = path.replace('/favicon/', '');
    if (filename === 'site.webmanifest') {
      contentType = 'application/manifest+json';
      content = JSON.stringify({
        "name": "PUMO WHITECAT",
        "short_name": "PUMO",
        "icons": [
          {
            "src": "/favicon/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          }
        ],
        "theme_color": "#0b0b12",
        "background_color": "#050509",
        "display": "standalone"
      });
    }
  }

  if (content) {
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders
      }
    });
  }

  return new Response(null, {
    status: 404,
    headers: corsHeaders
  });
}

// R2 Cleanup Handler
async function handleR2Cleanup(env: Env, corsHeaders: any): Promise<Response> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`🧹 Starting R2 cleanup for files older than ${thirtyDaysAgo.toISOString()}`);

    const list = await env.PUMO_RAW_BUCKET.list();
    let deleted = 0;

    for (const obj of list.objects) {
      if (obj.uploaded < thirtyDaysAgo) {
        await env.PUMO_RAW_BUCKET.delete(obj.key);
        deleted++;
        console.log(`🗑️ Deleted old backup: ${obj.key}`);
      }
    }

    console.log(`✅ R2 cleanup completed. Deleted ${deleted} old backup files`);

    return jsonResponse({
      success: true,
      deleted,
      message: `Deleted ${deleted} old backup files`,
      cutoff_date: thirtyDaysAgo.toISOString()
    }, 200, corsHeaders);

  } catch (error: any) {
    console.error('❌ R2 cleanup failed:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, 500, corsHeaders);
  }
}


