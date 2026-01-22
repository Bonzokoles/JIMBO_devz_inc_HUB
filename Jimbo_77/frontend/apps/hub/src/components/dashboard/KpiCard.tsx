import React from "react";

interface KpiCardProps {
  subtitle: string;
  title: string;
  icon: string;
  color: string; // Hex color (e.g., "#ff8f00")
  mainMetric: string;
  subText: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
  isDisabled?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  subtitle,
  title,
  icon,
  color,
  mainMetric,
  subText,
  buttonText,
  onButtonClick,
  className = "",
  isDisabled = false,
}) => {
  // Convert hex to rgba for the subtle background pattern (approx 12% opacity)
  const bgPattern = `repeating-linear-gradient(45deg, ${color}1f 0px, ${color}1f 1px, transparent 1px, transparent 4px)`;

  return (
    <div className={`card ${className} bg-black/40 border-white/5`}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, letterSpacing: '0.1em' }} className="uppercase font-mono">
          {subtitle}
        </div>
        <h3
          className="font-display"
          style={{
            margin: 0,
            fontSize: 24, 
            fontWeight: 400,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: '#94a3b8' // Slate-400: Much softer interaction
          }}
        >
          {title}
        </h3>
      </div>

      {/* Content */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Icon Box */}
        <div
          style={{
            width: 52,
            height: 52,
            minWidth: 52,
            border: "1px solid var(--line)",
            background: bgPattern,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 900,
            color: color,
            borderRadius: 8
          }}
        >
          {icon}
        </div>

        {/* Text & Action */}
        <div style={{ flex: 1, paddingLeft: 10 }}>
          <h4 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 400, lineHeight: 1.1, letterSpacing: 1.5, color: '#cbd5e1' }}>
            {mainMetric}
          </h4>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--muted)",
            }}
          >
            {subText}
          </p>
          {buttonText && (
            <button
              type="button"
              disabled={isDisabled}
              className="btn group"
              style={{
                marginTop: 16,
                width: "100%",
                justifyContent: "center",
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                padding: '12px 0',
                fontSize: 13,
                letterSpacing: '0.1em'
              }}
              onClick={(e) => {
                e.preventDefault();
                if (!isDisabled && onButtonClick) onButtonClick();
              }}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
