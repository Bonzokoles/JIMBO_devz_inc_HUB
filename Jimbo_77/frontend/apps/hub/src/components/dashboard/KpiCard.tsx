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
    <div className={`card ${className}`}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
          {subtitle}
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </h3>
      </div>

      {/* Content */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon Box */}
        <div
          style={{
            width: 42,
            height: 42,
            minWidth: 42,
            border: "1px solid var(--line)",
            background: bgPattern,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: color,
          }}
        >
          {icon}
        </div>

        {/* Text & Action */}
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>
            {mainMetric}
          </h4>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            {subText}
          </p>
          {buttonText && (
            <button
              type="button"
              disabled={isDisabled}
              className="btn"
              style={{
                marginTop: 12,
                width: "100%",
                justifyContent: "center",
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
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
