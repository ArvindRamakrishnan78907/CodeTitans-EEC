import { useState, useEffect } from 'react';
import api from '../services/api.js';
import QRGenerator from '../components/QRGenerator.jsx';

export default function QRPage({ addToast }) {
  const [urls, setUrls] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [loadingUrls, setLoadingUrls] = useState(true);

  useEffect(() => {
    loadUrls();
  }, []);

  const loadUrls = async () => {
    setLoadingUrls(true);
    try {
      const data = await api.getAllUrls(1, 50);
      const list = data.urls || [];
      setUrls(list);
      if (list.length > 0) {
        setSelectedCode(list[0].short_code);
      }
    } catch (e) {
      console.error(e);
      if (addToast) {
        addToast('Failed to load links for QR generation', 'error');
      }
    } finally {
      setLoadingUrls(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>QR Code Generator</h2>
        <p>Generate custom QR codes for your links</p>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Link Selection Selector */}
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Select Shortened Link
            </label>
            {loadingUrls ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading your links...</div>
            ) : (
              <select
                className="input"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose a link --</option>
                {urls.map((u) => (
                  <option key={u.short_code} value={u.short_code}>
                    /{u.short_code} → {u.original_url.length > 50 ? u.original_url.substring(0, 50) + '…' : u.original_url}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Premium QR Generator Component */}
        <QRGenerator
          shortCode={selectedCode}
          initialSize={300}
          addToast={addToast}
        />
      </div>
    </div>
  );
}
