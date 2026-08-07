import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';

export default function RedirectHandler() {
  const { shortCode } = useParams();

  useEffect(() => {
    // Redirect the browser directly to the backend's redirect endpoint
    // This allows the backend to log the click (IP, User Agent, Referrer)
    // and then issue a 302 redirect to the original URL.
    if (shortCode) {
      window.location.href = api.getRedirectUrl(shortCode);
    }
  }, [shortCode]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
        <h2 style={{ marginTop: '1rem' }}>Redirecting...</h2>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.2); }
              100% { transform: rotate(360deg) scale(1); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
