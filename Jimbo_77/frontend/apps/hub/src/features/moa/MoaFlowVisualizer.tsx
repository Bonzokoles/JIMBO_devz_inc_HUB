/**
 * MoE-RAG Search Component
 * Integrated search interface with routing visualization
 *
 * Features:
 * - Query input with suggestions
 * - Real-time routing decision (Fast/Expert/Hybrid)
 * - Response display with metrics
 * - Latency & cost tracking
 * - Source attribution
 * - Loading states & error handling
 */

import { useState, useRef, useEffect } from "react";

// Inline styles for dashboard compatibility
const styles = {
  container: "h-full bg-gray-950 text-white p-6 overflow-auto",
  header: "mb-8",
  subtitle: "text-gray-400",
  searchForm: "mb-6",
  inputWrapper: "flex gap-4",
  input:
    "flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400",
  submitButton:
    "px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed",
  suggestions: "flex gap-2 flex-wrap mb-4",
  suggestionButton:
    "px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700",
  history: "mb-6",
  historyButton:
    "mr-2 mb-2 px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700",
  error: "p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 mb-4",
  resultContainer:
    "bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6",
  routingInfo: "flex items-center gap-4 flex-wrap",
  routingBadge: "px-4 py-2 rounded-lg font-bold text-white",
  routingLabel: "text-gray-400",
  confidenceScore: "text-2xl font-bold",
  response: "border-l-4 border-yellow-400 pl-4",
  responseText: "text-lg leading-relaxed",
  confidenceSection: "space-y-2",
  confidenceHeader: "flex justify-between text-sm",
  confidenceBar: "h-2 bg-gray-800 rounded-full overflow-hidden",
  confidenceFill: "h-full transition-all duration-300",
  metricsGrid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4",
  metricCard: "bg-gray-800 p-4 rounded-lg",
  metricLabel: "block text-gray-400 text-sm mb-1",
  metricValue: "block text-xl font-bold",
  sources: "space-y-2",
  agents: "space-y-2",
  agentsList: "flex flex-wrap gap-2",
  agentBadge: "px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm",
  debugToggle: "px-4 py-2 bg-gray-800 rounded hover:bg-gray-700",
  debugInfo: "mt-4 bg-gray-800 p-4 rounded-lg",
  debugContent: "space-y-4",
  debugSection: "space-y-2",
  signalsTable: "w-full text-sm",
  newSearchButton:
    "px-6 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300",
  loading: "flex flex-col items-center justify-center py-12",
  spinner:
    "w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin",
  footer:
    "mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500 space-x-2",
};

// ============================================================================
// TYPES
// ============================================================================

interface MoERAGResponse {
  response: string;
  confidence: number;
  agents_used: string[];
  routing_path: "fast" | "expert" | "hybrid";
  latency_ms: number;
  tokens_used: { [key: string]: number };
  cost_usd: number;
  sources: string[];
  cache_hit: boolean;
  metadata: {
    routing_confidence: number;
    agents_count: number;
    documents_retrieved: number;
    indices_queried: string[];
  };
}

interface DebugInfo {
  query: string;
  decision: string;
  confidence: number;
  signals: { [key: string]: number };
  scores: {
    fast: number;
    expert: number;
    hybrid: number;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

const MoaFlowVisualizer: React.FC = () => {
  // State
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MoERAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE = "http://localhost:3885";
  const API_ENDPOINT = `${API_BASE}/api/moe-rag`;

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("moe-rag-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save to history
  const addToHistory = (q: string) => {
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("moe-rag-history", JSON.stringify(updated));
  };

  // Fetch debug info
  const fetchDebugInfo = async (q: string) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      }
    } catch (err) {
      console.error("Debug fetch failed:", err);
    }
  };

  // Main query handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch debug info first
      await fetchDebugInfo(query);

