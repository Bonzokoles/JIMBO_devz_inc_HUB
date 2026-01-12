/**
 * PUMO WHITECAT Worker - Modular Entry Point
 * New modular architecture with proper separation of concerns
 * Version: 2.0.0 (Refactored from 85,637 line monolith)
 */

import { handleRequest } from './handlers/router';

// Main request handler - delegates to modular router
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return handleRequest(request, env, ctx);
    },

    // Queue consumer
    async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
        for (const message of batch.messages) {
            try {
                console.log('Processing queue message:', message.body);
                // Queue processing logic can be added here
                message.ack();
            } catch (error) {
                console.error('Queue processing error:', error);
                message.retry();
            }
        }
    },

    // Scheduled tasks (cron)
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log('Scheduled event triggered:', event.cron);

        switch (event.cron) {
            case '0 */6 * * *': // Every 6 hours
                console.log('Running scheduled analytics aggregation');
                break;
            default:
                console.log('Unknown scheduled event');
        }
    }
};

// Environment interface
interface Env {
    DB: D1Database;
    PUMO_CACHE: KVNamespace;
    AI: Ai;
    VECTORIZE_INDEX: VectorizeIndex;
    MEDIA_BUCKET: R2Bucket;
    IMAGE_QUEUE: Queue;
}