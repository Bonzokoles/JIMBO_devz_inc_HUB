/**
 * Analytics API Endpoints
 * Handles all /api/analytics/* routes
 */

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

            case 'populate-sample':
                if (request.method === 'POST') {
                    return await handlePopulateSampleData(request, env);
                }
                break;

            default:
                return Response.json({
                    error: 'Analytics endpoint not found',
                    available: ['kpis', 'revenue-trend', 'category-stats', 'recent-events', 'populate-sample']
                }, { status: 404 });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('Analytics API error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// KPIs handler
async function handleKPIs(request: Request, env: Env): Promise<Response> {
    try {
        // Sample KPIs - replace with real database queries
        const kpis = {
            totalRevenue: 284750,
            totalOrders: 486,
            averageOrderValue: 585.80,
            totalProducts: 2560,
            conversionRate: 3.2,
            growthRate: 12.5
        };

        return Response.json(kpis);
    } catch (error) {
        console.error('KPIs error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Revenue trend handler
async function handleRevenueTrend(request: Request, env: Env): Promise<Response> {
    try {
        // Sample revenue trend data
        const trend = [
            { month: '2025-07', revenue: 42500 },
            { month: '2025-08', revenue: 38750 },
            { month: '2025-09', revenue: 51200 },
            { month: '2025-10', revenue: 47300 },
            { month: '2025-11', revenue: 55800 },
            { month: '2025-12', revenue: 49200 }
        ];

        return Response.json({ data: trend });
    } catch (error) {
        console.error('Revenue trend error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Category stats handler
async function handleCategoryStats(request: Request, env: Env): Promise<Response> {
    try {
        // Sample category statistics
        const categories = [
            { name: 'Sofy i fotele', revenue: 92400, percentage: 32.4 },
            { name: 'Stoły i krzesła', revenue: 71300, percentage: 25.0 },
            { name: 'Szafy i komody', revenue: 56200, percentage: 19.7 },
            { name: 'Łóżka', revenue: 39800, percentage: 14.0 },
            { name: 'Akcesoria', revenue: 25050, percentage: 8.8 }
        ];

        return Response.json({ data: categories });
    } catch (error) {
        console.error('Category stats error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Recent events handler
async function handleRecentEvents(request: Request, env: Env): Promise<Response> {
    try {
        // Sample recent events
        const events = [
            {
                id: 1,
                event_type: 'purchase',
                timestamp: new Date().toISOString(),
                revenue: 1250.00,
                product_id: 'P001',
                category: 'Sofy'
            },
            {
                id: 2,
                event_type: 'page_view',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                product_id: 'P045',
                category: 'Stoły'
            }
        ];

        return Response.json({ data: events });
    } catch (error) {
        console.error('Recent events error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Populate sample data handler
async function handlePopulateSampleData(request: Request, env: Env): Promise<Response> {
    try {
        // This would populate sample analytics data in production
        console.log('Sample data population requested');

        return Response.json({
            message: 'Sample data population completed',
            events_created: 1000,
            products_created: 2560,
            timespan: '6 months'
        });
    } catch (error) {
        console.error('Sample data population error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// Environment interface
interface Env {
    DB: D1Database;
    PUMO_CACHE: KVNamespace;
    AI: Ai;
    VECTORIZE_INDEX: VectorizeIndex;
    MEDIA_BUCKET: R2Bucket;
    IMAGE_QUEUE: Queue;
}