import { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function SettingsPage({ currentTheme, onThemeChange, addToast }) {
  const [defaultExpiry, setDefaultExpiry] = useState(() => localStorage.getItem('sniplink_default_expiry') || 'never');
  const [defaultMaxClicks, setDefaultMaxClicks] = useState(() => localStorage.getItem('sniplink_default_clicks') || '');
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('sniplink_custom_domain') || '');
  const [exporting, setExporting] = useState(false);

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

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ Settings & Preferences</h2>
        <p>Customize your workspace theme, default preferences, and export your data</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '720px' }}>
        
        {/* Appearance Section */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            🎨 Appearance & Theme
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Choose your preferred color theme for the SnipLink interface.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            
            {/* Dark Theme Card */}
            <div 
              className="config-card"
              style={{
                cursor: 'pointer',
                borderColor: currentTheme === 'dark' ? 'var(--accent-primary)' : 'var(--border-default)',
                background: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
              }}
              onClick={() => onThemeChange('dark')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🌙</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Dark Mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Deep glassmorphic dark theme</div>
            </div>

            {/* Light Theme Card */}
            <div 
              className="config-card"
              style={{
                cursor: 'pointer',
                borderColor: currentTheme === 'light' ? 'var(--accent-primary)' : 'var(--border-default)',
                background: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'transparent'
              }}
              onClick={() => onThemeChange('light')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>☀️</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Light Mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Clean, high-contrast light theme</div>
            </div>

          </div>
        </div>

        {/* Default Link Preferences */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            ⚡ Default Link Rules
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
            🌐 Custom Domain Branding
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

        {/* Data Backup & Maintenance */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            💾 Data Backup & Maintenance
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Export your short links for reports, or clear your local cache.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={handleExportCSV} disabled={exporting}>
              📊 Export CSV Report
            </button>
            <button className="action-btn" onClick={handleExportJSON} disabled={exporting}>
              📥 Export JSON Backup
            </button>
            <button className="action-btn action-btn-danger" onClick={handleClearHistory}>
              🗑️ Reset Local Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
