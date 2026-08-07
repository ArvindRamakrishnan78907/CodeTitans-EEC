import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/env';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response) {
      const status = error.response.status;
      const backendMessage = error.response.data?.message || error.response.data?.error;

      if (status === 400) {
        return Promise.reject(new Error(backendMessage || 'Please enter a valid URL'));
      }
      if (status === 409) {
        return Promise.reject(new Error(backendMessage || 'This alias is already taken, try another'));
      }
      if (status === 404) {
        return Promise.reject(new Error(backendMessage || 'Short URL not found'));
      }
      return Promise.reject(new Error(backendMessage || `Server error (${status}). Please try again later.`));
    } else if (error.request) {
      return Promise.reject(
        new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure the backend is running.`)
      );
    }
    return Promise.reject(error);
  }
);
