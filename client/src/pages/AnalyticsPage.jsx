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
      const list = data.urls || [];
      setUrls(list);
      // Auto-select first link if none selected
      if (!shortCode && list.length > 0) {
        setShortCode(list[0].short_code);
        loadAnalytics(list[0].short_code, '7d');
      }
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
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
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
      hoverOffset: 6
    }]
  } : null;

  const deviceChartData = analytics ? {
    labels: analytics.devices.map(d => d.device_type),
    datasets: [{
      data: analytics.devices.map(d => d.count),
      backgroundColor: ['#6366f1', '#22d3ee', '#10b981', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { duration: 600 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 }
      }
    }
  };

  const ranges = ['24h', '7d', '30d', '90d', 'all'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      {/* 1. Header & Integrated Controls Row */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Performance insights & traffic metrics</p>
        </div>

        {/* Link Selector + Range Filters + Live Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {/* Link Selector Dropdown */}
          <div style={{ minWidth: '220px' }}>
            <select
              id="analytics-url-select"
              className="input"
              value={shortCode}
              onChange={(e) => handleSelectUrl(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="">-- Select link --</option>
              {urls.map(u => (
                <option key={u.short_code} value={u.short_code}>
                  /{u.short_code} ({u.click_count} clicks)
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="range-filter">
            {ranges.map(r => (
              <button
                key={r}
                className={`range-btn ${range === r ? 'active' : ''}`}
                onClick={() => handleRangeChange(r)}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          {/* Live Sync Badge */}
          <button 
            className={`action-btn ${isLive ? 'btn-primary' : ''}`}
            onClick={() => setIsLive(!isLive)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <span className={isLive ? "pulse-dot" : ""} style={{ background: isLive ? '#22c55e' : '#a1a1aa', width: '6px', height: '6px' }} />
            {isLive ? 'Live 3s' : 'Paused'}
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', margin: 0 }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics ? analytics.clicksInRange : (dashboardStats?.totalClicks || 0)}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Clicks in Period</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics ? analytics.uniqueVisitors : (dashboardStats?.todayClicks || 0)}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>{analytics ? 'Unique Visitors' : 'Today Clicks'}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics ? analytics.totalClicks : (dashboardStats?.totalUrls || 0)}</div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>{analytics ? 'Total Lifetime Clicks' : 'Total Links'}</div>
        </div>
        <div className="stat-card" style={{ padding: '16px' }}>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: '#22d3ee' }}>
            {analytics?.countries?.length ? analytics.countries.length : (analytics?.topReferrers?.length || 0)}
          </div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Active Locations</div>
        </div>
      </div>

      {/* 3. Main Analytics View */}
      {analytics ? (
        <>
          {/* Animated Main Line Graph Card */}
          <div className="chart-container" style={{ padding: '20px' }}>
            <div className="chart-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <span className="chart-title" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {chartView === 'growth' ? 'Cumulative Growth' : chartView === 'bar' ? 'Daily Volume' : 'Click Volume Trend'}
              </span>

              {/* View Switcher Controls */}
              <div className="mode-tabs" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'line' ? 'active' : ''}`}
                  onClick={() => setChartView('line')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Trend
                </button>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'growth' ? 'active' : ''}`}
                  onClick={() => setChartView('growth')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Growth
                </button>
                <button
                  type="button"
                  className={`tab-btn ${chartView === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartView('bar')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Bar
                </button>
              </div>
            </div>

            <div style={{ height: '280px', position: 'relative' }}>
              {getChartDataset() && getChartDataset().labels.length > 0 ? (
                chartView === 'bar' ? (
                  <Bar data={getChartDataset()} options={chartOptions} />
                ) : (
                  <Line data={getChartDataset()} options={chartOptions} />
                )
              ) : (
                <div className="empty-state">
                  <p style={{ fontSize: '0.85rem' }}>No click activity recorded in this period</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Organized 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
            
            {/* Left Column: Browsers & Devices Side-by-Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Browsers Doughnut */}
              <div className="chart-container" style={{ padding: '20px' }}>
                <div className="chart-header" style={{ marginBottom: '12px' }}>
                  <span className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Browsers</span>
                </div>
                <div style={{ height: '200px' }}>
                  {browserChartData && browserChartData.labels.length > 0 ? (
                    <Doughnut data={browserChartData} options={doughnutOptions} />
                  ) : (
                    <div className="empty-state"><p style={{ fontSize: '0.8rem' }}>No browser data</p></div>
                  )}
                </div>
              </div>

              {/* Devices Doughnut */}
              <div className="chart-container" style={{ padding: '20px' }}>
                <div className="chart-header" style={{ marginBottom: '12px' }}>
                  <span className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Devices</span>
                </div>
                <div style={{ height: '200px' }}>
                  {deviceChartData && deviceChartData.labels.length > 0 ? (
                    <Doughnut data={deviceChartData} options={doughnutOptions} />
                  ) : (
                    <div className="empty-state"><p style={{ fontSize: '0.8rem' }}>No device data</p></div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Geolocation & Top Referrers Progress Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              
              {/* Geolocation Traffic */}
              <div className="chart-container" style={{ padding: '20px' }}>
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <span className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Locations</span>
                </div>
                {analytics?.countries && analytics.countries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.countries.slice(0, 5).map((c) => {
                      const maxCount = Math.max(...analytics.countries.map(item => item.count), 1);
                      const percentage = Math.round((c.count / maxCount) * 100);
                      return (
                        <div key={c.country || 'local'} style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div className="flex items-center justify-between" style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                            <span>{c.country || 'Direct / Local'}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{c.count} clicks</span>
                          </div>
                          <div className="progress-container">
                            <div className="progress-fill" style={{ width: `${percentage}%`, background: '#22d3ee' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state"><p style={{ fontSize: '0.8rem' }}>No location data recorded</p></div>
                )}
              </div>

              {/* Top Referrers */}
              <div className="chart-container" style={{ padding: '20px' }}>
                <div className="chart-header" style={{ marginBottom: '16px' }}>
                  <span className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Top Referrers</span>
                </div>
                {analytics?.topReferrers && analytics.topReferrers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.topReferrers.slice(0, 5).map((ref) => {
                      const maxCount = Math.max(...analytics.topReferrers.map(r => r.count), 1);
                      const percentage = Math.round((ref.count / maxCount) * 100);
                      return (
                        <div key={ref.referrer} style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px' }}>
                          <div className="flex items-center justify-between" style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                            <span>{ref.referrer === 'direct' ? 'Direct / Bookmark' : ref.referrer}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{ref.count} clicks</span>
                          </div>
                          <div className="progress-container">
                            <div className="progress-fill" style={{ width: `${percentage}%`, background: '#6366f1' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state"><p style={{ fontSize: '0.8rem' }}>No referrer data recorded</p></div>
                )}
              </div>

            </div>

          </div>

          {/* 5. Live Click Stream */}
          {analytics.recentClicks && analytics.recentClicks.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Recent Activity Feed</h3>
                <span className="health-badge health-badge-ok" style={{ fontSize: '0.7rem' }}>Live Stream</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.recentClicks.slice(0, 5).map((click, idx) => (
                  <div key={idx} className="flex items-center justify-between" style={{ background: 'var(--bg-tertiary)', padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="click-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {click.browser || 'Browser'} · {click.os || 'OS'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {click.referrer || 'Direct'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {new Date(click.clicked_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty / Select State */
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: '1.5rem' }}>—</div>
            <h3>Select a link</h3>
            <p style={{ fontSize: '0.85rem' }}>Select a link from the dropdown menu above to view its analytics dashboard</p>
          </div>
        </div>
      )}

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
