import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MODELS = [
  { id: "deepseek-r1", name: "DeepSeek R1" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
  { id: "gpt-4o", name: "GPT-4o" },
];

export function CaydenChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force read from localStorage on mount and set state immediately
    try {
      const savedModel = localStorage.getItem("cayden_model");
      if (savedModel && MODELS.some(m => m.id === savedModel)) {
        console.log("Loading saved model:", savedModel);
        setSelectedModel(savedModel);
      }
    } catch (e) {
      console.warn("Failed to load model from localStorage", e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    localStorage.setItem("cayden_model", newModel);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      let data;
      try {
        const response = await fetch(
          "https://jimbo77-agents-orchestrator.stolarnia-ams.workers.dev/api/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMessage.content,
              model: selectedModel,
            }),
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
           throw new Error(`API Error: ${response.status}`);
        }
        data = await response.json();

      } catch (fetchError) {
        // FALLBACK: If API fails (dev mode/offline), simulate response
        console.warn("API failed, using fallback:", fetchError);
        data = { 
          response: `[MOCK RESPONSE because API unavailable]\n\nI processed your request using **${selectedModel}**. \n\nThis is a simulation because the backend is currently unreachable.` 
        };
        // Simulate network delay for fallback
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const assistantContent = data.response || data.message || "No response received.";

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat fatal error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: System malfunction. ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            💬 CAY_DEN CHAT <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded ml-2">BETA</span>
          </h2>
          <p className="text-sm text-gray-400 font-mono mt-1">
            Agents Orchestrator Interface
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="model-select" className="text-xs text-gray-500 font-mono uppercase">Model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-gray-800 text-white font-mono text-sm border border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 font-mono opacity-50">
              <div className="text-6xl mb-6">🧠</div>
              <p className="text-xl font-bold mb-2">CAY_DEN IS READY</p>
              <p className="text-sm max-w-md mx-auto">
                Select a model and start chatting. CAY_DEN orchestrates responses from top-tier AI models.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl p-4 font-mono text-sm shadow-lg ${
                  msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/50 text-blue-100 rounded-tl-xl rounded-tr-xl rounded-bl-xl"
                    : "bg-gray-800/80 border border-gray-700 text-gray-200 rounded-tl-xl rounded-tr-xl rounded-br-xl"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="text-[10px] opacity-40 mt-3 flex justify-end">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl font-mono text-sm text-gray-400">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤖</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4 bg-gray-950">
        <div className="flex gap-3 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask ${MODELS.find(m => m.id === selectedModel)?.name || 'CAY_DEN'}...`}
            disabled={isLoading}
            className="flex-1 bg-gray-900 text-white border border-gray-700 p-4 pr-32 font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all rounded"
            rows={1}
            style={{ minHeight: '50px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 top-2 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-mono font-bold transition-all rounded uppercase tracking-wider text-xs"
          >
            {isLoading ? "THINKING..." : "SEND"}
          </button>
        </div>
        <div className="text-[10px] text-gray-600 font-mono mt-2 text-center uppercase tracking-widest">
           Powered by Agents Orchestrator • {selectedModel}
        </div>
      </div>
    </div>
  );
}
