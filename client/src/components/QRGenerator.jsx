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

  // In-memory cache to prevent unnecessary re-fetches
  const cacheRef = useRef(new Map());

  const cacheKey = useMemo(() => {
    return `${shortCode}_${size}_${darkColor}_${lightColor}`;
  }, [shortCode, size, darkColor, lightColor]);

  const fetchQRData = async (forceRefresh = false) => {
    if (!shortCode) {
      setQrData(null);
      setError(null);
      return;
    }

    // Check cache unless forced
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
      const downloadUrl = api.getQRImageUrl(shortCode, {
        size,
        format,
        darkColor,
        lightColor,
        errorCorrection: 'H',
      });

      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${shortCode}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (addToast) {
        addToast(`QR code downloaded as ${format.toUpperCase()}! 📥`, 'success');
      }
    } catch {
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
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        padding: '24px',
        maxWidth: '560px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 200ms ease',
      }}
    >
      {/* Settings / Controls */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
              Size ({size}px)
            </label>
            <input
              type="range"
              min="150"
              max="600"
              step="50"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
              Foreground
            </label>
            <div style={{ display: 'flex', items: 'center', gap: '8px' }}>
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                style={{ width: '32px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748B' }}>{darkColor}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
              Background
            </label>
            <div style={{ display: 'flex', items: 'center', gap: '8px' }}>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                style={{ width: '32px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
              />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748B' }}>{lightColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Image Display Canvas Card */}
      <div
        style={{
          background: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#2563EB' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Generating High-Res QR Code...</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
            <p style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: 600, marginBottom: '12px' }}>{error}</p>
            <button
              onClick={() => fetchQRData(true)}
              style={{ padding: '6px 14px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Retry Generation
            </button>
          </div>
        )}

        {!loading && !error && !qrData && (
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px', opacity: 0.6 }}>📱</div>
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
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                border: '1px solid #CBD5E1',
                marginBottom: '16px',
                transition: 'transform 200ms ease',
              }}
            >
              <img
                src={qrData.qrCode}
                alt="High Resolution QR Code"
                style={{
                  width: `${Math.min(size, 260)}px`,
                  height: `${Math.min(size, 260)}px`,
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
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.8rem',
            color: '#64748B',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px 16px',
          }}
        >
          <div>
            <strong style={{ color: '#0F172A' }}>Short URL: </strong>
            <span style={{ fontFamily: 'monospace', color: '#2563EB', wordBreak: 'break-all' }}>{qrData.shortUrl}</span>
          </div>

          {qrData.customAlias && (
            <div>
              <strong style={{ color: '#0F172A' }}>Custom Alias: </strong>
              <span style={{ fontFamily: 'monospace', color: '#0F172A' }}>/{qrData.customAlias}</span>
            </div>
          )}

          {qrData.createdAt && (
            <div>
              <strong style={{ color: '#0F172A' }}>Created: </strong>
              <span>{formatDate(qrData.createdAt)}</span>
            </div>
          )}

          <div>
            <strong style={{ color: '#0F172A' }}>Resolution: </strong>
            <span>{qrData.size || size} × {qrData.size || size} px (ECC Level H)</span>
          </div>
        </div>
      )}

      {/* Required Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => handleDownload('png')}
          disabled={!qrData || loading}
          style={{
            padding: '10px 14px',
            background: !qrData || loading ? '#CBD5E1' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: !qrData || loading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          📥 Download PNG
        </button>

        <button
          onClick={() => handleDownload('svg')}
          disabled={!qrData || loading}
          style={{
            padding: '10px 14px',
            background: !qrData || loading ? '#F1F5F9' : '#E2E8F0',
            color: '#0F172A',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: !qrData || loading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          📥 Download SVG
        </button>

        <button
          onClick={handleCopyUrl}
          disabled={!qrData || loading}
          style={{
            padding: '10px 14px',
            background: copied ? '#10B981' : !qrData || loading ? '#F1F5F9' : '#E2E8F0',
            color: copied ? '#FFFFFF' : '#0F172A',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: !qrData || loading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {copied ? '✅ Copied!' : '📋 Copy Short URL'}
        </button>

        <button
          onClick={() => fetchQRData(true)}
          disabled={!shortCode || loading}
          style={{
            padding: '10px 14px',
            background: !shortCode || loading ? '#F1F5F9' : '#E2E8F0',
            color: '#0F172A',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: !shortCode || loading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  );
};

export default QRGenerator;
