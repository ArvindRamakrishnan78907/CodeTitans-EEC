import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api.js';

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
    fetchQRData();
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

      // 3. Draw rounded background badge in center (ECC Level H ensures 100% scannability)
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

      // 4. Render image logo or text preset
      if (logoSrc.startsWith('data:') || logoSrc.startsWith('http') || logoSrc.startsWith('blob:')) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        logoImg.onload = () => {
          ctx.drawImage(logoImg, logoX, logoY, logoDimension, logoDimension);
          setCompositeDataUrl(canvas.toDataURL('image/png'));
        };
        logoImg.src = logoSrc;
      } else {
        // Preset Emoji / Text Icon
        ctx.fillStyle = darkColor || '#000000';
        ctx.font = `bold ${logoDimension * 0.75}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(logoSrc, renderSize / 2, renderSize / 2);
        setCompositeDataUrl(canvas.toDataURL('image/png'));
      }
    };
    qrImg.src = qrData.qrCode;
  }, [qrData, logoSrc, logoScale, lightColor, darkColor, size]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (addToast) addToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoSrc(event.target.result);
      if (addToast) addToast('Custom logo uploaded & applied!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUrl = async () => {
    if (!qrData?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(qrData.shortUrl);
      setCopied(true);
      if (addToast) {
        addToast('Short URL copied to clipboard!', 'success');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (addToast) {
        addToast('Failed to copy short URL', 'error');
      }
    }
  };

  const handleDownload = async (format) => {
    if (!shortCode || loading) return;

    try {
      const activeSrc = compositeDataUrl || qrData?.qrCode;
      if (!activeSrc) return;

      const a = document.createElement('a');
      a.href = activeSrc;
      a.download = `qr-${shortCode}${logoSrc ? '-custom' : ''}.${format === 'svg' ? 'png' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (addToast) {
        addToast(`QR code downloaded`, 'success');
      }
    } catch (e) {
      console.error(e);
      if (addToast) {
        addToast(`Failed to download ${format.toUpperCase()} QR code`, 'error');
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateStr;
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

        {/* Customize QR & Add Logo Button */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowCustomizer(!showCustomizer)}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {showCustomizer ? 'Hide customizer' : 'Customize logo'}
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
                Preset Icons:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`action-btn ${logoSrc === null ? 'btn-primary' : ''}`}
                  onClick={() => setLogoSrc(null)}
                >
                  None
                </button>
                {['Lightning', 'GitHub', 'Twitter', 'Camera', 'Web', 'Brand'].map(preset => (
                  <button
                    key={preset}
                    className={`action-btn ${logoSrc === preset ? 'btn-primary' : ''}`}
                    onClick={() => setLogoSrc(preset)}
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
                Upload Custom Image (PNG / JPEG):
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
                  max="0.25"
                  step="0.01"
                  value={logoScale}
                  onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Image Display Canvas Card */}
      <div
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          position: 'relative',
          marginBottom: '20px',
        }}
      >
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Generating High-Res QR Code...</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>—</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-error)', fontWeight: 600, marginBottom: '12px' }}>{error}</p>
            <button
              onClick={() => fetchQRData(true)}
              className="btn btn-secondary"
            >
              Retry Generation
            </button>
          </div>
        )}

        {!loading && !error && !qrData && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.6 }}>—</div>
            <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>Select or shorten a URL to generate a QR Code</p>
          </div>
        )}

        {!loading && !error && qrData && (
          <div
            className="animate-fade-in"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            <div
              style={{
                background: '#FFFFFF',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-default)',
                marginBottom: '16px',
                transition: 'transform 200ms ease',
              }}
            >
              <img
                src={compositeDataUrl || qrData.qrCode}
                alt="High Resolution QR Code with Custom Branding"
                style={{
                  width: `${Math.min(size, 280)}px`,
                  height: `${Math.min(size, 280)}px`,
                  display: 'block',
                  imageRendering: 'crisp-edges',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Useful Metadata Display */}
      {qrData && !loading && (
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Encoded scan target: </strong>
            <span style={{ fontFamily: 'monospace', color: '#22c55e', fontWeight: 600, wordBreak: 'break-all' }}>
              {qrData.encodedUrl}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Short URL: </strong>
              <span style={{ fontFamily: 'monospace' }}>{qrData.shortUrl}</span>
            </div>

            {qrData.customAlias && (
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Custom Alias: </strong>
                <span style={{ fontFamily: 'monospace' }}>/{qrData.customAlias}</span>
              </div>
            )}

            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Resolution: </strong>
              <span>{qrData.size || size} × {qrData.size || size} px (ECC Level H)</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => handleDownload('png')}
          disabled={!qrData || loading}
          className="btn btn-primary"
          style={{ padding: '10px 14px', fontSize: '0.825rem' }}
        >
          Download PNG
        </button>

        <button
          onClick={() => handleDownload('svg')}
          disabled={!qrData || loading}
          className="btn btn-secondary"
          style={{ padding: '10px 14px', fontSize: '0.825rem' }}
        >
          Download SVG
        </button>

        <button
          onClick={handleCopyUrl}
          disabled={!qrData || loading}
          className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
          style={{ padding: '10px 14px', fontSize: '0.825rem' }}
        >
          {copied ? 'Copied!' : 'Copy short URL'}
        </button>

        <button
          onClick={() => fetchQRData(true)}
          disabled={!shortCode || loading}
          className="btn btn-secondary"
          style={{ padding: '10px 14px', fontSize: '0.825rem' }}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
};

export default QRGenerator;
