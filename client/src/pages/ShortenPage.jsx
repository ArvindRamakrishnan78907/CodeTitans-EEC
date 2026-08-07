import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useCopy } from '../hooks/useToast.js';

export default function ShortenPage({ addToast }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [useExpiry, setUseExpiry] = useState(false);
  const [maxClicks, setMaxClicks] = useState('');
  const [useMaxClicks, setUseMaxClicks] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [useUtm, setUseUtm] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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
      let isoExpiry = null;
      if (useExpiry && expiresAt) {
        isoExpiry = new Date(expiresAt).toISOString();
      }

      let finalUrl = url.trim();
      if (utmSource || utmMedium || utmCampaign) {
        try {
          const urlObj = new URL(finalUrl.includes('://') ? finalUrl : `http://${finalUrl}`);
          if (utmSource) urlObj.searchParams.set('utm_source', utmSource.trim());
          if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium.trim());
          if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
          finalUrl = urlObj.toString();
        } catch (e) {
          // Ignore invalid URL here
        }
      }

      const data = await api.shortenUrl(
        finalUrl, 
        useCustomAlias ? customAlias : null,
        usePassword ? password : null,
        isoExpiry,
        useMaxClicks && maxClicks ? parseInt(maxClicks, 10) : null
      );
      setResult(data);

      // Fetch QR for result
      try {
        const qr = await api.getQRDataUrl(data.shortCode);
        setQrData(qr.qrCode);
      } catch {
        // QR generation failed silently
      }

      addToast('URL shortened successfully', 'success');
      setUrl('');
      setCustomAlias('');
      setPassword('');
      setExpiresAt('');
      setMaxClicks('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setIsAdvancedOpen(false);
      loadHistory();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    copy(text);
    addToast('Copied to clipboard', 'success');
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
        <h2>Shorten URL</h2>
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
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⭘</span>
                  Shortening...
                </span>
              ) : (
                'Shorten'
              )}
            </button>
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div 
          className="accordion-header" 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          <span className={`accordion-icon ${isAdvancedOpen ? 'open' : ''}`}>▶</span>
          Advanced Options & Customizations
        </div>

        <div className={`accordion-content ${isAdvancedOpen ? 'open' : ''}`}>
          <div className="advanced-grid">
            
            {/* Custom Alias Card */}
            <div className="config-card">
              <div className="config-header">
                <label htmlFor="custom-alias-toggle" style={{ fontWeight: 500, cursor: 'pointer' }}>Custom Alias</label>
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
              </div>
              {useCustomAlias && (
                <div className="config-body">
                  <input
                    type="text"
                    className={`input ${
                      aliasStatus === 'available' ? 'input-success' :
                      aliasStatus === 'taken' || aliasStatus === 'invalid' ? 'input-error' : ''
                    }`}
                    placeholder="my-custom-alias"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    maxLength={30}
                    style={{ width: '100%' }}
                  />
                  {aliasStatus === 'checking' && <div className="helper-text" style={{ marginTop: '4px' }}>Checking availability...</div>}
                  {aliasStatus === 'available' && <div className="success-text" style={{ marginTop: '4px' }}>{aliasMessage}</div>}
                  {(aliasStatus === 'taken' || aliasStatus === 'invalid') && <div className="error-text" style={{ marginTop: '4px' }}>{aliasMessage}</div>}
                </div>
              )}
            </div>

            {/* Password Protection Card */}
            <div className="config-card">
              <div className="config-header">
                <label htmlFor="password-toggle" style={{ fontWeight: 500, cursor: 'pointer' }}>Password Protection</label>
                <input
                  type="checkbox"
                  className="toggle"
                  id="password-toggle"
                  checked={usePassword}
                  onChange={(e) => {
                    setUsePassword(e.target.checked);
                    if (!e.target.checked) setPassword('');
                  }}
                />
              </div>
              {usePassword && (
                <div className="config-body">
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={4}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            {/* Expiration Date Card */}
            <div className="config-card">
              <div className="config-header">
                <label htmlFor="expiry-toggle" style={{ fontWeight: 500, cursor: 'pointer' }}>Expiration Date</label>
                <input
                  type="checkbox"
                  className="toggle"
                  id="expiry-toggle"
                  checked={useExpiry}
                  onChange={(e) => {
                    setUseExpiry(e.target.checked);
                    if (!e.target.checked) setExpiresAt('');
                  }}
                />
              </div>
              {useExpiry && (
                <div className="config-body">
                  <input
                    type="datetime-local"
                    className="input"
                    value={expiresAt}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            {/* Click Limit Card */}
            <div className="config-card">
              <div className="config-header">
                <label htmlFor="max-clicks-toggle" style={{ fontWeight: 500, cursor: 'pointer' }}>Maximum Clicks Limit</label>
                <input
                  type="checkbox"
                  className="toggle"
                  id="max-clicks-toggle"
                  checked={useMaxClicks}
                  onChange={(e) => {
                    setUseMaxClicks(e.target.checked);
                    if (!e.target.checked) setMaxClicks('');
                  }}
                />
              </div>
              {useMaxClicks && (
                <div className="config-body">
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 100"
                    value={maxClicks}
                    min={1}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            {/* UTM Tag Builder Card */}
            <div className="config-card" style={{ gridColumn: '1 / -1' }}>
              <div className="config-header">
                <label htmlFor="utm-toggle" style={{ fontWeight: 500, cursor: 'pointer' }}>UTM Tag Builder (Analytics)</label>
                <input
                  type="checkbox"
                  className="toggle"
                  id="utm-toggle"
                  checked={useUtm}
                  onChange={(e) => {
                    setUseUtm(e.target.checked);
                    if (!e.target.checked) {
                      setUtmSource('');
                      setUtmMedium('');
                      setUtmCampaign('');
                    }
                  }}
                />
              </div>
              {useUtm && (
                <div className="config-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Campaign</label>
                    <input type="text" className="input" placeholder="e.g. summer_sale" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Source</label>
                    <input type="text" className="input" placeholder="e.g. newsletter" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Medium</label>
                    <input type="text" className="input" placeholder="e.g. email" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
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
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div className="flex items-center gap-sm">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📜 Recent Links</h3>
            <span className="click-badge" style={{ fontSize: '0.85rem' }}>{history.length} links</span>
          </div>

          {/* Search bar */}
          {history.length > 0 && (
            <div style={{ maxWidth: '280px', width: '100%' }}>
              <input
                type="text"
                className="input"
                placeholder="🔍 Search recent links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <h3>No links yet</h3>
            <p>Shorten your first URL to see it here</p>
          </div>
        ) : (
          <div className="url-list">
            {history
              .filter(item => 
                item.short_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.original_url.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item) => (
                <div key={item.short_code} className="url-item-card">
                  <div className="url-item-row">
                    <div className="url-item-left">
                      <span
                        className="short-pill"
                        onClick={() => handleCopy(item.shortUrl)}
                        title="Click to copy short link"
                      >
                        /{item.short_code}
                      </span>
                      <span className="click-badge">
                        🔥 {item.click_count} {item.click_count === 1 ? 'click' : 'clicks'}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div className="url-item-actions">
                      <button
                        className="action-btn"
                        onClick={() => handleCopy(item.shortUrl)}
                        title="Copy short link"
                      >
                        📋 Copy
                      </button>
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn"
                        title="Visit original URL"
                      >
                        ↗️ Open
                      </a>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/qr')}
                        title="Generate QR code"
                      >
                        📱 QR
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/analytics')}
                        title="View analytics"
                      >
                        📊 Stats
                      </button>
                      <button
                        className="action-btn action-btn-danger"
                        onClick={() => handleDelete(item.short_code)}
                        title="Delete link"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="url-item-original" title={item.original_url}>
                    🔗 {item.original_url}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
