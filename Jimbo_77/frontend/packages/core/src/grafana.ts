export function grafanaExploreLokiUrl(opts: {
  grafanaBase: string;
  host: string;
  needle: string; // np. container name / target
  timeRangeMs?: number; // default 30m
}) {
  const base = opts.grafanaBase.replace(/\/+$/, "");
  const range = opts.timeRangeMs ?? 30 * 60 * 1000;
  const to = Date.now();
  const from = to - range;

  // Loki query: filtr po host label i tekstowe dopasowanie do kontenera/target
  // {job="docker",host="pumo-1"} |= "pumo-api"
  const expr = `{job="docker",host="${opts.host}"} |= "${opts.needle}"`;

  const left = {
    datasource: "Loki",
    queries: [{ expr, refId: "A" }],
    range: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
  };

  const encoded = encodeURIComponent(JSON.stringify(left));
  return `${base}/explore?left=${encoded}`;
}
