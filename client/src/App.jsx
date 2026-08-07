import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useToast } from './hooks/useToast.js';
import ShortenPage from './pages/ShortenPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import QRPage from './pages/QRPage.jsx';
import './index.css';

function App() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>
            <div>
              <h1>SnipLink</h1>
              <span>URL Shortener</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <span className="nav-icon">🔗</span>
              Shorten URL
            </NavLink>
            <NavLink
              to="/qr"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">📱</span>
              QR Generator
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              Analytics
            </NavLink>
          </nav>

          {/* Sidebar footer */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-md)',
            marginTop: 'auto'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center'
            }}>
              Mission Alpha v1.0
              <br />
              <span style={{ color: 'var(--accent-primary)' }}>Priority 1</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ShortenPage addToast={addToast} />} />
            <Route path="/qr" element={<QRPage addToast={addToast} />} />
            <Route path="/analytics" element={<AnalyticsPage addToast={addToast} />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`toast ${toast.type}`}>
                <span className="toast-message">
                  {toast.type === 'success' ? '✅' : '❌'} {toast.message}
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
