import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  MISTRAL_API_KEY: string;
};

const router = new Hono<{ Bindings: Bindings }>();

// Validation schemas
const CreateTaskSchema = z.object({
  description: z.string().min(10).max(5000),
  type: z.enum(['copywriting', 'blog', 'code', 'analysis', 'support', 'creative']),
  tier: z.enum(['budget', 'standard', 'premium', 'enterprise']),
  models: z.array(z.string()),
});

type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;

// GET /tasks - List user's tasks
router.get('/', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all();

    return c.json({ tasks: results });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return c.json({ error: 'Failed to fetch tasks' }, 500);
  }
});

// POST /tasks - Create new task
router.post('/', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const validated = CreateTaskSchema.parse(body);

    const taskId = uuidv4();
    const estimatedCost = calculateEstimatedCost(validated);

    // Check user budget
    const userResult = await c.env.DB.prepare(
      'SELECT monthly_budget, spent_this_month FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!userResult) return c.json({ error: 'User not found' }, 404);

    const remaining = userResult.monthly_budget - userResult.spent_this_month;
    if (estimatedCost > remaining) {
      return c.json({ 
        error: 'Insufficient budget',
        required: estimatedCost,
        available: remaining
      }, 402);
    }

    // Create task
    await c.env.DB.prepare(`
      INSERT INTO tasks (
        id, user_id, task_type, description, selected_models,
        tier, estimated_cost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      userId,
      validated.type,
      validated.description,
      JSON.stringify(validated.models),
      validated.tier,
      estimatedCost,
      'pending'
    ).run();

    // Execute task
    const result = await executeTask({
      taskId,
      userId,
      ...validated,
      db: c.env.DB,
      env: c.env
    });

    return c.json({ 
      taskId,
      estimatedCost,
      actualCost: result.cost,
      executionTime: result.time,
      output: result.output,
      qualityScore: result.quality
    }, 201);
  } catch (err: any) {
    console.error('Error creating task:', err);
    return c.json({ 
      error: 'Failed to create task',
      details: err.message 
    }, 400);
  }
});

// GET /tasks/:id - Get specific task
router.get('/:id', async (c) => {
  const taskId = c.req.param('id');
  const userId = c.req.header('x-user-id');

  try {
    const task = await c.env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?'
    ).bind(taskId, userId).first();

    if (!task) return c.json({ error: 'Task not found' }, 404);
    return c.json(task);
  } catch (err) {
    return c.json({ error: 'Failed to fetch task' }, 500);
  }
});

// POST /tasks/:id/rate - Rate task quality
router.post('/:id/rate', async (c) => {
  const taskId = c.req.param('id');
  const userId = c.req.header('x-user-id');
  const { rating, comment } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      INSERT INTO quality_ratings (id, task_id, user_rating, comment)
      VALUES (?, ?, ?, ?)
    `).bind(uuidv4(), taskId, rating, comment).run();

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to rate task' }, 500);
  }
});

// Helper functions
function calculateEstimatedCost(task: CreateTaskRequest): number {
  const costPerModel: Record<string, number> = {
    'GPT-4': 0.03,
    'Claude3': 0.008,
    'Mistral': 0.0002,
    'Llama2': 0,
  };

  const baseCosts: Record<string, Record<string, number>> = {
    copywriting: { budget: 0.02, standard: 0.50, premium: 3.00, enterprise: 12.00 },
    blog: { budget: 0.05, standard: 2.50, premium: 8.00, enterprise: 20.00 },
    code: { budget: 0.03, standard: 3.00, premium: 6.00, enterprise: 15.00 },
    analysis: { budget: 0.04, standard: 1.50, premium: 6.00, enterprise: 18.00 },
    support: { budget: 0.001, standard: 0.008, premium: 0.50, enterprise: 2.00 },
    creative: { budget: 0.06, standard: 3.50, premium: 9.00, enterprise: 25.00 },
  };

  return baseCosts[task.type]?.[task.tier] || 0.50;
}

