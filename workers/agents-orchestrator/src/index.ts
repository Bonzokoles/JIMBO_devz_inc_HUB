/**
 * Agents Orchestrator - Cloudflare Worker
 *
 * Inteligentny koordynator dla 18 agentów AI
 * Używa OpenRouter (DeepSeek R1) do analizy zadań i delegacji
 */

interface Env {
  OPENROUTER_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  AGENTS_API_BASE: string; // URL backendu z agentami
  AGENT_STATE?: KVNamespace; // Optional KV
  NGROK_PROXY_URL?: string; // Ngrok AI Gateway proxy
  JIMBO_API_KEY?: string; // Auth for ngrok proxy
}

interface AgentTask {
  agentId: string;
  action: string;
  data: any;
  priority: number;
}

interface OrchestrationResult {
  taskId: string;
  plan: AgentTask[];
  results: any[];
  execution_time: number;
  model_used: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // Main orchestration endpoint
      if (url.pathname === "/orchestrate" && request.method === "POST") {
        return await handleOrchestrate(request, env);
      }

      // Health check
      if (url.pathname === "/health") {
        return Response.json({
          status: "healthy",
          orchestrator: "online",
          model: "deepseek/deepseek-r1",
          agents: 18,
        });
      }

      // Get task status
      if (url.pathname.startsWith("/task/")) {
        const taskId = url.pathname.split("/")[2];
        const status = await env.AGENT_STATE?.get(`task:${taskId}`, "json");
        return Response.json(status || { error: "Task not found" });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (error: any) {
      return Response.json(
        {
          error: error?.message || String(error),
          stack: error?.stack,
        },
        { status: 500 },
      );
    }
  },
};

/**
 * Main orchestration handler
 */
async function handleOrchestrate(
  request: Request,
  env: Env,
): Promise<Response> {
  const startTime = Date.now();
  const body: any = await request.json();
  const { query, context = {}, model = "deepseek/deepseek-r1" } = body;

  if (!query) {
    return Response.json({ error: "Query required" }, { status: 400 });
  }

  const taskId = crypto.randomUUID();

  // Step 1: Analyze task with AI (OpenRouter/DeepSeek)
  console.log(`[${taskId}] Analyzing task: ${query}`);
  const plan = await analyzeAndPlan(query, context, model, env);

  // Store task status
  await env.AGENT_STATE?.put(
    `task:${taskId}`,
    JSON.stringify({
      taskId,
      query,
      plan,
      status: "executing",
      started_at: new Date().toISOString(),
    }),
    { expirationTtl: 3600 },
  ); // 1 hour TTL

  // Step 2: Execute plan (parallel execution where possible)
  console.log(`[${taskId}] Executing ${plan.tasks.length} tasks`);
  const results = await executePlan(plan, env, taskId);

  // Step 3: Aggregate results with AI
  console.log(`[${taskId}] Aggregating results`);
  const finalResult = await aggregateResults(query, results, model, env);

  const executionTime = Date.now() - startTime;

  // Update task status
  await env.AGENT_STATE?.put(
    `task:${taskId}`,
    JSON.stringify({
      taskId,
      query,
      plan,
      results,
      finalResult,
      status: "completed",
      execution_time: executionTime,
      completed_at: new Date().toISOString(),
    }),
    { expirationTtl: 3600 },
  );

  return Response.json({
    taskId,
    query,
    plan: plan.tasks,
    results,
    answer: finalResult,
    execution_time: executionTime,
    model_used: model,
  });
}

/**
 * Analyze user query and create execution plan using AI
 */
async function analyzeAndPlan(
  query: string,
  context: any,
  model: string,
  env: Env,
): Promise<{ reasoning: string; tasks: AgentTask[] }> {
  const systemPrompt = `You are an AI orchestrator managing 18 specialized agents. Analyze the user's request and create an execution plan.

Available Agents:
1. research-agent (6062): web search, trends analysis, data mining
2. writer-agent (6030): content creation, SEO writing, proofreading
3. seo-agent (6031): keyword research, on-page SEO, backlink analysis, competitor analysis
4. finance-agent (6040): financial analysis, budgeting, forecasting, reporting
5. graphics-agent (6050): image generation, editing, thumbnails, design
6. market-research-agent (6070): market analysis, surveys, competitive intelligence
7. company-analysis-agent (6071): company profiling, financial health, SWOT, valuation
8. planner-agent (6080): scheduling, task management, resource allocation
9. file-manager (6100): file operations, search, organization
10. database-query (6101): SQL queries, data retrieval
11. content-guardian (6102): content moderation, compliance checks
12. marketing-maestro (6103): marketing campaigns, analytics
13. webmaster (6104): website management, SEO monitoring
14. social-media (6105): social media management, posting
15. email-handler (6106): email sending, validation
16. web-crawler (6107): web scraping, data extraction
17. code-reviewer (6108): code analysis, quality checks
18. data-analyst (6109): data analysis, visualization

Respond in JSON format:
{
  "reasoning": "Why these agents are needed and execution order",
  "tasks": [
    {
      "agentId": "research-agent",
      "action": "search",
      "data": { "query": "..." },
      "priority": 1
    }
  ]
}

Priority: 1 = highest (execute first), 2 = medium, 3 = low (execute last)
Tasks with same priority can run in parallel.`;

  const userPrompt = `User Request: ${query}\n\nContext: ${JSON.stringify(context)}`;

  const response = await callAI(systemPrompt, userPrompt, model, env);

  try {
    // Extract JSON from markdown code blocks if present
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Fallback: simple task routing
    return {
      reasoning: "Fallback to research agent",
      tasks: [
        {
          agentId: "research-agent",
          action: "search",
          data: { query },
          priority: 1,
        },
      ],
    };
  }
}

