const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    return data;
  },

  async getAllUrls(page = 1, limit = 20) {
    const res = await fetch(`${API_BASE}/urls?page=${page}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
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
    return data;
  },

  // ── Analytics ───────────────────────────────────
  async getAnalytics(shortCode, range = '7d') {
    const res = await fetch(`${API_BASE}/analytics/${shortCode}?range=${range}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
};

export default api;
