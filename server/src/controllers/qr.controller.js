import QRCode from 'qrcode';
import config from '../config/index.js';
import { queryOne } from '../models/db.js';

function ensureProtocol(u) {
  if (!u) return '';
  const trimmed = u.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Generate QR code image (PNG/SVG) for a short URL
 */
export async function generateQR(req, res) {
  try {
    const { shortCode } = req.params;
    const {
      size = 300,
      format = 'png',
      darkColor = '#000000',
      lightColor = '#ffffff',
      errorCorrection = 'H',
      targetMode = 'direct',
      clientUrl
    } = req.query;

    const url = queryOne('SELECT id, short_code, original_url, custom_alias, created_at FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const baseUrl = clientUrl || config.clientUrl;
    const shortUrl = `${baseUrl}/${shortCode}`;
    const destinationUrl = ensureProtocol(url.original_url);

    // If targetMode is 'short' but shortUrl is localhost, fallback to direct destination to ensure phone cameras can scan it
    const isLocalhost = shortUrl.includes('localhost') || shortUrl.includes('127.0.0.1');
    const encodedUrl = (targetMode === 'short' && !isLocalhost) ? shortUrl : destinationUrl;

    const qrOptions = {
      width: Math.min(Math.max(parseInt(size) || 300, 100), 1000),
      margin: 4,
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: darkColor,
        light: lightColor
      }
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(encodedUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(encodedUrl, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

/**
 * Get QR code as data URL (base64) with metadata
 */
export async function getQRDataUrl(req, res) {
  try {
    const { shortCode } = req.params;
    const {
      size = 300,
      darkColor = '#000000',
      lightColor = '#ffffff',
      errorCorrection = 'H',
      targetMode = 'direct',
      clientUrl
    } = req.query;

    const url = queryOne('SELECT id, short_code, original_url, custom_alias, created_at FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const baseUrl = clientUrl || config.clientUrl;
    const shortUrl = `${baseUrl}/${shortCode}`;
    const destinationUrl = ensureProtocol(url.original_url);

    // If targetMode is 'short' but shortUrl is localhost, fallback to direct destination to ensure phone cameras can scan it
    const isLocalhost = shortUrl.includes('localhost') || shortUrl.includes('127.0.0.1');
    const encodedUrl = (targetMode === 'short' && !isLocalhost) ? shortUrl : destinationUrl;

    const qrSize = Math.min(Math.max(parseInt(size) || 300, 100), 1000);
    const dataUrl = await QRCode.toDataURL(encodedUrl, {
      width: qrSize,
      margin: 4,
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });

    res.json({
      shortCode,
      shortUrl,
      originalUrl: url.original_url,
      encodedUrl,
      qrCode: dataUrl,
      targetMode,
      size: qrSize,
      createdAt: url.created_at
    });
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    res.status(500).json({ error: 'Failed to generate QR data URL' });
  }
}
