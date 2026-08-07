import { queryAll, queryOne, execute, saveDb } from '../models/db.js';
import { customAlphabet } from 'nanoid';
import { isValidUrl, isValidAlias } from '../utils/urlHelpers.js';
import config from '../config/index.js';
import bcrypt from 'bcryptjs';
import { scanUrl } from '../services/malwareScanner.js';

// Base62 nanoid generator
const generateShortCode = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  config.shortCodeLength
);

/**
/**
 * Create a shortened URL
 */
export async function createShortUrl(req, res) {
  try {
    const { url, customAlias, password, expiresAt, maxClicks } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
    }

    // Malware & Threat Detection (ECR-02)
    const scanResult = await scanUrl(url);
    if (!scanResult.isSafe) {
      return res.status(400).json({ error: scanResult.reason });
    }

    let shortCode;

    if (customAlias) {
      const validation = isValidAlias(customAlias);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
      }

      const existing = queryOne('SELECT id FROM urls WHERE short_code = ?', [customAlias]);
      if (existing) {
        return res.status(409).json({ error: 'This alias is already taken' });
      }

      shortCode = customAlias;
    } else {
      shortCode = generateShortCode();
      let attempts = 0;
      while (queryOne('SELECT id FROM urls WHERE short_code = ?', [shortCode])) {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          return res.status(500).json({ error: 'Failed to generate unique code. Please try again.' });
        }
      }
    }

    // Password Protection (ECR-01)
    let passwordHash = null;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const parsedMaxClicks = maxClicks ? parseInt(maxClicks, 10) : null;
    const finalMaxClicks = parsedMaxClicks > 0 ? parsedMaxClicks : null;

    const result = execute(
      'INSERT INTO urls (short_code, original_url, custom_alias, password_hash, expires_at, max_clicks) VALUES (?, ?, ?, ?, ?, ?)',
      [shortCode, url, customAlias ? 1 : 0, passwordHash, expiresAt || null, finalMaxClicks]
    );
    saveDb();

    const shortUrl = `${config.clientUrl}/${shortCode}`;

    res.status(201).json({
      id: result.lastInsertRowid,
      shortCode,
      shortUrl,
      originalUrl: url,
      customAlias: !!customAlias,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all URLs (paginated)
 */
export function getAllUrls(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const urls = queryAll(
      `SELECT id, short_code, original_url, custom_alias, created_at, click_count, is_active
       FROM urls WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = queryOne('SELECT COUNT(*) as count FROM urls WHERE is_active = 1');

    res.json({
      urls: urls.map(u => ({
        ...u,
        shortUrl: `${config.baseUrl}/r/${u.short_code}`
      })),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get a single URL by short code
 */
export function getUrlByCode(req, res) {
  try {
    const { shortCode } = req.params;

    const url = queryOne(
      `SELECT id, short_code, original_url, custom_alias, created_at, click_count, is_active, password_hash, expires_at, max_clicks
       FROM urls WHERE short_code = ? AND is_active = 1`,
      [shortCode]
    );

    if (!url) {
      return res.status(404).json({ error: 'URL not found or has been deactivated' });
    }

    // Check expiration by date
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This link has expired by date' });
    }

    // Check expiration by max clicks
    if (url.max_clicks !== null && url.click_count >= url.max_clicks) {
      return res.status(410).json({ error: 'This link has reached its maximum click limit' });
    }

    res.json({
      ...url,
      isPasswordProtected: !!url.password_hash,
      password_hash: undefined, // never leak the hash
      shortUrl: `${config.clientUrl}/${url.short_code}`
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete a URL (soft delete)
 */
export function deleteUrl(req, res) {
  try {
    const { shortCode } = req.params;
    const result = execute('UPDATE urls SET is_active = 0 WHERE short_code = ?', [shortCode]);
    saveDb();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check alias availability
 */
export function checkAlias(req, res) {
  try {
    const { alias } = req.params;

    const validation = isValidAlias(alias);
    if (!validation.valid) {
      return res.json({ available: false, reason: validation.reason });
    }

    const existing = queryOne('SELECT id FROM urls WHERE short_code = ?', [alias]);

    res.json({
      available: !existing,
      reason: existing ? 'Alias is already taken' : null
    });
  } catch (error) {
    console.error('Error checking alias:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
