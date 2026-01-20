import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import modelsRoutes from './routes/models';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: 'production' | 'staging' | 'development';
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  MISTRAL_API_KEY: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use(logger());
app.use(cors({
  origin: ['http://localhost:3000', 'https://marketplace.example.com'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date() });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/models', modelsRoutes);

// Serve static frontend
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Marketplace</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message,
    ...(c.env.ENVIRONMENT !== 'production' && { stack: err.stack })
  }, 500);
});

export default app;
