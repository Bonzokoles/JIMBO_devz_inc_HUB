import React, { useState } from "react";
import { Prompt } from "../types";

interface PromptCardProps {
  prompt: Prompt;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: 12,
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--accent)", // Yellow accent
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            {prompt.category}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {prompt.title}
          </h3>
        </div>
        <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
                background: "transparent",
                border: "1px solid var(--line)",
                color: copied ? "var(--hot)" : "var(--muted)",
                borderRadius: 4,
                padding: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
             {copied ? (
                 <i className="lni lni-checkmark" style={{fontSize: 16}}></i>
             ) : (
                <i className="lni lni-clipboard" style={{fontSize: 16}}></i>
             )}
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
          background: "rgba(0,0,0,0.2)",
          padding: 10,
          borderRadius: 4,
          overflowY: "auto",
          maxHeight: 200,
          whiteSpace: 'pre-wrap'
        }}
      >
        {prompt.prompt}
      </div>

      {/* Footer / Tags */}
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {prompt.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              background: "rgba(255,255,255,0.05)",
              padding: "2px 6px",
              borderRadius: 2,
              color: "var(--muted)",
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};
