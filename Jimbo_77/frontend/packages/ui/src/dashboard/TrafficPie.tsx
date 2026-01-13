import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export type TrafficPieProps = {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#e0e0e0' }
    }
  }
};

export function TrafficPie({ data }: TrafficPieProps) {
  return (
    <div className="chart-container" style={{
      background: "#141414",
      border: "1px solid #333",
      borderRadius: "8px",
      padding: "20px"
    }}>
      <h3 style={{ marginTop: 0 }}>📊 Traffic Sources</h3>
      <Doughnut options={options} data={data} />
    </div>
  );
}
