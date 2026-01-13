export type KpiCardProps = {
  label: string;
  value: string;
  change?: {
    value: number;
    text: string;
  };
};

export function KpiCard({ label, value, change }: KpiCardProps) {
  const isUp = change ? change.value > 0 : false;
  
  return (
    <div className="kpi-card" style={{
      background: "#141414",
      border: "2px solid #00ff41",
      padding: "25px",
      textAlign: "center",
      borderRadius: "8px",
      transition: "all 0.3s",
      minWidth: "200px"
    }}>
      <div className="kpi-value" style={{ fontSize: "36px", fontWeight: "bold", color: "#00ff41" }}>
        {value}
      </div>
      <div className="kpi-label" style={{ fontSize: "14px", color: "#888", textTransform: "uppercase" }}>
        {label}
      </div>
      {change && (
        <div className="kpi-change" style={{ fontSize: "12px", color: isUp ? "#00ff41" : "#ff4444" }}>
          {change.text}
        </div>
      )}
    </div>
  );
}
