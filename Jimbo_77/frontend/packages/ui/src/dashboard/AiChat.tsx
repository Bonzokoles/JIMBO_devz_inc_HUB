import React from 'react';

export type AiChatProps = {
  onQuery: (query: string) => Promise<string>;
};

export function AiChat({ onQuery }: AiChatProps) {
  const [messages, setMessages] = React.useState<{ text: string; isAi: boolean; error?: boolean }[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;
    
    const query = input;
    setMessages(prev => [...prev, { text: `You: ${query}`, isAi: false }]);
    setInput("");
    setLoading(true);

    try {
      const response = await onQuery(query);
      setMessages(prev => [...prev, { text: response, isAi: true }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { text: `Error: ${e.message}`, isAi: true, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-chat" style={{
      background: "#0a0a0a",
      border: "2px solid #0affff",
      borderRadius: "8px",
      padding: "20px",
      marginTop: "30px"
    }}>
      <h3 style={{ marginTop: 0 }}>🤖 AI Analyst (Real-time Insights)</h3>
      <p>Analizuje dane z D1 + Cloudflare + Pumo API. Pytaj o wszystko.</p>
      
      <div className="chat-messages" style={{ minHeight: "200px", marginTop: "15px", maxHeight: "400px", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} className="message" style={{
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "4px",
            background: m.isAi ? "#0affff20" : "transparent",
            borderLeft: m.isAi ? "3px solid #0affff" : "none",
            color: m.error ? "#ff4444" : "inherit"
          }}>
            {m.text}
          </div>
        ))}
        {loading && <div className="message ai" style={{ opacity: 0.5 }}>AI Analyst is analyzing...</div>}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Np: 'Dlaczego materac ma 0 hitów?'"
          className="chat-input"
          style={{
            flex: 1,
            padding: "15px",
            background: "#1a1a1a",
            border: "1px solid #0affff",
            color: "#e0e0e0",
            borderRadius: "4px",
            fontFamily: "inherit",
            fontSize: "16px"
          }}
        />
        <button 
          onClick={handleSend}
          style={{
            padding: "0 20px",
            background: "#0affff",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Analizuj ➤
        </button>
      </div>
    </div>
  );
}
