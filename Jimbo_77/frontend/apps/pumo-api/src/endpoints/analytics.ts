/**
 * Analytics API Endpoints
 * Handles all /api/analytics/* routes
 */

import { Env } from '../types';
// Note: Dynamic imports used in handlers to keep startup fast, 
// but we define types here if needed.

export async function handleAnalyticsAPI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/analytics/', '');

    try {
        switch (path) {
            case 'kpis':
                return await handleKPIs(request, env);

            case 'revenue-trend':
                return await handleRevenueTrend(request, env);

            case 'category-stats':
                return await handleCategoryStats(request, env);

            case 'recent-events':
                return await handleRecentEvents(request, env);

            case 'populate-sample': // Legacy name, works as sync trigger
            case 'sync-history':
                if (request.method === 'POST') {
                    return await handleSyncHistory(request, env);
                }
                break;

            case 'track':
                if (request.method === 'POST') {
                    return await handleTrackEvent(request, env);
                }
                break;

            case 'test-idosell':
                 return await testIdoSell(env);

            case 'track-bot':
                 if (request.method === 'POST') {
                     return await handleBotTrack(request, env);
                 } else if (request.method === 'GET') {
                     return await handleBotStats(request, env);
                 }
                 break;

            default:
                return Response.json({
                    error: 'Analytics endpoint not found',
                    available: ['kpis', 'revenue-trend', 'category-stats', 'recent-events', 'sync-history', 'track', 'test-idosell', 'track-bot']
                }, { status: 404 });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('Analytics API error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Track event handler
async function handleTrackEvent(request: Request, env: Env): Promise<Response> {
    try {
        const eventData = await request.json() as any;

        if (!eventData.name) {
            return Response.json({ success: false, error: 'Event name required' }, { status: 400 });
        }

        const { GA4Analytics } = await import('../services/ga4-analytics');
        const analytics = new GA4Analytics(env);

        const clientId = request.headers.get('x-client-id') || eventData.client_id || 'anonymous';

        await analytics.trackEvent({
            name: eventData.name,
            params: eventData.params || {}
        }, clientId);

        return Response.json({ success: true, message: 'Event tracked' });
    } catch (error: any) {
        console.error('Track event error:', error);
        return Response.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// KPIs handler - Real metrics from D1
async function handleKPIs(request: Request, env: Env): Promise<Response> {
    try {
        const { AnalyticsAggregator } = await import('../services/analytics-aggregator');
        const aggregator = new AnalyticsAggregator(env);
        
        // Get last 30 days metrics
        const dailyMetrics = await aggregator.getDailyMetrics(30);
        
        // Calculate totals
        const totalRevenue = dailyMetrics.reduce((sum, d) => sum + d.revenue, 0);
        const totalOrders = dailyMetrics.reduce((sum, d) => sum + (d.orders || 0), 0);
        const totalViews = dailyMetrics.reduce((sum, d) => sum + d.total_views, 0);
        
        // Calculate Average Order Value
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
        
        // Estimate conversion rate
        const totalClicks = dailyMetrics.reduce((sum, d) => sum + d.product_clicks, 0);
        const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100) : 0;

        // Get total products count separately
        const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL').first() as any;
        const totalProducts = results?.count || 0;

        const kpis = {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            totalOrders,
            averageOrderValue: Number(avgOrderValue.toFixed(2)),
            totalProducts,
            conversionRate: Number(conversionRate.toFixed(2)),
            growthRate: 0 // To be implemented with Month-over-Month comparison
        };

        return Response.json(kpis);
    } catch (error) {
        console.error('KPIs error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Revenue trend handler - Real 6 month data
async function handleRevenueTrend(request: Request, env: Env): Promise<Response> {
    try {
        const { AnalyticsAggregator } = await import('../services/analytics-aggregator');
        const aggregator = new AnalyticsAggregator(env);
        
        // Get 6 months (180 days)
        const dailyMetrics = await aggregator.getDailyMetrics(180);
        
        // Group by month
        const monthlyData = new Map<string, number>();
        
        dailyMetrics.forEach(day => {
            const month = day.date.substring(0, 7); // YYYY-MM
            const current = monthlyData.get(month) || 0;
            monthlyData.set(month, current + day.revenue);
        });
        
        const trend = Array.from(monthlyData.entries())
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months

        return Response.json({ data: trend });
    } catch (error) {
        console.error('Revenue trend error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Category stats handler
async function handleCategoryStats(request: Request, env: Env): Promise<Response> {
    try {
        const { AnalyticsAggregator } = await import('../services/analytics-aggregator');
        const aggregator = new AnalyticsAggregator(env);
        
        const stats = await aggregator.getCategoryPerformance();
        
        const formatted = stats.map((cat: any) => ({
            name: cat.category || 'Uncategorized',
            revenue: cat.revenue,
            percentage: 0 // Calculated on frontend or here if needed
        })).slice(0, 5);

        return Response.json({ data: formatted });
    } catch (error) {
        console.error('Category stats error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Recent events handler
async function handleRecentEvents(request: Request, env: Env): Promise<Response> {
    try {
        const { AnalyticsAggregator } = await import('../services/analytics-aggregator');
        const aggregator = new AnalyticsAggregator(env);
        
        const realtime = await aggregator.getRealtimeStats();
        // Return realtime stats structure
        return Response.json({ data: realtime }); 
        // Note: Dashboard expects array of events or specific structure. 
        // Adapting to keep compatible with dashboard logic if possible.
    } catch (error) {
        console.error('Recent events error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Sync History Handler (Replaces Populate Sample)
async function handleSyncHistory(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as any;
        const days = body.days || 180; // Default 6 months
        const hours = days * 24;

        console.log(`Starting historical sync for ${days} days (${hours} hours)...`);

        const { OrderSync } = await import('../services/order-sync');
        const orderSync = new OrderSync(env);
        
        // Use waitUntil if available to run in background
        // env.ctx.waitUntil(orderSync.syncRecentOrders(hours)); 
        // Cannot access ctx here easily as it is passed in main handler. 
        // Assuming user waits or we trigger basic sync.
        
        await orderSync.syncRecentOrders(Math.min(hours, 720)); // Limit to 30 days per request to avoid timeout
        
        return Response.json({
            message: 'Historical sync started/completed',
            days_synced: Math.min(days, 30),
            note: 'Limited to 30 days per request to prevent timeout. Call repeatedly for more history.'
        });
    } catch (error) {
        console.error('Sync history error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Test handler for direct IdoSell debugging
async function testIdoSell(env: Env): Promise<Response> {
    const shopUrl = env.IDOSELL_SHOP_URL || 'https://meblepumo.iai-shop.com';
    const apiKey = env.IDOSELL_API_KEY || env.PUMO_API_KEY;
    
    if (!apiKey) {
        return Response.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const url = `${shopUrl}/api/admin/v3/orders/orders?page=1&per_page=1`;
    console.log(`Testing IdoSell: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const text = await res.text();
        console.log(`IdoSell Status: ${res.status}`);
        
        return new Response(text, { 
            status: res.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
    }
}

// Bot Tracking Handler
async function handleBotTrack(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as any;
        const userAgent = body.userAgent || request.headers.get('User-Agent') || 'unknown';
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const path = body.path || 'unknown';

        // Simple Bot Detection/Classification
        let botType = 'other';
        const ua = userAgent.toLowerCase();
        if (ua.includes('gpt') || ua.includes('openai')) botType = 'gpt';
        else if (ua.includes('claude') || ua.includes('anthropic')) botType = 'claude';
        else if (ua.includes('google') || ua.includes('gemini') || ua.includes('vertex')) botType = 'google';
        else if (ua.includes('bing') || ua.includes('msnbot')) botType = 'bing';
        else if (ua.includes('facebook') || ua.includes('meta')) botType = 'meta';
        else if (ua.includes('applebot')) botType = 'apple';
        
        await env.DB.prepare(
            `INSERT INTO bot_logs (user_agent, ip_address, path, method, headers, is_known_bot, bot_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            userAgent,
            ip,
            path,
            request.method,
            JSON.stringify(body.headers || {}),
            botType !== 'other' ? 1 : 0,
            botType
        ).run();

        return Response.json({ success: true, botType });
    } catch (e) {
        console.error('Bot track error:', e);
        // Be silent about errors to not alert bots too much, or return 200 anyway
        return Response.json({ success: false, error: String(e) });
    }
}

// Bot Stats Handler (Read)
async function handleBotStats(request: Request, env: Env): Promise<Response> {
    try {
        // Get total hits
        const total = await env.DB.prepare('SELECT COUNT(*) as count FROM bot_logs').first() as any;
        
        // Get hits by bot type
        const { results: byType } = await env.DB.prepare(
            'SELECT bot_type, COUNT(*) as count FROM bot_logs GROUP BY bot_type ORDER BY count DESC'
        ).all();

        // Get recent logs
        const { results: recent } = await env.DB.prepare(
            'SELECT * FROM bot_logs ORDER BY timestamp DESC LIMIT 10'
        ).all();

        // Get hits over time (Group by day for last 14 days)
        const { results: history } = await env.DB.prepare(`
            SELECT substr(timestamp, 1, 10) as day, COUNT(*) as count 
            FROM bot_logs 
            WHERE timestamp >= date('now', '-14 days')
            GROUP BY day 
            ORDER BY day ASC
        `).all();

        return Response.json({
            summary: {
                total_hits: total.count,
                unique_bots_24h: 0 
            },
            by_type: byType,
            recent_logs: recent,
            history: history
        });
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 });
    }
}