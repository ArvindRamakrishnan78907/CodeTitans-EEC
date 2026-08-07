import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api.js';

// Register Chart.js modules
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const chartColors = [
  '#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
];

export default function AnalyticsPage({ addToast }) {
  const [shortCode, setShortCode] = useState('');
  const [range, setRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([]);

  // Load dashboard stats and URL list
  useEffect(() => {
    loadDashboard();
    loadUrls();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboardStats();
      setDashboardStats(data);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  };

  const loadUrls = async () => {
    try {
      const data = await api.getAllUrls(1, 50);
      setUrls(data.urls || []);
    } catch (e) {
      console.error('URL list load error:', e);
    }
  };

  const loadAnalytics = async (code, r) => {
    if (!code) return;
    setLoading(true);
    try {
      const data = await api.getAnalytics(code, r);
      setAnalytics(data);
    } catch (error) {
      addToast(error.message, 'error');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUrl = (code) => {
    setShortCode(code);
    loadAnalytics(code, range);
  };

  const handleRangeChange = (r) => {
    setRange(r);
    if (shortCode) loadAnalytics(shortCode, r);
  };

  // Chart configurations
  const lineChartData = analytics ? {
    labels: analytics.clicksOverTime.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Clicks',
      data: analytics.clicksOverTime.map(d => d.clicks),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.4
    }]
  } : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(99, 102, 241, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(99, 102, 241, 0.06)' },
        ticks: { color: '#64748b', font: { size: 11 }, precision: 0 },
        beginAtZero: true
      }
    }
  };

  const browserChartData = analytics ? {
    labels: analytics.browsers.map(b => b.browser),
    datasets: [{
      data: analytics.browsers.map(b => b.count),
      backgroundColor: chartColors.slice(0, analytics.browsers.length),
      borderWidth: 0,
      hoverOffset: 8
    }]
  } : null;

  const deviceChartData = analytics ? {
    labels: analytics.devices.map(d => d.device_type),
    datasets: [{
      data: analytics.devices.map(d => d.count),
      backgroundColor: ['#6366f1', '#22d3ee', '#10b981', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: 8
    }]
  } : null;

  const referrerChartData = analytics ? {
    labels: analytics.topReferrers.map(r => {
      const ref = r.referrer;
      if (ref === 'direct') return 'Direct';
      try {
        return new URL(ref).hostname;
      } catch {
        return ref.length > 20 ? ref.substring(0, 20) + '…' : ref;
      }
    }),
    datasets: [{
      label: 'Visits',
      data: analytics.topReferrers.map(r => r.count),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false
    }]
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 16 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(99, 102, 241, 0.06)' },
        ticks: { color: '#64748b', precision: 0 },
        beginAtZero: true
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };

  const ranges = ['24h', '7d', '30d', '90d', 'all'];

  return (
    <div>
      <div className="page-header">
        <h2>📊 Analytics</h2>
        <p>Track clicks, referrers, devices, and more for your shortened links</p>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <div className="stat-value">{dashboardStats.totalUrls}</div>
            <div className="stat-label">Total Links</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👆</div>
            <div className="stat-value">{dashboardStats.totalClicks}</div>
            <div className="stat-label">Total Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{dashboardStats.todayClicks}</div>
            <div className="stat-label">Today's Clicks</div>
          </div>
        </div>
      )}

      {/* URL Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="input-group">
          <label>Select a link to view analytics</label>
          <select
            className="input"
            value={shortCode}
            onChange={(e) => handleSelectUrl(e.target.value)}
          >
            <option value="">-- Choose a link --</option>
            {urls.map(u => (
              <option key={u.short_code} value={u.short_code}>
                /{u.short_code} → {u.original_url.length > 60 ? u.original_url.substring(0, 60) + '…' : u.original_url}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Content */}
      {analytics && (
        <>
          {/* Range Filter + Summary */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="stats-grid" style={{ flex: 1, marginBottom: 0, marginRight: 'var(--space-lg)' }}>
              <div className="stat-card">
                <div className="stat-value">{analytics.clicksInRange}</div>
                <div className="stat-label">Clicks in Period</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.uniqueVisitors}</div>
                <div className="stat-label">Unique Visitors</div>
              </div>
            </div>

            <div className="range-filter">
              {ranges.map(r => (
                <button
                  key={r}
                  className={`range-btn ${range === r ? 'active' : ''}`}
                  onClick={() => handleRangeChange(r)}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Clicks Over Time */}
          <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="chart-header">
              <span className="chart-title">📈 Clicks Over Time</span>
            </div>
            <div style={{ height: '300px' }}>
              {lineChartData && lineChartData.labels.length > 0 ? (
                <Line data={lineChartData} options={lineChartOptions} />
              ) : (
                <div className="empty-state">
                  <p>No click data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="chart-grid">
            {/* Browser Breakdown */}
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">🌐 Browsers</span>
              </div>
              <div style={{ height: '250px' }}>
                {browserChartData && browserChartData.labels.length > 0 ? (
                  <Doughnut data={browserChartData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state"><p>No data</p></div>
                )}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">📱 Devices</span>
              </div>
              <div style={{ height: '250px' }}>
                {deviceChartData && deviceChartData.labels.length > 0 ? (
                  <Doughnut data={deviceChartData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state"><p>No data</p></div>
                )}
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="chart-container" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="chart-header">
              <span className="chart-title">🔗 Top Referrers</span>
            </div>
            <div style={{ height: '250px' }}>
              {referrerChartData && referrerChartData.labels.length > 0 ? (
                <Bar data={referrerChartData} options={barOptions} />
              ) : (
                <div className="empty-state"><p>No referrer data</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state when no URL selected */}
      {!analytics && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>Select a link to view analytics</h3>
            <p>Choose from the dropdown above to see detailed click analytics, referrer data, and device breakdowns</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }}>⚡</div>
            <h3>Loading analytics...</h3>
          </div>
        </div>
      )}
    </div>
  );
}
