import React from "react";

interface StatisticBannerProps {
  label: string;
  value: string | number;
  color?: string;
}

export const StatisticBanner: React.FC<StatisticBannerProps> = ({
  label,
  value,
  color = "#ff3333", // Default red
}) => {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        padding: "20px",
        textAlign: "center",
        border: "1px solid var(--line)",
        background: `${color}0d`, // Hex + 0d is approx 5% alpha
        borderRadius: 16,
        marginBottom: 20,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: "var(--font-brand)",
          color: color,
          fontSize: 28,
          letterSpacing: 2,
        }}
      >
        {label} : {value}
      </h3>
    </div>
  );
};
