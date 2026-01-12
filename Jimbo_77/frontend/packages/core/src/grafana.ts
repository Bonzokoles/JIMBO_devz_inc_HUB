export function grafanaExploreLokiUrl(opts: {
  grafanaBase: string;
  host: string;
  container: string;
  timeRangeMs?: number;
  datasourceName?: string; // default: "Loki"
}) {
  const base = opts.grafanaBase.replace(/\/+$/, "");
  const range = opts.timeRangeMs ?? 60 * 60 * 1000; // 1h
  const to = Date.now();
  const from = to - range;

  const ds = opts.datasourceName ?? "Loki";
  const expr = `{job="docker",host="${opts.host}",container="${opts.container}"}`;

  const left = {
    datasource: ds,
    queries: [{ expr, refId: "A" }],
    range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
  };

  return `${base}/explore?left=${encodeURIComponent(JSON.stringify(left))}`;
}
