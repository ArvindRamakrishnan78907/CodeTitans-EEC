import { queryOne, execute, saveDb } from '../models/db.js';
import UAParser from 'ua-parser-js';
import config from '../config/index.js';
import crypto from 'crypto';

/**
 * Redirect short code to original URL + log click
 */
export function redirectToOriginal(req, res) {
  try {
    const { shortCode } = req.params;

    const url = queryOne(
      'SELECT id, original_url, is_active, expires_at FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (!url || !url.is_active) {
      return res.status(404).json({ error: 'Link not found or has been deactivated' });
    }

    // Check expiration
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired' });
    }

    // Log click asynchronously
    setImmediate(() => {
      try {
        logClick(url.id, req);
      } catch (e) {
        console.error('Error logging click:', e);
      }
    });

    // Increment click count
    execute('UPDATE urls SET click_count = click_count + 1 WHERE id = ?', [url.id]);
    saveDb();

    // 302 redirect
    res.redirect(302, url.original_url);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Log a click event with parsed user agent data
 */
function logClick(urlId, req) {
  const ua = new UAParser(req.headers['user-agent']);
  const browser = ua.getBrowser();
  const os = ua.getOS();
  const device = ua.getDevice();

  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

  const deviceType = device.type || 'desktop';
  const referrer = req.headers['referer'] || req.headers['referrer'] || 'direct';

  execute(
    `INSERT INTO clicks (url_id, ip_hash, user_agent, referrer, device_type, browser, os)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      urlId,
      ipHash,
      req.headers['user-agent'] || '',
      referrer,
      deviceType,
      browser.name || 'Unknown',
      os.name || 'Unknown'
    ]
  );
  saveDb();
}