      // Main query
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          user_id: "user-" + Math.random().toString(36).substr(2, 9),
          session_id: "session-" + Date.now(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.[0]?.msg ||
            errorData.detail ||
            `HTTP ${response.status}`,
        );
      }

      const data: MoERAGResponse = await response.json();
      setResult(data);
      addToHistory(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Routing path badge color
  const getPathColor = (path: string): string => {
    switch (path) {
      case "fast":
        return "#22c55e"; // green
      case "expert":
        return "#3b82f6"; // blue
      case "hybrid":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  // Confidence bar color
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return "#22c55e";
    if (conf >= 0.6) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>🤖 MoE-RAG Search</h1>
        <p className={styles.subtitle}>
          Intelligent routing across FAQ, Technical, and Domain knowledge
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask anything... (e.g., 'What is the price of the ergonomic chair?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={styles.submitButton}
          >
            {isLoading ? "⏳ Searching..." : "🔍 Search"}
          </button>
        </div>

        {/* Quick suggestions */}
        {!result && (
          <div className={styles.suggestions}>
            {[
              "What is the price of the ergonomic chair?",
              "What is MoE-RAG?",
              "Design a scalable architecture",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.suggestionButton}
                onClick={() => {
                  setQuery(suggestion);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Search History */}
      {history.length > 0 && !result && (
        <div className={styles.history}>
          <h3>📚 Recent Searches</h3>
          <ul>
            {history.map((item) => (
              <li key={item}>
                <button
                  onClick={() => setQuery(item)}
                  className={styles.historyButton}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <h3>❌ Error</h3>
          <p>{error}</p>
          <details>
            <summary>Troubleshoot</summary>
            <ul>
              <li>
                Is API running? Check:{" "}
                <a
                  href={`${API_BASE}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Swagger UI
                </a>
              </li>
              <li>
                Try health check:{" "}
                <a
                  href={`${API_BASE}/api/moe-rag/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Health
                </a>
              </li>
              <li>Check browser console for CORS errors</li>
            </ul>
          </details>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={styles.resultContainer}>
          {/* Routing Info */}
          <div className={styles.routingInfo}>
            <div
              className={styles.routingBadge}
              style={{ borderColor: getPathColor(result.routing_path) }}
            >
              <span className={styles.routingLabel}>
                {result.routing_path === "fast"
                  ? "⚡"
                  : result.routing_path === "expert"
                    ? "🧠"
                    : "⚖️"}
                {result.routing_path.toUpperCase()}
              </span>
              <span className={styles.confidenceScore}>
                {(result.metadata.routing_confidence * 100).toFixed(0)}%
                confidence
              </span>
            </div>
          </div>

          {/* Main Response */}
          <div className={styles.response}>
            <h2>Response</h2>
            <p className={styles.responseText}>{result.response}</p>
          </div>

          {/* Confidence Bar */}
          <div className={styles.confidenceSection}>
            <div className={styles.confidenceHeader}>
              <label>Answer Confidence</label>
              <span>{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className={styles.confidenceBar}>
              <div
                className={styles.confidenceFill}
                style={{
                  width: `${result.confidence * 100}%`,
                  backgroundColor: getConfidenceColor(result.confidence),
                }}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>⏱️ Latency</span>
              <span className={styles.metricValue}>{result.latency_ms}ms</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>💰 Cost</span>
              <span className={styles.metricValue}>
                ${result.cost_usd.toFixed(4)}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>🤖 Agents Used</span>
              <span className={styles.metricValue}>
                {result.metadata.agents_count}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>📄 Documents</span>
              <span className={styles.metricValue}>
                {result.metadata.documents_retrieved}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>💾 Cache</span>
              <span className={styles.metricValue}>
                {result.cache_hit ? "✅ HIT" : "❌ MISS"}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>🔤 Tokens</span>
              <span className={styles.metricValue}>
                {Object.values(result.tokens_used).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className={styles.sources}>
              <h3>📚 Sources</h3>
              <ul>
                {result.sources.map((source, i) => (
                  <li key={i}>{source}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Agents Used */}
          {result.agents_used.length > 0 && (
            <div className={styles.agents}>
              <h3>🤖 Agents Used</h3>
              <div className={styles.agentsList}>
                {result.agents_used.map((agent) => (
                  <span key={agent} className={styles.agentBadge}>
                    {agent}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Debug Toggle */}
          <button
            className={styles.debugToggle}
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "🙈 Hide Debug Info" : "👁️ Show Debug Info"}
          </button>

          {/* Debug Info */}
          {showDebug && debugInfo && (
            <div className={styles.debugInfo}>
              <h3>🔧 Debug Information</h3>
              <div className={styles.debugContent}>
                <div className={styles.debugSection}>
                  <h4>Routing Decision</h4>
                  <p>
                    <strong>Path:</strong> {debugInfo.decision}
                  </p>
                  <p>
                    <strong>Confidence:</strong>{" "}
                    {(debugInfo.confidence * 100).toFixed(1)}%
                  </p>
                  <p>
                    <strong>Scores:</strong>
                  </p>
                  <ul>
                    <li>Fast: {(debugInfo.scores.fast * 100).toFixed(1)}%</li>
                    <li>
                      Expert: {(debugInfo.scores.expert * 100).toFixed(1)}%
                    </li>
                    <li>
                      Hybrid: {(debugInfo.scores.hybrid * 100).toFixed(1)}%
                    </li>
                  </ul>
                </div>
                <div className={styles.debugSection}>
                  <h4>Signal Extraction</h4>
                  <table className={styles.signalsTable}>
                    <tbody>
                      {Object.entries(debugInfo.signals).map(([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{(value * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* New Search Button */}
          <button
            className={styles.newSearchButton}
            onClick={() => {
              setResult(null);
              setQuery("");
              setShowDebug(false);
              inputRef.current?.focus();
            }}
          >
            🔄 New Search
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Thinking... (routing → retrieval → synthesis)</p>
        </div>
      )}

      {/* API Status Footer */}
      <div className={styles.footer}>
        <a href={`${API_BASE}/docs`} target="_blank" rel="noopener noreferrer">
          📚 API Docs
        </a>
        <span>•</span>
        <a
          href={`${API_BASE}/api/moe-rag/health`}
          target="_blank"
          rel="noopener noreferrer"
        >
          🏥 Health Check
        </a>
        <span>•</span>
        <span>API: {API_BASE}</span>
      </div>
    </div>
  );
};

export default MoaFlowVisualizer;
