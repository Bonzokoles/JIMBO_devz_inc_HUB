import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const router = new Hono<{ Bindings: Bindings }>();

// GET /models - List all available models and pricing
router.get('/', async (c) => {
  try {
    const models = await c.env.DB.prepare(
      'SELECT * FROM model_pricing WHERE active = 1 ORDER BY cost_per_1k_tokens ASC'
    ).all();

    return c.json({ models: models.results });
  } catch (err) {
    return c.json({ error: 'Failed to fetch models' }, 500);
  }
});

// GET /models/recommendations - Get model recommendations for task type
router.get('/recommendations/:taskType', async (c) => {
  const taskType = c.req.param('taskType');

  try {
    const template = await c.env.DB.prepare(
      'SELECT tiers_config FROM task_templates WHERE task_type = ?'
    ).bind(taskType).first();

    if (!template) {
      return c.json({ error: 'Task type not found' }, 404);
    }

    return c.json(JSON.parse(template.tiers_config));
  } catch (err) {
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

// GET /models/compare - Compare models for a task
router.get('/compare', async (c) => {
  const models = c.req.query('models')?.split(',') || [];
  
  try {
    const comparison = await c.env.DB.prepare(`
      SELECT * FROM model_pricing 
      WHERE model_name IN (${models.map(() => '?').join(',')})
    `).bind(...models).all();

    return c.json({ comparison: comparison.results });
  } catch (err) {
    return c.json({ error: 'Failed to compare models' }, 500);
  }
});

export default router;