/**
 * Execute the plan by calling agents
 */
async function executePlan(
  plan: { tasks: AgentTask[] },
  env: Env,
  taskId: string,
): Promise<any[]> {
  // Group tasks by priority
  const tasksByPriority = plan.tasks.reduce(
    (acc, task) => {
      if (!acc[task.priority]) acc[task.priority] = [];
      acc[task.priority].push(task);
      return acc;
    },
    {} as Record<number, AgentTask[]>,
  );

  const allResults: any[] = [];
  const priorities = Object.keys(tasksByPriority).map(Number).sort();

  // Execute tasks in priority order
  for (const priority of priorities) {
    const tasks = tasksByPriority[priority];
    console.log(
      `[${taskId}] Executing ${tasks.length} tasks at priority ${priority}`,
    );

    // Execute tasks with same priority in parallel
    const results = await Promise.allSettled(
      tasks.map((task) => executeAgentTask(task, env, taskId)),
    );

    // Collect results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const task = tasks[i];

      if (result.status === "fulfilled") {
        allResults.push({
          agentId: task.agentId,
          action: task.action,
          success: true,
          data: result.value,
        });
      } else {
        allResults.push({
          agentId: task.agentId,
          action: task.action,
          success: false,
          error: result.reason.message,
        });
      }
    }
  }

  return allResults;
}

/**
 * Execute single agent task
 */
async function executeAgentTask(
  task: AgentTask,
  env: Env,
  taskId: string,
): Promise<any> {
  const apiBase = env.AGENTS_API_BASE || "http://localhost:8001";
  const url = `${apiBase}/api/agents/execute/${task.agentId}`;

  console.log(`[${taskId}] Calling ${task.agentId}: ${task.action}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: task.action,
      data: task.data,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agent ${task.agentId} failed: ${error}`);
  }

  return await response.json();
}

/**
 * Aggregate results using AI
 */
async function aggregateResults(
  query: string,
  results: any[],
  model: string,
  env: Env,
): Promise<string> {
  const systemPrompt = `You are aggregating results from multiple AI agents to answer the user's question.
Synthesize the information into a clear, concise, and helpful response.
Use markdown formatting for better readability.`;

  const userPrompt = `Original Query: ${query}

Agent Results:
${JSON.stringify(results, null, 2)}

Provide a comprehensive answer to the user's question based on these results.`;

  return await callAI(systemPrompt, userPrompt, model, env);
}

/**
 * Call OpenRouter or DeepSeek API
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  env: Env,
): Promise<string> {
  // Use Ngrok AI Gateway proxy with multi-provider failover (DeepSeek → Claude → GPT-4)
  // Falls back to direct OpenRouter if proxy not configured
  const useNgrokProxy = env.NGROK_PROXY_URL && env.JIMBO_API_KEY;
  const apiUrl = useNgrokProxy
    ? `${env.NGROK_PROXY_URL}/api/chat`
    : "https://openrouter.ai/api/v1/chat/completions";

  const apiKey = useNgrokProxy ? env.JIMBO_API_KEY : env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      useNgrokProxy
        ? "JIMBO_API_KEY not configured"
        : "OPENROUTER_API_KEY not configured",
    );
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(useNgrokProxy
        ? {}
        : {
            "HTTP-Referer": "https://jimbo77.com",
            "X-Title": "Jimbo77 Agents Orchestrator",
          }),
    },
    body: JSON.stringify({
      model: model, // e.g., 'deepseek/deepseek-r1' or 'anthropic/claude-3.5-sonnet'
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    const source = useNgrokProxy ? "Ngrok Proxy" : "OpenRouter";
    throw new Error(`${source} API error: ${error}`);
  }

  const data: any = await response.json();

  // Log provider info if using ngrok proxy
  if (useNgrokProxy) {
    const provider = response.headers.get("X-Provider");
    if (provider) {
      console.log(`[Ngrok Proxy] Request served by provider: ${provider}`);
    }
  }
  return data.choices[0].message.content;
}
