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
  const [isLive, setIsLive] = useState(true);
  const [urls, setUrls] = useState([]);

  // Load URL query param pre-selection on mount
  useEffect(() => {
    loadDashboard();
    loadUrls();
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setShortCode(codeParam);
      loadAnalytics(codeParam, '7d');
    }
  }, []);

  // Real-Time Live Polling (3 seconds)
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      loadDashboard(true);
      if (shortCode) {
        loadAnalytics(shortCode, range, true);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, shortCode, range]);

  const loadDashboard = async (silent = false) => {
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

  const loadAnalytics = async (code, r, silent = false) => {
    if (!code) return;
    if (!silent) setLoading(true);
    try {
      const data = await api.getAnalytics(code, r);
      setAnalytics(data);
    } catch (error) {
      if (!silent) addToast(error.message, 'error');
      setAnalytics(null);
    } finally {
      if (!silent) setLoading(false);
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
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h2>📊 Real-Time Analytics</h2>
          <p>Track click statistics, geographic trends, and referrer sources in real time</p>
        </div>

        {/* Live Real-time Indicator Toggle */}
        <button 
          className={`action-btn ${isLive ? 'btn-primary' : ''}`}
          onClick={() => setIsLive(!isLive)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
        >
          <span className={isLive ? "pulse-dot" : ""} style={{ background: isLive ? '#22c55e' : '#a1a1aa' }} />
          {isLive ? '🟢 LIVE REAL-TIME (3s Sync)' : '⏸️ Live Sync Paused'}
        </button>
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

          {/* Top Referrers with Animated Progress Bars */}
          <div className="chart-container" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
            <div className="chart-header" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="chart-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔗 Top Referrer Distribution</span>
            </div>
            {analytics?.referrers && analytics.referrers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {analytics.referrers.map((ref) => {
                  const maxCount = Math.max(...analytics.referrers.map(r => r.count), 1);
                  const percentage = Math.round((ref.count / maxCount) * 100);
                  return (
                    <div key={ref.referrer} style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-center justify-between" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>🌐 {ref.referrer}</span>
                        <span>{ref.count} {ref.count === 1 ? 'click' : 'clicks'} ({percentage}%)</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state"><p>No referrer data recorded yet</p></div>
            )}
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