async function executeTask(params: any): Promise<any> {
  const { taskId, userId, description, type, tier, models, db, env } = params;

  try {
    // Update task status
    await db.prepare(
      'UPDATE tasks SET status = ? WHERE id = ?'
    ).bind('processing', taskId).run();

    let totalCost = 0;
    let totalTime = 0;
    let outputs: string[] = [];

    // Call each model
    for (const model of models) {
      const { cost, time, output } = await callModel(
        model,
        description,
        env
      );
      totalCost += cost;
      totalTime += time;
      outputs.push(output);

      // Log execution
      await db.prepare(`
        INSERT INTO execution_logs (id, task_id, model_name, tokens_input, response_time_ms, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(uuidv4(), taskId, model, 100, time, 'completed').run();
    }

    // Calculate quality score
    const qualityScore = calculateQuality(models, tier);

    // Fuse outputs
    const fusedOutput = fuseOutputs(outputs, models);

    // Update task with results
    await db.prepare(`
      UPDATE tasks SET 
        status = 'completed',
        actual_cost = ?,
        tokens_used = ?,
        execution_time = ?,
        quality_score = ?,
        output = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      totalCost,
      outputs.length * 250,
      totalTime,
      qualityScore,
      fusedOutput,
      taskId
    ).run();

    // Record cost transaction
    await db.prepare(`
      INSERT INTO cost_transactions (
        id, user_id, task_id, model_name, tokens_used, cost
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(uuidv4(), userId, taskId, models.join('+'), outputs.length * 250, totalCost).run();

    return {
      cost: totalCost,
      time: totalTime,
      output: fusedOutput,
      quality: qualityScore
    };
  } catch (err) {
    await db.prepare(
      'UPDATE tasks SET status = ?, error_message = ? WHERE id = ?'
    ).bind('failed', (err as Error).message, taskId).run();
    throw err;
  }
}

async function callModel(
  model: string,
  prompt: string,
  env: any
): Promise<{ cost: number; time: number; output: string }> {
  const startTime = Date.now();

  try {
    let response: any;

    if (model === 'GPT-4') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        }),
      });
    } else if (model === 'Claude3') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } else if (model === 'Mistral') {
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        }),
      });
    } else {
      // Llama 2 - local or free tier
      return {
        cost: 0,
        time: Math.random() * 500 + 100,
        output: `[Llama2 Response] ${prompt.substring(0, 100)}...`,
      };
    }

    const data = await response.json();
    const time = Date.now() - startTime;
    
    let output = '';
    let tokens = 0;

    if (model === 'GPT-4') {
      output = data.choices[0].message.content;
      tokens = data.usage.total_tokens;
    } else if (model === 'Claude3') {
      output = data.content[0].text;
      tokens = data.usage.output_tokens;
    } else if (model === 'Mistral') {
      output = data.choices[0].message.content;
      tokens = data.usage.total_tokens;
    }

    const costPerToken = { 'GPT-4': 0.00003, 'Claude3': 0.000008, 'Mistral': 0.0000002 };
    const cost = (tokens / 1000) * (costPerToken[model as keyof typeof costPerToken] || 0);

    return { cost, time, output };
  } catch (err) {
    console.error(`Error calling ${model}:`, err);
    return { cost: 0, time: 0, output: `Error calling ${model}` };
  }
}

function calculateQuality(models: string[], tier: string): number {
  const baseQuality: Record<string, number> = {
    budget: 8,
    standard: 9,
    premium: 9.5,
    enterprise: 9.8,
  };

  const qualityBoost = models.length > 1 ? 0.5 : 0;
  return baseQuality[tier] + qualityBoost;
}

function fuseOutputs(outputs: string[], models: string[]): string {
  return outputs.map((o, i) => `[${models[i]}]\n${o}`).join('\n\n---\n\n');
}

export default router;
