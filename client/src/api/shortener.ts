import { apiClient } from './client';
import type { ShortenRequest, ShortenResponse, StatsResponse } from '../types/api';
import { API_BASE_URL, USE_MOCK_API } from '../config/env';
import { mockApi } from './mock';

export let isMockModeActive = USE_MOCK_API;

export const setMockModeActive = (active: boolean) => {
  isMockModeActive = active;
};

export const shortenerApi = {
  async shortenUrl(payload: ShortenRequest): Promise<ShortenResponse> {
    if (isMockModeActive) {
      return mockApi.shortenUrl(payload);
    }
    try {
      const response = await apiClient.post<ShortenResponse>('/shorten', payload);
      return response.data;
    } catch (error) {
      // If network connection failed (backend not running), offer graceful mock fallback hint or throw error
      throw error;
    }
  },

  async getStats(shortCode: string): Promise<StatsResponse> {
    if (isMockModeActive) {
      return mockApi.getStats(shortCode);
    }
    const response = await apiClient.get<StatsResponse>(`/${shortCode}/stats`);
    return response.data;
  },

  getQrCodeUrl(shortCode: string): string {
    const cleanBase = API_BASE_URL.replace(/\/$/, '');
    if (isMockModeActive) {
      return mockApi.getQrCodeUrl(shortCode);
    }
    return `${cleanBase}/${shortCode}/qrcode`;
  },
};
