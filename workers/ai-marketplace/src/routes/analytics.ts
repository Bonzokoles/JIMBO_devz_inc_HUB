import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  DB: D1Database;
};

const router = new Hono<{ Bindings: Bindings }>();

// GET /analytics/summary - User dashboard summary
router.get('/summary', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const user = await c.env.DB.prepare(
      'SELECT monthly_budget, spent_this_month FROM users WHERE id = ?'
    ).bind(userId).first();

    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        SUM(actual_cost) as total_spent,
        AVG(quality_score) as avg_quality,
        AVG(execution_time) as avg_time
      FROM tasks WHERE user_id = ? AND created_at > datetime('now', '-30 days')
    `).bind(userId).first();

    return c.json({
      monthlyBudget: user.monthly_budget,
      spent: user.spent_this_month,
      remaining: user.monthly_budget - user.spent_this_month,
      percentUsed: (user.spent_this_month / user.monthly_budget * 100).toFixed(1),
      stats: {
        totalTasks: stats.total_tasks || 0,
        completedTasks: stats.completed_tasks || 0,
        totalSpent: stats.total_spent || 0,
        avgQuality: (stats.avg_quality || 0).toFixed(1),
        avgTime: stats.avg_time || 0,
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// GET /analytics/costs - Cost breakdown by model
router.get('/costs', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const costs = await c.env.DB.prepare(`
      SELECT 
        model_name,
        COUNT(*) as count,
        SUM(tokens_used) as tokens,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost
      FROM cost_transactions
      WHERE user_id = ? AND created_at > datetime('now', '-30 days')
      GROUP BY model_name
      ORDER BY total_cost DESC
    `).bind(userId).all();

    return c.json({ breakdown: costs.results });
  } catch (err) {
    return c.json({ error: 'Failed to fetch cost breakdown' }, 500);
  }
});

// GET /analytics/hourly - Costs per hour
router.get('/hourly', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const hourly = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        COUNT(*) as tasks,
        SUM(cost) as cost
      FROM cost_transactions
      WHERE user_id = ? AND created_at > datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour
    `).bind(userId).all();

    return c.json({ hourly: hourly.results });
  } catch (err) {
    return c.json({ error: 'Failed to fetch hourly data' }, 500);
  }
});

// GET /analytics/quality - Quality ratings
router.get('/quality', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const ratings = await c.env.DB.prepare(`
      SELECT 
        qr.user_rating,
        COUNT(*) as count
      FROM quality_ratings qr
      JOIN tasks t ON qr.task_id = t.id
      WHERE t.user_id = ?
      GROUP BY qr.user_rating
    `).bind(userId).all();

    const avgRating = await c.env.DB.prepare(`
      SELECT AVG(user_rating) as avg FROM quality_ratings qr
      JOIN tasks t ON qr.task_id = t.id
      WHERE t.user_id = ?
    `).bind(userId).first();

    return c.json({
      distribution: ratings.results,
      average: avgRating.avg || 0
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch quality data' }, 500);
  }
});

export default router;
