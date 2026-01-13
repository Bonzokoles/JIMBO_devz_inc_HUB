/**
 * AI Endpoints
 * Handles /api/ai/* routes including RAG and NLQ
 */

export async function handleAIAPI(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/ai/', '');

    try {
        switch (path) {
            case 'rag':
                if (request.method === 'POST') {
                    return await handleRAG(request, env);
                }
                break;
            
            case 'nlq':
                if (request.method === 'POST') {
                    return await handleNLQ(request, env);
                }
                break;

            case 'chat':
                if (request.method === 'POST') {
                    return await handleChat(request, env);
                }
                break;

            default:
                return Response.json({
                    error: 'AI endpoint not found',
                    available: ['rag', 'nlq', 'chat']
                }, { status: 404 });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('AI API error:', error);
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// RAG Handler - Retrieval Augmented Generation
async function handleRAG(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as any;
    const { query, topK = 5 } = body;

    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    try {
        // 1. Generate embeddings for query
        const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: [query]
        });
        const vector = embeddings.data[0];

        // 2. Search in Vectorize
        // Note: Check if VECTORIZE binding exists
        if (!env.VECTORIZE) {
            return Response.json({ 
                error: 'Vectorize binding (VECTORIZE) not found',
                mock_answer: 'RAG is ready but Vectorize binding is missing.' 
            }, { status: 503 });
        }

        const matches = await env.VECTORIZE.query(vector, { topK, returnMetadata: true });

        // 3. Generate Answer using LLM + Context
        const context = matches.matches.map(m => m.metadata?.text || '').join('\n---\n');
        
        const systemPrompt = `You are PUMO AI Assistant. Use the following context to answer the user's question. If you don't know, say so.`;
        
        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
            ]
        });

        return Response.json({
            answer: response.response,
            sources: matches.matches
        });

    } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
    }
}

// NLQ Handler - Natural Language to SQL
async function handleNLQ(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as any;
    const { query } = body;

    // Simple mock for now, can be expanded with schema awareness
    return Response.json({ 
        sql: "SELECT * FROM analytics_events WHERE timestamp > NOW() - INTERVAL '1 day'",
        explanation: "Selecting recent events (Mock response)" 
    });
}

// Simple Chat Handler
async function handleChat(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as any;
    const { messages } = body;

    if (!messages) return Response.json({ error: 'Messages required' }, { status: 400 });

    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages
    });

    return Response.json(response);
}
