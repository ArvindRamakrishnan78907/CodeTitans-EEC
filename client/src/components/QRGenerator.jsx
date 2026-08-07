import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api.js';

const PRESET_LOGOS = {
  Lightning: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1" width="48" height="48"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  GitHub: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23181717" width="48" height="48"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  Twitter: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231DA1F2" width="48" height="48"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"/></svg>`,
  Camera: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981" width="48" height="48"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>`,
  Web: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2306b6d4" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  Brand: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b" width="48" height="48"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`
};

export const QRGenerator = ({ shortCode, initialSize = 300, addToast }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [size, setSize] = useState(initialSize);

  // Logo & Target Customization States
  const [targetMode, setTargetMode] = useState('direct'); // 'direct' | 'short'
  const [logoSrc, setLogoSrc] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [logoScale, setLogoScale] = useState(0.20);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [compositeDataUrl, setCompositeDataUrl] = useState(null);

  // In-memory cache to prevent unnecessary re-fetches
  const cacheRef = useRef(new Map());

  const cacheKey = useMemo(() => {
    return `${shortCode}_${size}_${darkColor}_${lightColor}_${targetMode}`;
  }, [shortCode, size, darkColor, lightColor, targetMode]);

  const fetchQRData = async (forceRefresh = false) => {
    if (!shortCode) {
      setQrData(null);
      setError(null);
      return;
    }

    if (!forceRefresh && cacheRef.current.has(cacheKey)) {
      setQrData(cacheRef.current.get(cacheKey));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getQRDataUrl(shortCode, {
        size,
        darkColor,
        lightColor,
        targetMode,
        errorCorrection: 'H',
      });

      cacheRef.current.set(cacheKey, data);
      setQrData(data);
      if (addToast) {
        addToast('QR Code generated successfully!', 'success');
      }
    } catch (err) {
      const msg = err.message || 'Failed to generate QR code';
      setError(msg);
      if (addToast) {
        addToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQRData();
    }, 150);
    return () => clearTimeout(timer);
  }, [cacheKey]);

  // Client-side HTML5 Canvas Composite Engine for Center Logo Overlay
  useEffect(() => {
    if (!qrData?.qrCode) {
      setCompositeDataUrl(null);
      return;
    }

    if (!logoSrc) {
      setCompositeDataUrl(qrData.qrCode);
      return;
    }

    const canvas = document.createElement('canvas');
    const renderSize = Math.max(size, 400);
    canvas.width = renderSize;
    canvas.height = renderSize;
    const ctx = canvas.getContext('2d');

    const qrImg = new Image();
    qrImg.crossOrigin = 'Anonymous';
    qrImg.onload = () => {
      // 1. Draw base QR Code
      ctx.drawImage(qrImg, 0, 0, renderSize, renderSize);

      // 2. Compute Logo overlay dimensions
      const logoDimension = renderSize * logoScale;
      const logoX = (renderSize - logoDimension) / 2;
      const logoY = (renderSize - logoDimension) / 2;
      const padding = logoDimension * 0.15;

      // 3. Draw rounded background badge in center
      const bgX = logoX - padding;
      const bgY = logoY - padding;
      const bgW = logoDimension + (padding * 2);
      const bgH = logoDimension + (padding * 2);
      const radius = 10;

      ctx.fillStyle = lightColor || '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, radius);
        ctx.fill();
      } else {
        ctx.fillRect(bgX, bgY, bgW, bgH);
      }

      ctx.strokeStyle = darkColor || '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 4. Render image logo or vector SVG preset
      const logoImg = new Image();
      logoImg.crossOrigin = 'Anonymous';
      logoImg.onload = () => {
        ctx.drawImage(logoImg, logoX, logoY, logoDimension, logoDimension);
        setCompositeDataUrl(canvas.toDataURL('image/png'));
      };
      logoImg.src = logoSrc;
    };
    qrImg.src = qrData.qrCode;
  }, [qrData, logoSrc, logoScale, lightColor, darkColor, size]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (addToast) addToast('Logo image must be under 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoSrc(event.target.result);
      setActivePreset(null);
      if (addToast) addToast('Custom logo applied', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetKey) => {
    if (presetKey === null) {
      setLogoSrc(null);
      setActivePreset(null);
    } else {
      setActivePreset(presetKey);
      setLogoSrc(PRESET_LOGOS[presetKey]);
    }
  };

  const handleCopyImage = async () => {
    const targetUrl = compositeDataUrl || qrData?.qrCode;
    if (!targetUrl) return;

    try {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      if (addToast) addToast('QR Image copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (addToast) addToast('Direct image copy not supported in this browser.', 'error');
    }
  };

  const handleDownload = (format = 'png') => {
    const targetUrl = compositeDataUrl || qrData?.qrCode;
    if (!targetUrl) return;

    if (format === 'svg' && !logoSrc) {
      const svgUrl = api.getQRImageUrl(shortCode, {
        size,
        format: 'svg',
        darkColor,
        lightColor,
        targetMode,
      });
      window.open(svgUrl, '_blank');
    } else {
      try {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = `qr-${shortCode}-${targetMode}-${size}px.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast(`Downloaded ${format.toUpperCase()} QR code!`, 'success');
      } catch {
        if (addToast) addToast(`Failed to download ${format.toUpperCase()} QR code`, 'error');
      }
    }
  };

  return (
    <div className="card" style={{ maxWidth: '580px', width: '100%', margin: '0 auto' }}>
      
      {/* Target Encoding Mode Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
          QR Code Scan Target:
        </label>
        <div className="mode-tabs" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`tab-btn ${targetMode === 'direct' ? 'active' : ''}`}
            onClick={() => setTargetMode('direct')}
            title="Encodes destination URL directly — Guaranteed to scan 100% reliably on phone cameras"
          >
            Direct target URL
          </button>
          <button
            type="button"
            className={`tab-btn ${targetMode === 'short' ? 'active' : ''}`}
            onClick={() => setTargetMode('short')}
            title="Encodes short link redirect URL"
          >
            Short link redirect
          </button>
        </div>
      </div>

      {/* Basic Controls */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Size ({size}px)
            </label>
            <input
              type="range"
              min="150"
              max="600"
              step="50"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Foreground Color Picker */}
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Foreground
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                style={{ width: '32px', height: '32px', border: '1px solid var(--border-default)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{darkColor}</span>
            </div>
          </div>

          {/* Background Color Picker */}
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Background
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                style={{ width: '32px', height: '32px', border: '1px solid var(--border-default)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{lightColor}</span>
            </div>
          </div>
        </div>

        {/* Foreground & Background Swatch Palettes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {/* Foreground Swatches */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Foreground Swatches:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'Black', hex: '#000000' },
                { label: 'Indigo', hex: '#6366f1' },
                { label: 'Emerald', hex: '#10b981' },
                { label: 'Cyan', hex: '#06b6d4' },
                { label: 'Amber', hex: '#f59e0b' },
                { label: 'Rose', hex: '#f43f5e' },
                { label: 'Purple', hex: '#8b5cf6' },
                { label: 'Slate', hex: '#1e293b' }
              ].map(swatch => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setDarkColor(swatch.hex)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: swatch.hex,
                    border: darkColor === swatch.hex ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={`Foreground: ${swatch.label}`}
                />
              ))}
            </div>
          </div>

          {/* Background Swatches */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Background Swatches:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'White', hex: '#ffffff' },
                { label: 'Slate Light', hex: '#f8fafc' },
                { label: 'Grey', hex: '#f1f5f9' },
                { label: 'Cyan Light', hex: '#e0f2fe' },
                { label: 'Indigo Light', hex: '#e0e7ff' },
                { label: 'Soft Yellow', hex: '#fef3c7' },
                { label: 'Pink Light', hex: '#fce7f3' },
                { label: 'Dark Mode', hex: '#0f172a' }
              ].map(swatch => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setLightColor(swatch.hex)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: swatch.hex,
                    border: lightColor === swatch.hex ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={`Background: ${swatch.label}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Customize QR & Add Logo Button */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowCustomizer(!showCustomizer)}
          style={{ width: '100%', marginTop: '16px' }}
        >
          {showCustomizer ? 'Hide customizer' : 'Customize center logo'}
        </button>

        {/* Customizer Panel */}
        {showCustomizer && (
          <div className="config-card" style={{ marginTop: '16px', animation: 'slideDown 0.2s ease-out' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
              Center logo overlay (scannable)
            </h4>

            {/* Presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Preset Vector Logos:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`action-btn ${activePreset === null && !logoSrc ? 'btn-primary' : ''}`}
                  onClick={() => handlePresetSelect(null)}
                >
                  None
                </button>
                {['Lightning', 'GitHub', 'Twitter', 'Camera', 'Web', 'Brand'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className={`action-btn ${activePreset === preset ? 'btn-primary' : ''}`}
                    onClick={() => handlePresetSelect(preset)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Custom Logo */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Upload Custom Image (PNG / JPEG / SVG):
              </label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={handleFileUpload}
                style={{ padding: '8px' }}
              />
            </div>

            {/* Logo Size Scale */}
            {logoSrc && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Logo Size: {Math.round(logoScale * 100)}% of QR width
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.28"
                  step="0.02"
                  value={logoScale}
                  onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Code Display & Preview Canvas */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {loading && !qrData ? (
          <div style={{ padding: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            Generating QR Code...
          </div>
        ) : error ? (
          <div className="error-text" style={{ padding: '20px' }}>{error}</div>
        ) : (compositeDataUrl || qrData?.qrCode) ? (
          <div style={{ display: 'inline-block', padding: '16px', background: lightColor, border: '1px solid var(--border-default)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            <img
              src={compositeDataUrl || qrData.qrCode}
              alt="Generated QR Code"
              style={{
                width: '100%',
                maxWidth: `${size}px`,
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                borderRadius: '8px'
              }}
            />
          </div>
        ) : (
          <div style={{ padding: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
            Select a URL to generate QR code
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
          onClick={handleCopyImage}
          disabled={loading || !qrData}
          style={{ flex: 1, minWidth: '140px' }}
        >
          {copied ? 'Copied image!' : 'Copy image'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleDownload('png')}
          disabled={loading || !qrData}
          style={{ flex: 1, minWidth: '120px' }}
        >
          Download PNG
        </button>

        {!logoSrc && (
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('svg')}
            disabled={loading || !qrData}
            style={{ flex: 1, minWidth: '120px' }}
          >
            Download SVG
          </button>
        )}
      </div>

    </div>
  );
};

export default QRGenerator;
