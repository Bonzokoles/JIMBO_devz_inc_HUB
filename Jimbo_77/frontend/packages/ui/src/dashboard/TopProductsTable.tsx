export type Product = {
  id?: string;
  name: string;
  category: string;
  clicks: number;
  ctr: number;
  revenue: number;
};

export type TopProductsTableProps = {
  products: Product[];
};

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <div className="chart-container" style={{
      background: "#141414",
      border: "1px solid #00ff41",
      borderRadius: "8px",
      overflow: "hidden",
      padding: "0" // Overwrite padding for table container
    }}>
      <div style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0 }}>🏆 Top Products (Clicks & Revenue)</h3>
      </div>
      <table className="stats-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>#</th>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>Product</th>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>Category</th>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>Clicks</th>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>CTR</th>
            <th style={{ background: "#00ff41", color: "#000", fontWeight: "bold", padding: "12px 16px", textAlign: "left" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: "12px 16px" }}><strong>{i + 1}</strong></td>
              <td style={{ padding: "12px 16px" }}>{p.name}</td>
              <td style={{ padding: "12px 16px" }}>{p.category}</td>
              <td style={{ padding: "12px 16px" }}>{p.clicks.toLocaleString()}</td>
              <td style={{ padding: "12px 16px" }}>{p.ctr.toFixed(1)}%</td>
              <td style={{ padding: "12px 16px", color: "#00ff41", fontWeight: "bold" }}>
                {p.revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
