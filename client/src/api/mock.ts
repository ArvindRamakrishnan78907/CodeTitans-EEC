import type { ShortenRequest, ShortenResponse, StatsResponse } from '../types/api';
import { API_BASE_URL } from '../config/env';

// In-memory store for mock testing when VITE_USE_MOCK_API=true or fallback mode is enabled
const mockStore = new Map<string, { long_url: string; createdAt: string; clicks: number }>();

// Pre-populate with a demo short code
mockStore.set('demo123', {
  long_url: 'https://github.com/facebook/react',
  createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  clicks: 142,
});

export const mockApi = {
  async shortenUrl(payload: ShortenRequest): Promise<ShortenResponse> {
    await new Promise((res) => setTimeout(res, 600)); // simulate network delay

    // Validate long_url
    try {
      new URL(payload.long_url);
    } catch {
      const err = new Error('Please enter a valid URL');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    let code = payload.custom_alias?.trim();
    if (code) {
      if (mockStore.has(code)) {
        const err = new Error('This alias is already taken, try another');
        (err as unknown as { status: number }).status = 409;
        throw err;
      }
    } else {
      code = Math.random().toString(36).substring(2, 8);
    }

    mockStore.set(code, {
      long_url: payload.long_url,
      createdAt: new Date().toISOString(),
      clicks: Math.floor(Math.random() * 25),
    });

    const cleanBase = API_BASE_URL.replace(/\/$/, '');
    return {
      short_url: `${cleanBase}/${code}`,
    };
  },

  async getStats(shortCode: string): Promise<StatsResponse> {
    await new Promise((res) => setTimeout(res, 500));
    const entry = mockStore.get(shortCode);
    if (!entry) {
      const err = new Error('Short URL not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    return {
      clicks: entry.clicks,
      longURL: entry.long_url,
      createdAt: entry.createdAt,
    };
  },

  getQrCodeUrl(shortCode: string): string {
    // Generate a working SVG QR Code image using a free public API for realistic visual testing
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `${API_BASE_URL}/${shortCode}`
    )}`;
  },
};
