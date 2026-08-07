import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useToast } from './hooks/useToast.js';
import ShortenPage from './pages/ShortenPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import QRPage from './pages/QRPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import RedirectHandler from './pages/RedirectHandler.jsx';
import './index.css';

function App() {
  const { toasts, addToast, removeToast } = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem('sniplink_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('sniplink_theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div>
              <h1>SnipLink</h1>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <svg className="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Links
            </NavLink>
            <NavLink
              to="/qr"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg className="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              QR Codes
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg className="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              Analytics
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg className="nav-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </NavLink>
          </nav>

          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-md)',
            marginTop: 'auto'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              v1.2.0
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ShortenPage addToast={addToast} />} />
            <Route path="/qr" element={<QRPage addToast={addToast} />} />
            <Route path="/analytics" element={<AnalyticsPage addToast={addToast} />} />
            <Route path="/settings" element={<SettingsPage currentTheme={theme} onThemeChange={handleThemeChange} addToast={addToast} />} />
            <Route path="/:shortCode" element={<RedirectHandler />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`toast ${toast.type}`}>
                <span className="toast-message">
                  {toast.message}
                </span>
                <button className="toast-close" onClick={() => removeToast(toast.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
