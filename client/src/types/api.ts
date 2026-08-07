export interface ShortenRequest {
  long_url: string;
  custom_alias?: string;
}

export interface ShortenResponse {
  short_url: string;
}

export interface StatsResponse {
  clicks: number;
  longURL: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}
