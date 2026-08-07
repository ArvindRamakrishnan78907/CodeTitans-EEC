import QRCode from 'qrcode';
import config from '../config/index.js';
import { queryOne } from '../models/db.js';

/**
 * Generate QR code for a short URL
 */
export async function generateQR(req, res) {
  try {
    const { shortCode } = req.params;
    const {
      size = 300,
      format = 'png',
      darkColor = '#000000',
      lightColor = '#ffffff',
      errorCorrection = 'M'
    } = req.query;

    const url = queryOne('SELECT id FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const shortUrl = `${config.clientUrl}/${shortCode}`;
    const qrOptions = {
      width: parseInt(size),
      margin: 2,
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
 * Get QR code as data URL (base64)
 */
export async function getQRDataUrl(req, res) {
  try {
    const { shortCode } = req.params;
    const {
      size = 300,
      darkColor = '#000000',
      lightColor = '#ffffff'
    } = req.query;

    const url = queryOne('SELECT id FROM urls WHERE short_code = ? AND is_active = 1', [shortCode]);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const shortUrl = `${config.clientUrl}/${shortCode}`;
    const dataUrl = await QRCode.toDataURL(shortUrl, {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });

    res.json({ qrCode: dataUrl, shortUrl });
  } catch (error) {
    console.error('Error generating QR data URL:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
