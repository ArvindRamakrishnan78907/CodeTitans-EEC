import { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function SettingsPage({ currentTheme, onThemeChange, addToast }) {
  const [defaultExpiry, setDefaultExpiry] = useState(() => localStorage.getItem('sniplink_default_expiry') || 'never');
  const [defaultMaxClicks, setDefaultMaxClicks] = useState(() => localStorage.getItem('sniplink_default_clicks') || '');
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('sniplink_custom_domain') || '');
  const [exporting, setExporting] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('api'); // 'api' | 'features' | 'shortcuts'

  useEffect(() => {
    localStorage.setItem('sniplink_default_expiry', defaultExpiry);
  }, [defaultExpiry]);

  useEffect(() => {
    localStorage.setItem('sniplink_default_clicks', defaultMaxClicks);
  }, [defaultMaxClicks]);

  const handleSaveDomain = () => {
    localStorage.setItem('sniplink_custom_domain', customDomain.trim());
    if (addToast) addToast('Custom domain preference saved!', 'success');
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const data = await api.getAllUrls(1, 1000);
      const list = data.urls || [];
      if (list.length === 0) {
        if (addToast) addToast('No links to export', 'error');
        return;
      }

      const headers = ['Short Code', 'Original URL', 'Clicks', 'Created At'];
      const rows = list.map(u => [
        u.short_code,
        `"${u.original_url.replace(/"/g, '""')}"`,
        u.click_count,
        u.created_at
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sniplink-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (addToast) addToast('Links exported to CSV successfully!', 'success');
    } catch (e) {
      console.error(e);
      if (addToast) addToast('Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const data = await api.getAllUrls(1, 1000);
      const jsonStr = JSON.stringify(data.urls || [], null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sniplink-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (addToast) addToast('Backup JSON downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      if (addToast) addToast('Failed to export JSON', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local preferences and history cache? This will not delete server links.')) {
      localStorage.clear();
      if (addToast) addToast('Local storage preferences reset', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleCopyCurl = (code) => {
    navigator.clipboard.writeText(code);
    if (addToast) addToast('Copied to clipboard', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Preferences, theme, data export, and API documentation</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '760px' }}>
        
        {/* Appearance Section */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            Appearance
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Choose your preferred color theme for the SnipLink interface.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div 
              className="config-card"
              style={{
                cursor: 'pointer',
                borderColor: currentTheme === 'dark' ? 'var(--accent-primary)' : 'var(--border-default)',
                background: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
              }}
              onClick={() => onThemeChange('dark')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Dark</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Dark mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Low-light interface</div>
            </div>

            <div 
              className="config-card"
              style={{
                cursor: 'pointer',
                borderColor: currentTheme === 'light' ? 'var(--accent-primary)' : 'var(--border-default)',
                background: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
              }}
              onClick={() => onThemeChange('light')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Light</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Light mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>High-contrast light interface</div>
            </div>
          </div>
        </div>

        {/* Default Link Preferences */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            Link defaults
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Set automatic defaults for newly created short links.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Default Expiration Duration</label>
              <select 
                className="input"
                value={defaultExpiry}
                onChange={(e) => setDefaultExpiry(e.target.value)}
              >
                <option value="never">Never expire (Default)</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            <div className="input-group">
              <label>Default Click Limit</label>
              <input 
                type="number"
                className="input"
                placeholder="Leave empty for unlimited"
                value={defaultMaxClicks}
                onChange={(e) => setDefaultMaxClicks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Custom Domain Override */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            Custom domain
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Override the base domain string shown when copying generated short links.
          </p>

          <div className="input-with-btn">
            <input 
              type="text"
              className="input"
              placeholder="e.g. https://mybrand.link"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSaveDomain}>
              Save Prefix
            </button>
          </div>
        </div>

        {/* Interactive Documentation Section */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ cursor: 'pointer' }} onClick={() => setShowDocs(!showDocs)}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Documentation
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                REST API endpoints, cURL examples, keyboard shortcuts, and feature usage instructions
              </p>
            </div>
            <button className="action-btn" style={{ padding: '6px 12px' }}>
              {showDocs ? '▲ Hide Docs' : '▼ View Docs'}
            </button>
          </div>

          {showDocs && (
            <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-default)' }}>
              
              {/* Doc Tabs */}
              <div className="mode-tabs">
                <button 
                  className={`tab-btn ${activeDocTab === 'api' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('api')}
                >
                  API Reference
                </button>
                <button 
                  className={`tab-btn ${activeDocTab === 'features' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('features')}
                >
                  Features
                </button>
                <button 
                  className={`tab-btn ${activeDocTab === 'shortcuts' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('shortcuts')}
                >
                  Shortcuts
                </button>
              </div>

              {/* API Tab Content */}
              {activeDocTab === 'api' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  
                  {/* Endpoint 1 */}
                  <div className="config-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="short-pill" style={{ background: '#2563eb', color: '#fff', border: 'none' }}>POST</span>
                      <code style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>/api/shorten</code>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Shorten a long URL with optional custom alias, password, expiry, or max clicks.
                    </p>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px', position: 'relative' }}>
                      <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
{`curl -X POST http://localhost:3001/api/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "customAlias": "mybrand"}'`}
                      </pre>
                      <button 
                        className="action-btn"
                        style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleCopyCurl(`curl -X POST http://localhost:3001/api/shorten -H "Content-Type: application/json" -d '{"url": "https://example.com", "customAlias": "mybrand"}'`)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Endpoint 2 */}
                  <div className="config-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="short-pill" style={{ background: '#16a34a', color: '#fff', border: 'none' }}>GET</span>
                      <code style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>/api/qr/:shortCode</code>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Generate high-resolution PNG or SVG QR code with ECC Level H fault tolerance.
                    </p>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px', position: 'relative' }}>
                      <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
{`curl "http://localhost:3001/api/qr/mybrand/data?targetMode=direct"`}
                      </pre>
                      <button 
                        className="action-btn"
                        style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleCopyCurl(`curl "http://localhost:3001/api/qr/mybrand/data?targetMode=direct"`)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Feature Specs Tab Content */}
              {activeDocTab === 'features' && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="config-card">
                    <strong style={{ color: 'var(--text-primary)' }}>Password Protection & Rate Limiting</strong>
                    <p style={{ marginTop: '4px' }}>Protected links require password verification before redirecting. The `/verify` endpoint is rate-limited to 5 requests per minute to prevent brute-force attacks.</p>
                  </div>
                  <div className="config-card">
                    <strong style={{ color: 'var(--text-primary)' }}>Expiration & Click Limits</strong>
                    <p style={{ marginTop: '4px' }}>Links can expire by timestamp or when max clicks are reached. Expired links display a styled Error Card instead of raw JSON.</p>
                  </div>
                  <div className="config-card">
                    <strong style={{ color: 'var(--text-primary)' }}>QR Logo Overlay Engine</strong>
                    <p style={{ marginTop: '4px' }}>Center logos use canvas compositing with Error Correction Level H (30% fault tolerance), ensuring 100% scannability on phone cameras.</p>
                  </div>
                </div>
              )}

              {/* Keyboard Shortcuts Tab Content */}
              {activeDocTab === 'shortcuts' && (
                <div className="config-card" style={{ fontSize: '0.875rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'center' }}>
                    <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>Ctrl / Cmd + K</code>
                    <span>Focus long URL input box instantly</span>
                    
                    <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>Ctrl + Enter</code>
                    <span>Submit URL shortening form</span>

                    <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }}>Esc</code>
                    <span>Close open drawers or customizers</span>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Data Backup & Maintenance */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            Data & export
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Export your short links for reports, or clear your local cache.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={handleExportCSV} disabled={exporting}>
              Export CSV
            </button>
            <button className="action-btn" onClick={handleExportJSON} disabled={exporting}>
              Export JSON
            </button>
            <button className="action-btn action-btn-danger" onClick={handleClearHistory}>
              Reset preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
