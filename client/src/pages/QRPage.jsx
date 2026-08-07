import { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function QRPage({ addToast }) {
  const [urls, setUrls] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [qrData, setQrData] = useState(null);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUrls();
  }, []);

  const loadUrls = async () => {
    try {
      const data = await api.getAllUrls(1, 50);
      setUrls(data.urls || []);
    } catch (e) {
      console.error(e);
    }
  };

  const generateQR = async (code) => {
    if (!code) return;
    setLoading(true);
    try {
      const data = await api.getQRDataUrl(code, { size, darkColor, lightColor });
      setQrData(data);
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (code) => {
    setSelectedCode(code);
    generateQR(code);
  };

  const handleRegenerate = () => {
    if (selectedCode) generateQR(selectedCode);
  };

  const handleDownload = async (format) => {
    if (!selectedCode) return;

    try {
      if (format === 'svg') {
        const url = api.getQRImageUrl(selectedCode, { size, format: 'svg', darkColor, lightColor });
        const res = await fetch(url);
        const blob = await res.blob();
        downloadBlob(blob, `qr-${selectedCode}.svg`);
      } else {
        const url = api.getQRImageUrl(selectedCode, { size, format: 'png', darkColor, lightColor });
        const res = await fetch(url);
        const blob = await res.blob();
        downloadBlob(blob, `qr-${selectedCode}.png`);
      }
      addToast(`QR code downloaded as ${format.toUpperCase()}! 📥`, 'success');
    } catch (error) {
      addToast('Failed to download QR code', 'error');
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h2>📱 QR Generator</h2>
        <p>Generate customizable QR codes for your shortened URLs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Controls Panel */}
        <div className="card card-gradient">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>⚙️ Settings</h3>

          {/* URL Selector */}
          <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label>Select Link</label>
            <select
              className="input"
              value={selectedCode}
              onChange={(e) => handleSelect(e.target.value)}
            >
              <option value="">-- Choose a link --</option>
              {urls.map(u => (
                <option key={u.short_code} value={u.short_code}>
                  /{u.short_code} → {u.original_url.length > 40 ? u.original_url.substring(0, 40) + '…' : u.original_url}
                </option>
              ))}
            </select>
          </div>

          {/* Size Slider */}
          <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label>Size: {size}px</label>
            <input
              type="range"
              min="100"
              max="600"
              step="50"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          {/* Color Pickers */}
          <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Foreground</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  className="color-picker"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {darkColor}
                </span>
              </div>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Background</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  className="color-picker"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {lightColor}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleRegenerate}
              disabled={!selectedCode || loading}
            >
              🔄 Regenerate
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleDownload('png')}
              disabled={!qrData}
            >
              📥 PNG
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleDownload('svg')}
              disabled={!qrData}
            >
              📥 SVG
            </button>
          </div>
        </div>

        {/* QR Preview Panel */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {qrData ? (
            <div className="qr-preview">
              <div className="qr-image-container" style={{ padding: '16px' }}>
                <img
                  src={qrData.qrCode}
                  alt="QR Code"
                  style={{ width: `${Math.min(size, 400)}px`, height: `${Math.min(size, 400)}px`, display: 'block' }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--accent-secondary)',
                  fontWeight: 600
                }}>
                  {qrData.shortUrl}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {size}×{size}px
                </p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📱</div>
              <h3>QR Preview</h3>
              <p>Select a link to generate a QR code</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ animation: 'spin 1s linear infinite' }}>⚡</div>
              <h3>Generating...</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
