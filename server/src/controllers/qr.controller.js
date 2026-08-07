import QRCode from 'qrcode';
import config from '../config/index.js';
import { queryOne } from '../models/db.js';

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
      errorCorrection = 'H'
    } = req.query;

    const url = queryOne('SELECT id, short_code, original_url, custom_alias, created_at FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const shortUrl = `${config.clientUrl}/${shortCode}`;
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
      const svg = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(shortUrl, qrOptions);
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
      errorCorrection = 'H'
    } = req.query;

    const url = queryOne('SELECT id, short_code, original_url, custom_alias, created_at FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const shortUrl = `${config.clientUrl}/${shortCode}`;
    const qrSize = Math.min(Math.max(parseInt(size) || 300, 100), 1000);

    const dataUrl = await QRCode.toDataURL(shortUrl, {
      width: qrSize,
      margin: 4,
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });

    res.json({
      qrCode: dataUrl,
      shortUrl,
      shortCode,
      createdAt: url.created_at,
      customAlias: url.custom_alias ? url.short_code : null,
      size: qrSize,
      errorCorrection: 'H'
    });
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
