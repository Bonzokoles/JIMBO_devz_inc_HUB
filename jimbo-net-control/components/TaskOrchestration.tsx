import React, { useState, useEffect } from "react";
import {
  executeTask,
  getOrchestratorHealth,
  sendToAgentZero,
  OrchestratorTask,
  OrchestratorResult,
  AgentZeroResponse,
} from "../services/orchestratorService";

interface TaskOrchestrationProps {
  className?: string;
}

const TaskOrchestration: React.FC<TaskOrchestrationProps> = ({ className }) => {
  const [taskDescription, setTaskDescription] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [agentZeroResponse, setAgentZeroResponse] =
    useState<AgentZeroResponse | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [mode, setMode] = useState<"orchestrator" | "agent-zero">(
    "orchestrator",
  );

  useEffect(() => {
    const fetchHealth = async () => {
      const h = await getOrchestratorHealth();
      setHealth(h);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartOrchestration = async () => {
    if (!taskDescription.trim()) {
      alert("⚠️ Wpisz opis zadania!");
      return;
    }

    setIsExecuting(true);
    setResult(null);
    setAgentZeroResponse(null);

    try {
      if (mode === "orchestrator") {
        // Orchestrator mode - AI wybiera agentów
        const task: OrchestratorTask = {
          query: taskDescription,
          context: {},
          model: "deepseek/deepseek-r1",
        };

        console.log("🎯 Sending task to orchestrator:", task);
        const res = await executeTask(task);

        if (res) {
          console.log("✅ Orchestrator response:", res);
          setResult(res);
        } else {
          console.error("❌ No response from orchestrator");
          alert(
            "❌ Błąd wykonania zadania\n\nSprawdź czy orchestrator jest dostępny pod:\nhttps://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/health",
          );
        }
      } else {
        // Direct Agent Zero mode
        const msg = {
          message: taskDescription,
          lifetime_hours: 24,
        };

        console.log("⚡ Sending message to Agent Zero:", msg);
        const res = await sendToAgentZero(msg);

        if (res) {
          console.log("✅ Agent Zero response:", res);
          setAgentZeroResponse(res);
        } else {
          console.error("❌ No response from Agent Zero");
          alert(
            "❌ Błąd komunikacji z Agent Zero\n\nSprawdź czy bridge jest dostępny pod:\nhttps://agent-zero-bridge.stolarnia-ams.workers.dev/health",
          );
        }
      }
    } catch (error) {
      console.error("❌ Task execution error:", error);
      alert(
        `❌ Błąd: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={`task-orchestration ${className || ""}`}>
      {/* Header */}
      <div className="orchestration-header">
        <div className="header-title">
          <span className="icon">🎯</span>
          <h2>Task Orchestration</h2>
        </div>
        <div className="header-info">
          {health && (
            <div className="health-badge">
              <span
                className={`status-dot ${health.status === "healthy" ? "online" : "offline"}`}
              />
              {health.agents} Agents
            </div>
          )}
        </div>
      </div>

      {/* Blueprint Architecture */}
      <div className="architecture-blueprint">
        <p className="blueprint-text">
          Blueprint Architecture: Jimbo → Brain → Pinky → Workers → Elwirka
        </p>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === "orchestrator" ? "active" : ""}`}
          onClick={() => setMode("orchestrator")}
        >
          🤖 Multi-Agent (19 Agents)
        </button>
        <button
          className={`mode-btn ${mode === "agent-zero" ? "active" : ""}`}
          onClick={() => setMode("agent-zero")}
        >
          ⚡ Agent Zero Direct
        </button>
      </div>

      {/* Task Description */}
      <div className="task-description-section">
        <label htmlFor="task-desc">Task Description</label>
        <textarea
          id="task-desc"
          className="task-textarea"
          placeholder={
            mode === "orchestrator"
              ? "Describe what you want to accomplish... e.g., 'Deploy new feature to production', 'Analyze system vulnerabilities', 'Optimize database performance'"
              : "Direct message to Agent Zero... e.g., 'Write Python script to analyze CSV', 'List files in /tmp', 'Calculate factorial of 10'"
          }
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          rows={6}
          disabled={isExecuting}
        />
      </div>

      {/* Start Button */}
      <button
        className="start-orchestration-btn"
        onClick={handleStartOrchestration}
        disabled={isExecuting || !taskDescription.trim()}
      >
        <span className="btn-icon">▶</span>
        {isExecuting ? "Executing..." : "Start Orchestration"}
      </button>

      {/* Results */}
      {result && mode === "orchestrator" && (
        <div className="orchestration-results">
          <div className="result-header">
            <h3>📊 Execution Results</h3>
            <span className="execution-time">{result.execution_time}ms</span>
          </div>

          {/* Execution Plan */}
          <div className="execution-plan">
            <h4>📋 Execution Plan</h4>
            <div className="plan-timeline">
              {result.plan.map((task, idx) => (
                <div key={idx} className="plan-item">
                  <span className={`priority-badge priority-${task.priority}`}>
                    P{task.priority}
                  </span>
                  <span className="agent-name">{task.agentId}</span>
                  <span className="action">{task.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Results */}
          <div className="agent-results">
            <h4>🤖 Agent Results</h4>
            {result.results.map((res, idx) => (
              <div
                key={idx}
                className={`agent-result ${res.success ? "success" : "error"}`}
              >
                <div className="agent-result-header">
                  <span className="agent-id">{res.agentId}</span>
                  <span
                    className={`status-badge ${res.success ? "success" : "error"}`}
                  >
                    {res.success ? "✓ Success" : "✗ Failed"}
                  </span>
                </div>
                <pre className="result-data">
                  {JSON.stringify(res.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {/* Final Answer */}
          <div className="final-answer">
            <h4>💡 Final Answer</h4>
            <div className="answer-content">{result.answer}</div>
          </div>
        </div>
      )}

      {/* Agent Zero Response */}
      {agentZeroResponse && mode === "agent-zero" && (
        <div className="agent-zero-results">
          <div className="result-header">
            <h3>⚡ Agent Zero Response</h3>
            <span className="context-id">
              Context: {agentZeroResponse.response.context_id}
            </span>
          </div>

          <div className="response-content">
            <div className="response-box">
              <div className="response-meta">
                <span className="agent-badge">
                  🤖 {agentZeroResponse.agent}
                </span>
                <span className="tunnel-badge">
                  🌐 {agentZeroResponse.via_tunnel}
                </span>
              </div>
              <div className="response-text">
                {agentZeroResponse.response.response}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskOrchestration;
