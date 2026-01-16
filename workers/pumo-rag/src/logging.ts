/**
 * Query Logging System
 * Logs all queries to KV for analytics and debugging
 * Retention: 30 days
 */

export interface QueryLog {
  query: string;
  answer?: string;
  sources: number;
  confidence: number;
  source: "blog" | "agent";
  timestamp: number;
}

/**
 * Log a query to KV namespace
 * Key format: log:{timestamp}:{random}
 */
export async function logQuery(kv: KVNamespace, log: QueryLog): Promise<void> {
  try {
    const key = `log:${log.timestamp}:${Math.random().toString(36).substr(2, 9)}`;

    await kv.put(key, JSON.stringify(log), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (error) {
    console.error("Failed to log query:", error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

/**
 * Get recent logs (for stats endpoint)
 */
export async function getRecentLogs(
  kv: KVNamespace,
  limit: number = 100,
): Promise<QueryLog[]> {
  try {
    const list = await kv.list({
      prefix: "log:",
      limit,
    });

    const logs: QueryLog[] = [];
    for (const key of list.keys) {
      const value = await kv.get(key.name);
      if (value) {
        logs.push(JSON.parse(value));
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to retrieve logs:", error);
    return [];
  }
}
