import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useCopy } from '../hooks/useToast.js';

export default function ShortenPage({ addToast }) {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [aliasStatus, setAliasStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [aliasMessage, setAliasMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [qrData, setQrData] = useState(null);
  const { copied, copy } = useCopy();

  // Load URL history
  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getAllUrls(1, 10);
      setHistory(data.urls || []);
    } catch (e) {
      // silent fail on history load
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Debounced alias check
  useEffect(() => {
    if (!useCustomAlias || !customAlias || customAlias.length < 3) {
      setAliasStatus(null);
      setAliasMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setAliasStatus('checking');
      try {
        const data = await api.checkAlias(customAlias);
        if (data.available) {
          setAliasStatus('available');
          setAliasMessage('Alias is available!');
        } else {
          setAliasStatus('taken');
          setAliasMessage(data.reason || 'Alias is taken');
        }
      } catch {
        setAliasStatus('invalid');
        setAliasMessage('Error checking alias');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customAlias, useCustomAlias]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      addToast('Please enter a URL', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.shortenUrl(
        url.trim(), 
        useCustomAlias ? customAlias : null,
        usePassword ? password : null
      );
      setResult(data);

      // Fetch QR for result
      try {
        const qr = await api.getQRDataUrl(data.shortCode);
        setQrData(qr.qrCode);
      } catch {
        // QR generation failed silently
      }

      addToast('URL shortened successfully! 🎉', 'success');
      setUrl('');
      setCustomAlias('');
      setPassword('');
      loadHistory();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    copy(text);
    addToast('Copied to clipboard! 📋', 'success');
  };

  const handleDelete = async (shortCode) => {
    try {
      await api.deleteUrl(shortCode);
      addToast('URL deleted', 'success');
      loadHistory();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateUrl = (url, max = 50) => {
    return url.length > max ? url.substring(0, max) + '…' : url;
  };

  return (
    <div>
      <div className="page-header">
        <h2>🔗 Shorten URL</h2>
        <p>Transform long URLs into short, shareable links instantly</p>
      </div>

      {/* Main Shortening Form */}
      <form onSubmit={handleSubmit} className="card card-gradient" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
          <label htmlFor="url-input">Paste your long URL</label>
          <div className="input-with-btn">
            <input
              id="url-input"
              type="url"
              className="input input-lg"
              placeholder="https://example.com/very/long/url/that/needs/shortening..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || (useCustomAlias && aliasStatus === 'taken')}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
                  Shortening...
                </span>
              ) : (
                '⚡ Shorten'
              )}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
          {/* Custom Alias Toggle */}
          <div className="toggle-container" style={{ marginBottom: (useCustomAlias || usePassword) ? 'var(--space-md)' : 0 }}>
            <input
              type="checkbox"
              className="toggle"
              id="custom-alias-toggle"
              checked={useCustomAlias}
              onChange={(e) => {
                setUseCustomAlias(e.target.checked);
                if (!e.target.checked) {
                  setCustomAlias('');
                  setAliasStatus(null);
                }
              }}
            />
            <label htmlFor="custom-alias-toggle" className="toggle-label">Use custom alias</label>
          </div>

          {/* Password Toggle */}
          <div className="toggle-container" style={{ marginBottom: (useCustomAlias || usePassword) ? 'var(--space-md)' : 0 }}>
            <input
              type="checkbox"
              className="toggle"
              id="password-toggle"
              checked={usePassword}
              onChange={(e) => {
                setUsePassword(e.target.checked);
                if (!e.target.checked) {
                  setPassword('');
                }
              }}
            />
            <label htmlFor="password-toggle" className="toggle-label">Password protection</label>
          </div>
        </div>

        {/* Advanced Options Inputs */}
        {(useCustomAlias || usePassword) && (
          <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', animation: 'slideUp 0.3s ease' }}>
            
            {useCustomAlias && (
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label htmlFor="alias-input">Custom Alias</label>
                <input
                  id="alias-input"
                  type="text"
                  className={`input ${
                    aliasStatus === 'available' ? 'input-success' :
                    aliasStatus === 'taken' || aliasStatus === 'invalid' ? 'input-error' : ''
                  }`}
                  placeholder="my-custom-alias"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  maxLength={30}
                />
                {aliasStatus === 'checking' && <span className="helper-text">⏳ Checking availability...</span>}
                {aliasStatus === 'available' && <span className="success-text">✅ {aliasMessage}</span>}
                {(aliasStatus === 'taken' || aliasStatus === 'invalid') && <span className="error-text">❌ {aliasMessage}</span>}
                {!aliasStatus && customAlias.length > 0 && customAlias.length < 3 && (
                  <span className="helper-text">Minimum 3 characters</span>
                )}
              </div>
            )}

            {usePassword && (
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label htmlFor="password-input">Password</label>
                <input
                  id="password-input"
                  type="password"
                  className="input"
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                />
                <span className="helper-text">Requires password to visit</span>
              </div>
            )}

          </div>
        )}
      </form>

      {/* Result Card */}
      {result && (
        <div className="url-result">
          <div className="url-result-header">
            <span className="badge badge-success">✨ Created</span>
            {result.customAlias && <span className="badge badge-primary">Custom Alias</span>}
          </div>

          <div className="url-result-short">
            <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
              {result.shortUrl}
            </a>
            <button
              className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => handleCopy(result.shortUrl)}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          <div className="url-result-original">
            🔗 {result.originalUrl}
          </div>

          <div className="url-result-actions">
            {qrData && (
              <div className="qr-image-container" style={{ display: 'inline-block', padding: '8px', borderRadius: '8px' }}>
                <img src={qrData} alt="QR Code" style={{ width: '120px', height: '120px' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL History */}
      <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📜 Recent Links</h3>
          <span className="badge badge-primary">{history.length} links</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <h3>No links yet</h3>
            <p>Shorten your first URL to see it here</p>
          </div>
        ) : (
          <table className="url-table">
            <thead>
              <tr>
                <th>Short URL</th>
                <th>Original URL</th>
                <th>Clicks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.short_code} style={{ animation: 'fadeIn 0.3s ease' }}>
                  <td>
                    <span
                      className="short-code"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCopy(item.shortUrl)}
                      title="Click to copy"
                    >
                      /{item.short_code}
                    </span>
                  </td>
                  <td>
                    <span className="original-url" title={item.original_url}>
                      {truncateUrl(item.original_url)}
                    </span>
                  </td>
                  <td>
                    <span className="click-count">{item.click_count}</span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleCopy(item.shortUrl)}
                        title="Copy"
                      >
                        📋
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(item.short_code)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
