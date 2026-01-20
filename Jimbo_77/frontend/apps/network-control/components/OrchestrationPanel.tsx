import { useState } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Brain,
  Target,
  Shield,
  Package,
} from "lucide-react";

interface OrchestrationStep {
  success: boolean;
  content?: string;
  provider?: string;
  error?: string;
}

interface OrchestrationResult {
  task: string;
  timestamp: string;
  status: string;
  reason?: string;
  steps: {
    jimbo?: OrchestrationStep;
    brain?: OrchestrationStep;
    pinky?: OrchestrationStep;
    execution?: Array<{
      agent_id: string;
      status: string;
      output: string;
    }>;
    elwirka?: OrchestrationStep;
  };
  final_output?: any;
  checklist?: string[];
  next_steps?: string[];
}

export default function OrchestrationPanel() {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use the Agent Zero API URL environment variable or fallback to localhost:50100
      const apiUrl = (import.meta.env.VITE_AGENT_ZERO_API_URL || "http://localhost:50100") + "/api_message"; 
      const apiKey = import.meta.env.VITE_AGENT_ZERO_API_KEY || "";
 
      
      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify({
            message: task, // Agent Zero expects 'message'
            context_id: "orchestrator-" + Date.now(),
            attachments: [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to orchestrate task");
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case "jimbo":
        return <Target className="w-5 h-5" />;
      case "brain":
        return <Brain className="w-5 h-5" />;
      case "pinky":
        return <Shield className="w-5 h-5" />;
      case "elwirka":
        return <Package className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStepStatus = (step: OrchestrationStep | undefined) => {
    if (!step) return "pending";
    if (step.success) return "success";
    if (step.error) return "error";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎯 Task Orchestration
        </h2>
        <p className="text-purple-200">
          Blueprint Architecture: Jimbo → Brain → Pinky → Workers → Elwirka
        </p>
      </div>

      {/* Task Input */}
      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Description
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe what you want to accomplish... e.g., 'Deploy new feature to production', 'Analyze system vulnerabilities', 'Optimize database performance'"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              rows={4}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Orchestration
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-200">Orchestration Failed</h3>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Orchestration Result */}
      {result && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div
            className={`rounded-lg p-4 flex items-center gap-3 ${
              result.status === "completed"
                ? "bg-green-900/50 border border-green-700"
                : result.status.startsWith("stopped")
                  ? "bg-yellow-900/50 border border-yellow-700"
                  : "bg-red-900/50 border border-red-700"
            }`}
          >
            {result.status === "completed" ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : result.status.startsWith("stopped") ? (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <div>
              <h3 className="font-medium text-white">
                {result.status === "completed"
                  ? "Task Completed Successfully"
                  : result.status.startsWith("stopped")
                    ? "Execution Stopped by Pinky"
                    : "Execution Failed"}
              </h3>
              {result.reason && (
                <p className="text-sm mt-1 opacity-80">{result.reason}</p>
              )}
            </div>
          </div>

          {/* Orchestration Steps */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Orchestration Flow
            </h3>

            {/* Jimbo */}
            {result.steps.jimbo && (
              <StepCard
                name="Jimbo"
                role="Task Decomposition"
                icon={getStepIcon("jimbo")}
                status={getStepStatus(result.steps.jimbo)}
                content={result.steps.jimbo.content}
                provider={result.steps.jimbo.provider}
                error={result.steps.jimbo.error}
              />
            )}

            {/* Brain */}
            {result.steps.brain && (
              <StepCard
                name="Brain"
                role="Strategy Planning"
                icon={getStepIcon("brain")}
                status={getStepStatus(result.steps.brain)}
                content={result.steps.brain.content}
                provider={result.steps.brain.provider}
                error={result.steps.brain.error}
              />
            )}

            {/* Pinky */}
            {result.steps.pinky && (
              <StepCard
                name="Pinky"
                role="Plan Validation"
                icon={getStepIcon("pinky")}
                status={getStepStatus(result.steps.pinky)}
                content={result.steps.pinky.content}
                provider={result.steps.pinky.provider}
                error={result.steps.pinky.error}
              />
            )}

            {/* Execution */}
            {result.steps.execution && result.steps.execution.length > 0 && (
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Worker Execution
                </h4>
                <div className="space-y-2">
                  {result.steps.execution.map((exec, idx) => (
                    <div key={idx} className="bg-gray-900 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-400">
                          {exec.agent_id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            exec.status === "completed"
                              ? "bg-green-900 text-green-200"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {exec.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{exec.output}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Elwirka */}
            {result.steps.elwirka && (
              <StepCard
                name="Elwirka"
                role="Result Finalization"
                icon={getStepIcon("elwirka")}
                status={getStepStatus(result.steps.elwirka)}
                content={result.steps.elwirka.content}
                provider={result.steps.elwirka.provider}
                error={result.steps.elwirka.error}
              />
            )}
          </div>

          {/* Final Output */}
          {result.final_output && (
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Final Deliverable
              </h3>
              <pre className="text-sm text-purple-100 whitespace-pre-wrap">
                {JSON.stringify(result.final_output, null, 2)}
              </pre>
            </div>
          )}

          {/* Checklist & Next Steps */}
          {(result.checklist || result.next_steps) && (
            <div className="grid md:grid-cols-2 gap-4">
              {result.checklist && result.checklist.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Checklist
                  </h3>
                  <ul className="space-y-2">
                    {result.checklist.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-green-400 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.next_steps && result.next_steps.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {result.next_steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-purple-400">{idx + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Step Card Component
function StepCard({
  name,
  role,
  icon,
  status,
  content,
  provider,
  error,
}: {
  name: string;
  role: string;
  icon: React.ReactNode;
  status: "success" | "error" | "pending";
  content?: string;
  provider?: string;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 ${
        status === "success"
          ? "border-green-700 bg-green-900/20"
          : status === "error"
            ? "border-red-700 bg-red-900/20"
            : "border-gray-700 bg-gray-900/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded ${
              status === "success"
                ? "bg-green-900 text-green-300"
                : status === "error"
                  ? "bg-red-900 text-red-300"
                  : "bg-gray-800 text-gray-400"
            }`}
          >
            {icon}
          </div>
          <div>
            <h4 className="font-medium text-white">{name}</h4>
            <p className="text-sm text-gray-400">{role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {provider && (
            <span className="text-xs px-2 py-1 bg-purple-900 text-purple-200 rounded">
              {provider}
            </span>
          )}
          {status === "success" && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
        </div>
      </div>

      {content && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {expanded ? "Hide Details" : "Show Details"}
          </button>

          {expanded && (
            <div className="mt-2 p-3 bg-gray-900 rounded text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {content}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
