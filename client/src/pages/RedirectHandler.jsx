import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function RedirectHandler() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function checkUrl() {
      if (!shortCode) return;
      try {
        const data = await api.getUrl(shortCode);
        if (data.isPasswordProtected) {
          setNeedsPassword(true);
          setLoading(false);
        } else {
          // If no password needed, just hit the standard redirect endpoint to log click and 302 redirect
          window.location.href = api.getRedirectUrl(shortCode);
        }
      } catch (err) {
        setError('Link not found or deactivated');
        setLoading(false);
      }
    }
    checkUrl();
  }, [shortCode]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      // This endpoint logs the click and returns the original URL
      const data = await api.verifyPassword(shortCode, password);
      window.location.href = data.originalUrl;
    } catch (err) {
      setError(err.message || 'Incorrect password');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⭘</div>
          <h2 style={{ marginTop: '1rem' }}>Redirecting...</h2>
        </div>
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
    );
  }

  if (needsPassword) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <form onSubmit={handlePasswordSubmit} className="card card-gradient" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h2>Protected Link</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This link requires a password to access.</p>
          
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <input 
              type="password" 
              className="input input-lg" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <span className="error-text" style={{ marginTop: '0.5rem' }}>{error}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={verifying || !password}>
            {verifying ? 'Verifying...' : 'Unlock Link'}
          </button>
        </form>
      </div>
    );
  }

  // Fallback error state if not loading and not needing password (e.g. 404 or 410 Expired)
  const isExpired = error && (error.toLowerCase().includes('expired') || error.toLowerCase().includes('limit'));
  
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-error)' }}>—</div>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
          {isExpired ? 'Link Expired' : 'Link Unavailable'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {error || 'The link you are trying to access does not exist or has been deactivated.'}
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%', padding: '12px 20px', borderRadius: '12px' }}>
          Go to Homepage
        </button>
      </div>
    </div>
  );
}
