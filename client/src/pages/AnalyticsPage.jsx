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
  const [chartView, setChartView] = useState('line'); // 'line' | 'growth' | 'bar'
  const [analytics, setAnalytics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
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
      setLastSyncTime(new Date().toLocaleTimeString());
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
      setLastSyncTime(new Date().toLocaleTimeString());
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

  // Compute dataset for Line / Growth / Bar
  const getChartDataset = () => {
    if (!analytics || !analytics.clicksOverTime) return null;

    const rawLabels = analytics.clicksOverTime.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    let dataPoints = analytics.clicksOverTime.map(d => d.clicks);

    if (chartView === 'growth') {
      let cumulative = 0;
      dataPoints = dataPoints.map(val => {
        cumulative += val;
        return cumulative;
      });
    }

    return {
      labels: rawLabels,
      datasets: [{
        label: chartView === 'growth' ? 'Total Cumulative Clicks' : 'Daily Click Volume',
        data: dataPoints,
        borderColor: '#6366f1',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.15)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#22d3ee',
        fill: true,
        tension: 0.45
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 16 }
      }
    }
  };

  const ranges = ['24h', '7d', '30d', '90d', 'all'];

  return (
    <div>
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h2>Analytics</h2>
          <p>Real-time click tracking, visitor metrics, and performance graphs</p>
        </div>

        {/* Real-Time Live Status Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastSyncTime && isLive && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Last sync: {lastSyncTime}
            </span>
          )}
          <button 
            className={`action-btn ${isLive ? 'btn-primary' : ''}`}
            onClick={() => setIsLive(!isLive)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
          >
            <span className={isLive ? "pulse-dot" : ""} style={{ background: isLive ? '#22c55e' : '#a1a1aa' }} />
            {isLive ? 'Live · 3s' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Dashboard Top Stats */}
      {dashboardStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ fontSize: '0.9rem' }}>#</div>
            <div className="stat-value">{dashboardStats.totalUrls}</div>
            <div className="stat-label">Total Links</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ fontSize: '0.9rem' }}>↑</div>
            <div className="stat-value">{dashboardStats.totalClicks}</div>
            <div className="stat-label">Total Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ fontSize: '0.9rem' }}>•</div>
            <div className="stat-value">{dashboardStats.todayClicks}</div>
            <div className="stat-label">Today's Clicks</div>
          </div>
        </div>
      )}

      {/* Link Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="input-group">
          <label htmlFor="analytics-url-select">Select a link to inspect analytics</label>
          <select
            id="analytics-url-select"
            className="input"
            value={shortCode}
            onChange={(e) => handleSelectUrl(e.target.value)}
          >
            <option value="">-- Choose a short link --</option>
            {urls.map(u => (
              <option key={u.short_code} value={u.short_code}>
                /{u.short_code} → {u.original_url.length > 60 ? u.original_url.substring(0, 60) + '…' : u.original_url}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Analytics Section */}
      {analytics && (
        <>
          {/* Top Summary Bar + Time Range Filter */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div className="stats-grid" style={{ flex: 1, marginBottom: 0, minWidth: '280px' }}>
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

          {/* Animated Line Graph Container */}
          <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="chart-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <span className="chart-title" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {chartView === 'growth' ? 'Cumulative Click Growth' : chartView === 'bar' ? 'Daily Volume (Bar Chart)' : 'Clicks Over Time'}
              </span>

              {/* View Switcher Controls */}
              <div className="mode-tabs" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'line' ? 'active' : ''}`}
                  onClick={() => setChartView('line')}
                >
                  Line Trend
                </button>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'growth' ? 'active' : ''}`}
                  onClick={() => setChartView('growth')}
                >
                  Growth Area
                </button>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartView('bar')}
                >
                  Bar Chart
                </button>
              </div>
            </div>

            <div style={{ height: '320px', position: 'relative' }}>
              {getChartDataset() && getChartDataset().labels.length > 0 ? (
                chartView === 'bar' ? (
                  <Bar data={getChartDataset()} options={chartOptions} />
                ) : (
                  <Line data={getChartDataset()} options={chartOptions} />
                )
              ) : (
                <div className="empty-state">
                  <p>No click activity recorded in this time range</p>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Charts Grid */}
          <div className="chart-grid" style={{ marginBottom: 'var(--space-lg)' }}>
            {/* Browsers */}
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">Browsers</span>
              </div>
              <div style={{ height: '240px' }}>
                {browserChartData && browserChartData.labels.length > 0 ? (
                  <Doughnut data={browserChartData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state"><p>No data</p></div>
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">Devices</span>
              </div>
              <div style={{ height: '240px' }}>
                {deviceChartData && deviceChartData.labels.length > 0 ? (
                  <Doughnut data={deviceChartData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state"><p>No data</p></div>
                )}
              </div>
            </div>
          </div>

          {/* Live Recent Click Log Stream */}
          {analytics.recentClicks && analytics.recentClicks.length > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Click Stream</h3>
                <span className="health-badge health-badge-ok">Live Stream Active</span>
              </div>

              <div className="url-list">
                {analytics.recentClicks.map((click, idx) => (
                  <div key={idx} className="url-item-card" style={{ padding: '12px 16px' }}>
                    <div className="url-item-row" style={{ marginBottom: '4px' }}>
                      <div className="url-item-left">
                        <span className="click-badge" style={{ fontFamily: 'monospace' }}>
                          {click.browser || 'Unknown'} · {click.os || 'OS'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          {new Date(click.clicked_at).toLocaleString()}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        Referrer: {click.referrer || 'Direct'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geolocation Country Breakdown */}
          <div className="chart-container" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
            <div className="chart-header" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="chart-title" style={{ fontSize: '1rem', fontWeight: 600 }}>Geolocation & Country Traffic</span>
            </div>
            {analytics?.countries && analytics.countries.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
                {analytics.countries.map((c) => {
                  const maxCount = Math.max(...analytics.countries.map(item => item.count), 1);
                  const percentage = Math.round((c.count / maxCount) * 100);
                  const countryName = c.country || 'Unknown / Local Direct';
                  return (
                    <div key={countryName} style={{ background: 'var(--bg-tertiary)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-center justify-between" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                        <span>{countryName}</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{c.count} {c.count === 1 ? 'click' : 'clicks'}</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-fill" style={{ width: `${percentage}%`, background: '#22d3ee' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state"><p>No location data recorded yet</p></div>
            )}
          </div>

          {/* Top Referrers Bar Distribution */}
          <div className="chart-container" style={{ padding: 'var(--space-xl)' }}>
            <div className="chart-header" style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="chart-title" style={{ fontSize: '1rem', fontWeight: 600 }}>Top Referrers</span>
            </div>
            {analytics?.topReferrers && analytics.topReferrers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {analytics.topReferrers.map((ref) => {
                  const maxCount = Math.max(...analytics.topReferrers.map(r => r.count), 1);
                  const percentage = Math.round((ref.count / maxCount) * 100);
                  return (
                    <div key={ref.referrer} style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-center justify-between" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        <span>{ref.referrer === 'direct' ? 'Direct / Bookmark' : ref.referrer}</span>
                        <span>{ref.count} {ref.count === 1 ? 'click' : 'clicks'} ({percentage}%)</span>
                      </div>
                      <div className="progress-container" style={{ marginTop: '8px' }}>
                        <div className="progress-fill" style={{ width: `${percentage}%`, background: '#6366f1' }} />
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

      {/* Empty State */}
      {!analytics && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: '1.5rem' }}>—</div>
            <h3>Select a link</h3>
            <p>Choose a link from the dropdown above to view real-time click graphs and traffic analytics</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ animation: 'spin 2s linear infinite', fontSize: '1rem' }}>○</div>
            <h3>Loading analytics...</h3>
          </div>
        </div>
      )}
    </div>
  );
}
