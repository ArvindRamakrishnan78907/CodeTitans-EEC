// In production: use VITE_API_URL env var
// In development: proxy through Vite to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const REDIRECT_BASE = import.meta.env.VITE_REDIRECT_URL || 'http://localhost:3001';

// Always use the frontend's actual domain so there's never a "localhost" leak in production
function formatShortUrl(shortCode) {
  return `${window.location.origin}/${shortCode}`;
}

/**
 * API service for communicating with the URL Shortener backend
 */
const api = {
  // ── URL Shortening ──────────────────────────────
  async shortenUrl(url, customAlias = null) {
    const body = { url };
    if (customAlias) body.customAlias = customAlias;

    const res = await fetch(`${API_BASE}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to shorten URL');
    data.shortUrl = formatShortUrl(data.shortCode);
    return data;
  },

  async getAllUrls(page = 1, limit = 20) {
    const res = await fetch(`${API_BASE}/urls?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    // Override shortUrl for all items
    if (data.urls) {
      data.urls = data.urls.map(u => ({ ...u, shortUrl: formatShortUrl(u.short_code) }));
    }
    return data;
  },

  async deleteUrl(shortCode) {
    const res = await fetch(`${API_BASE}/urls/${shortCode}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async checkAlias(alias) {
    const res = await fetch(`${API_BASE}/check-alias/${alias}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  // ── QR Code ─────────────────────────────────────
  getQRImageUrl(shortCode, options = {}) {
    const params = new URLSearchParams();
    if (options.size) params.set('size', options.size);
    if (options.format) params.set('format', options.format);
    if (options.darkColor) params.set('darkColor', options.darkColor);
    if (options.lightColor) params.set('lightColor', options.lightColor);
    return `${API_BASE}/qr/${shortCode}?${params.toString()}`;
  },

  async getQRDataUrl(shortCode, options = {}) {
    const params = new URLSearchParams();
    if (options.size) params.set('size', options.size);
    if (options.darkColor) params.set('darkColor', options.darkColor);
    if (options.lightColor) params.set('lightColor', options.lightColor);

    const res = await fetch(`${API_BASE}/qr/${shortCode}/data?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    // Ensure the returned shortUrl is localized to the frontend domain
    data.shortUrl = formatShortUrl(shortCode);
    return data;
  },

  // ── Analytics ───────────────────────────────────
  async getAnalytics(shortCode, range = '7d') {
    const res = await fetch(`${API_BASE}/analytics/${shortCode}?range=${range}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    if (data.url) data.url.shortUrl = formatShortUrl(data.url.short_code);
    return data;
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    if (data.recentUrls) {
      data.recentUrls = data.recentUrls.map(u => ({ ...u, shortUrl: formatShortUrl(u.short_code) }));
    }
    if (data.topUrls) {
      data.topUrls = data.topUrls.map(u => ({ ...u, shortUrl: formatShortUrl(u.short_code) }));
    }
    return data;
  },

  // ── Helpers ─────────────────────────────────────
  getRedirectUrl(shortCode) {
    return `${REDIRECT_BASE}/r/${shortCode}`;
  }
};

export default api;
