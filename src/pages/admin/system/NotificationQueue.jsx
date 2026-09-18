import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const NotificationQueue = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id) => {
    setMessage('');
    try {
      const res = await apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', id })
      });
      const json = await res.json();
      if (json.success) {
        fetchQueue();
      } else {
        setMessage(json.message);
      }
    } catch (e) {
      setMessage('Gagal mengantrekan ulang.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#fef3c7', color: '#92400e' }}>PENDING</span>;
      case 'PROCESSING': return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#e0f2fe', color: '#075985' }}>PROCESSING</span>;
      case 'SENT': return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#dcfce7', color: '#166534' }}>SENT</span>;
      case 'FAILED': return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b' }}>FAILED</span>;
      default: return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#f1f5f9', color: 'var(--text-muted)' }}>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Notification Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau antrean pengiriman Email dan WhatsApp asinkron.</p>
        </div>
        <button onClick={fetchQueue} className="btn btn-glass" style={{ padding: '8px 16px', borderRadius: '8px' }}>
          &#x21bb; Refresh
        </button>
      </div>

      {message && <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{message}</div>}

      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Penerima</th>
              <th style={{ padding: '1rem' }}>Tipe</th>
              <th style={{ padding: '1rem' }}>Subjek</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Terkirim Pada</th>
              <th style={{ padding: '1rem' }}>Log Error</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && notifications.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : notifications.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada antrean notifikasi.</td></tr>
            ) : notifications.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{n.recipient}</td>
                <td style={{ padding: '1rem' }}>{n.type}</td>
                <td style={{ padding: '1rem' }}>{n.subject}</td>
                <td style={{ padding: '1rem' }}>{getStatusBadge(n.status)}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{n.sent_at || '-'}</td>
                <td style={{ padding: '1rem', color: '#ef4444', fontSize: '0.85rem', maxWidth: '200px' }}>{n.error_message}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {n.status === 'FAILED' && (
                    <button onClick={() => handleRetry(n.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationQueue;
