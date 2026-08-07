import { queryOne, execute, saveDb } from '../models/db.js';
import UAParser from 'ua-parser-js';
import config from '../config/index.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Verify password for a protected link
 */
export async function verifyPassword(req, res) {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    const url = queryOne(
      'SELECT id, original_url, password_hash, is_active, expires_at, max_clicks, click_count FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (!url || !url.is_active) {
      return res.status(404).json({ error: 'Link not found or has been deactivated' });
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired by date' });
    }

    if (url.max_clicks !== null && url.click_count >= url.max_clicks) {
      return res.status(410).json({ error: 'This link has reached its maximum click limit' });
    }

    if (!url.password_hash) {
      return res.status(400).json({ error: 'This link is not password protected' });
    }

    const isMatch = await bcrypt.compare(password, url.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
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

    res.json({ originalUrl: url.original_url });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Redirect short code to original URL + log click
 */
function sendErrorResponse(req, res, status, title, message) {
  if (req.accepts('html')) {
    return res.status(status).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} — SnipLink</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background: #050505;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: rgba(25, 25, 25, 0.6);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }
          .icon { font-size: 3rem; margin-bottom: 16px; }
          h1 { font-size: 1.5rem; margin: 0 0 10px 0; font-weight: 700; }
          p { color: rgba(255,255,255,0.7); font-size: 0.95rem; margin: 0 0 24px 0; line-height: 1.5; }
          .btn {
            display: inline-block;
            background: #ffffff;
            color: #000000;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            transition: transform 0.2s;
          }
          .btn:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${status === 410 ? '⏳' : '🔍'}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="${config.clientUrl}" class="btn">Go to SnipLink Homepage</a>
        </div>
      </body>
      </html>
    `);
  }
  return res.status(status).json({ error: message });
}

export function redirectToOriginal(req, res) {
  try {
    const { shortCode } = req.params;

    const url = queryOne(
      'SELECT id, original_url, is_active, expires_at, max_clicks, click_count FROM urls WHERE short_code = ?',
      [shortCode]
    );

    if (!url || !url.is_active) {
      return sendErrorResponse(req, res, 404, 'Link Not Found', 'The link you are trying to access does not exist or has been deactivated.');
    }

    // Check expiration by date
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return sendErrorResponse(req, res, 410, 'Link Expired by Date', 'This short link has expired as its set expiration date has passed.');
    }

    // Check expiration by max clicks
    if (url.max_clicks !== null && url.click_count >= url.max_clicks) {
      return sendErrorResponse(req, res, 410, 'Click Limit Reached', 'This short link has reached its maximum allowed click limit.');
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
    sendErrorResponse(req, res, 500, 'Server Error', 'An error occurred while processing your redirect request.');
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
