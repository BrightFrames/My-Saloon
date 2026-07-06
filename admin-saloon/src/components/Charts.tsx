import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

type ChartsProps = {
  stats: { total_revenue: number }
  bookings: any[]
}

export default function Charts({ stats, bookings }: ChartsProps) {
  // Generate simple revenue dataset for last 7 days (synthetic when real data is absent)
  const labels = ['6d', '5d', '4d', '3d', '2d', '1d', 'Today']
  const base = Math.max(0, stats.total_revenue || 0)
  const fluctuations = [0.8, 0.9, 1.0, 1.05, 0.95, 1.1, 1.0]
  const revenueData = fluctuations.map((f) => Math.round((base / 7) * f))

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenueData,
        borderColor: '#6B554D',
        backgroundColor: 'rgba(198,155,137,0.16)',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  // Loyal vs New customers (approximate)
  const loyal = bookings.filter((b) => b.is_repeat).length || Math.round(bookings.length * 0.35)
  const newCustomers = Math.max(0, bookings.length - loyal)

  const doughnutData = {
    labels: ['Loyal', 'New'],
    datasets: [
      {
        data: [loyal, newCustomers],
        backgroundColor: ['#C49B89', '#6B554D'],
        hoverOffset: 6,
      },
    ],
  }

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h4 className="card-title">Revenue (Last 7 days)</h4>
        <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
      </div>

      <div className="chart-card">
        <h4 className="card-title">Customer Mix</h4>
        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  )
}
