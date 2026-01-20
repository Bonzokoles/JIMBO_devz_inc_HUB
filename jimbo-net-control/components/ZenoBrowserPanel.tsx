import React, { useState } from "react";
import "./ZenoBrowserPanel.css";

interface ZenoTool {
  id: string;
  name: string;
  description: string;
  actions: string[];
  params: string[];
}

interface ZenoResult {
  success: boolean;
  tool: string;
  action?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

const ZenoBrowserPanel: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>("web_search");
  const [toolParams, setToolParams] = useState<{ [key: string]: string }>({
    query: "",
    url: "",
    action: "search",
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ZenoResult | null>(null);
  const [tools, setTools] = useState<ZenoTool[]>([]);
  const [bridgeHealth, setBridgeHealth] = useState<any>(null);

  const ZENO_BRIDGE_URL =
    import.meta.env.VITE_ZENO_BRIDGE ||
    "https://zeno-browser-bridge.stolarnia-ams.workers.dev";

  React.useEffect(() => {
    fetchTools();
    fetchHealth();
  }, []);

  const fetchTools = async () => {
    try {
      const res = await fetch(`${ZENO_BRIDGE_URL}/tools`);
      const data = await res.json();
      if (data.success) {
        setTools(data.tools);
      }
    } catch (error) {
      console.error("Failed to fetch ZENO tools:", error);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${ZENO_BRIDGE_URL}/health`);
      const data = await res.json();
      setBridgeHealth(data);
    } catch (error) {
      console.error("Failed to fetch ZENO health:", error);
    }
  };

  const executeTool = async () => {
    setIsExecuting(true);
    setResult(null);

    try {
      const res = await fetch(`${ZENO_BRIDGE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: selectedTool,
          action: toolParams.action || "default",
          params: {
            query: toolParams.query,
            url: toolParams.url,
            ...toolParams,
          },
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        tool: selectedTool,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedToolInfo = tools.find((t) => t.id === selectedTool);

  return (
    <div className="zeno-browser-panel">
      {/* Header */}
      <div className="zeno-header">
        <div className="header-title">
          <span className="icon">🌐</span>
          <h2>ZENO Browser MCP Tools</h2>
        </div>
        <div className="header-info">
          {bridgeHealth && (
            <div className="health-badge">
              <span
                className={`status-dot ${bridgeHealth.status === "healthy" ? "online" : "offline"}`}
              />
              {bridgeHealth.tools?.length || 0} Tools
            </div>
          )}
        </div>
      </div>

      {/* Browser Preview */}
      <div className="browser-preview">
        <div className="browser-frame">
          <div className="browser-toolbar">
            <div className="browser-controls">
              <span className="control-btn">◀</span>
              <span className="control-btn">▶</span>
              <span className="control-btn">↻</span>
            </div>
            <div className="address-bar">
              <span className="lock-icon">🔒</span>
              <input
                type="text"
                value={toolParams.url || "https://zenbrowsers.org"}
                onChange={(e) =>
                  setToolParams({ ...toolParams, url: e.target.value })
                }
                placeholder="Enter URL..."
              />
            </div>
          </div>
          <div className="browser-viewport">
            <div className="zeno-logo">
              <span style={{ fontSize: "64px" }}>⚡</span>
              <h3>ZENO_WEB_CORE</h3>
              <p className="tagline">
                Advanced Web Browser with MCP Integration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Selector */}
      <div className="tool-selector-section">
        <label>Select MCP Tool</label>
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-card ${selectedTool === tool.id ? "active" : ""}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <div className="tool-icon">{getToolIcon(tool.id)}</div>
              <div className="tool-name">{tool.name}</div>
              <div className="tool-desc">{tool.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Parameters */}
      {selectedToolInfo && (
        <div className="tool-params-section">
          <label>Parameters for {selectedToolInfo.name}</label>

          {selectedTool === "web_search" && (
            <div className="param-group">
              <input
                type="text"
                className="param-input"
                placeholder="Enter search query..."
                value={toolParams.query || ""}
                onChange={(e) =>
                  setToolParams({ ...toolParams, query: e.target.value })
                }
              />
            </div>
          )}

          {(selectedTool === "web_navigation" ||
            selectedTool === "content_analysis" ||
            selectedTool === "page_summarizer" ||
            selectedTool === "link_extractor") && (
            <div className="param-group">
              <input
                type="text"
                className="param-input"
                placeholder="Enter URL..."
                value={toolParams.url || ""}
                onChange={(e) =>
                  setToolParams({ ...toolParams, url: e.target.value })
                }
              />
            </div>
          )}

          {selectedTool === "bookmark_manager" && (
            <div className="param-group">
              <select
                className="param-input"
                value={toolParams.action || "list"}
                onChange={(e) =>
                  setToolParams({ ...toolParams, action: e.target.value })
                }
              >
                <option value="list">List Bookmarks</option>
                <option value="add">Add Bookmark</option>
                <option value="remove">Remove Bookmark</option>
                <option value="search">Search Bookmarks</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Execute Button */}
      <button
        className="execute-tool-btn"
        onClick={executeTool}
        disabled={isExecuting || !selectedTool}
      >
        <span className="btn-icon">▶</span>
        {isExecuting ? "Executing..." : "Execute Tool"}
      </button>

      {/* Results */}
      {result && (
        <div className="zeno-results">
          <div className="result-header">
            <h3>{result.success ? "✅ Success" : "❌ Error"}</h3>
            <span className="result-timestamp">
              {new Date(result.timestamp).toLocaleString()}
            </span>
          </div>

          {result.success ? (
            <div className="result-data">
              <h4>Tool: {result.tool}</h4>
              {result.action && (
                <p className="result-action">Action: {result.action}</p>
              )}
              <pre className="result-json">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="result-error">
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getToolIcon(toolId: string): string {
  const icons: { [key: string]: string } = {
    web_navigation: "🧭",
    content_analysis: "🔍",
    web_search: "🌐",
    bookmark_manager: "⭐",
    page_summarizer: "📄",
    link_extractor: "🔗",
  };
  return icons[toolId] || "🛠️";
}

export default ZenoBrowserPanel;
