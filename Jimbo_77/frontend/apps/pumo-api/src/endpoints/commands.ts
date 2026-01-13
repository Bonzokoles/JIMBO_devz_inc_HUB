import { Env } from '../types';
import { errorResponse, corsHeaders } from '../utils';

export async function handleCommands(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/commands', '');
    const method = request.method;

    // GET /pending (poll for new commands)
    if (method === 'GET' && path === '/pending') {
        const stmt = env.DB.prepare(`
            SELECT * FROM commands 
            WHERE status = 'queued' 
            ORDER BY created_at ASC 
            LIMIT 1
        `);
        const result = await stmt.first();
        
        if (!result) return Response.json(null, { headers: corsHeaders });
        
        return Response.json(result, { headers: corsHeaders });
    }

    // POST / (create command)
    if (method === 'POST' && (path === '' || path === '/')) {
        try {
            const body = await request.json() as any;
            const id = crypto.randomUUID();
            const { projectId, action, target, params, reason, createdBy } = body;

            // Basic validation
            if (!projectId || !action) {
                return errorResponse('Missing projectId or action', 400);
            }

            await env.DB.prepare(`
                INSERT INTO commands (id, project_id, action, target, params, reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, 
                projectId, 
                action, 
                target || null, 
                JSON.stringify(params || {}), 
                reason || null, 
                createdBy || 'system'
            ).run();

            return Response.json({ id, status: 'queued' }, { headers: corsHeaders });
        } catch (e: any) {
            return errorResponse(e.message, 500);
        }
    }

    // POST /:id/status (update status)
    if (method === 'POST' && path.match(/^\/[\w-]+\/status$/)) {
        const id = path.split('/')[1];
        try {
            const body = await request.json() as any;
            const { status, result } = body;

            if (!status) return errorResponse('Missing status', 400);

            await env.DB.prepare(`
                UPDATE commands 
                SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                status, 
                JSON.stringify(result || {}), 
                id
            ).run();

            return Response.json({ ok: true }, { headers: corsHeaders });
        } catch (e: any) {
            return errorResponse(e.message, 500);
        }
    }
    
    // GET /:id (check specific command)
    if (method === 'GET' && path.match(/^\/[\w-]+$/)) {
        const id = path.split('/')[1];
        const cmd = await env.DB.prepare('SELECT * FROM commands WHERE id = ?').bind(id).first();
        if (!cmd) return errorResponse('Command not found', 404);
        return Response.json(cmd, { headers: corsHeaders });
    }

    return errorResponse('Not found', 404);
}
