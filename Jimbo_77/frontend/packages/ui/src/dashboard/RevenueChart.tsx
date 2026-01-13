import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type RevenueChartProps = {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }[];
  };
};

const options = {
  responsive: true,
  scales: {
    y: { beginAtZero: true, grid: { color: '#333' } },
    x: { grid: { color: '#333' } }
  },
  plugins: { legend: { labels: { color: '#e0e0e0' } } }
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="chart-container" style={{
      background: "#141414",
      border: "1px solid #333",
      borderRadius: "8px",
      padding: "20px"
    }}>
      <h3 style={{ marginTop: 0 }}>💰 Revenue Trend (30 days)</h3>
      <Line options={options} data={data} />
    </div>
  );
}
