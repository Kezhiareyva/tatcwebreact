import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function SuperAdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic auth check
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'superadmin') {
      navigate('/'); // Or an unauthorized page
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background-main)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--text-main)', color: 'var(--surface-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/tatc.png" alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 0' }}>
          <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', borderLeft: '4px solid var(--primary-color)', color: 'var(--surface-color)', cursor: 'pointer' }}>
            Dashboard Overview
          </div>
          <div style={{ padding: '0.75rem 1.5rem', color: '#94a3b8', cursor: 'pointer' }}>
            User Management
          </div>
          <div style={{ padding: '0.75rem 1.5rem', color: '#94a3b8', cursor: 'pointer' }}>
            System Settings
          </div>
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--border-color)' }}>
            Logged in as:<br /><strong>{user.username}</strong>
          </div>
          <button onClick={handleLogout} className="btn" style={{ background: '#ef4444', color: 'var(--surface-color)', width: '100%', padding: '8px' }}>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'var(--surface-color)', padding: '1.5rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Super Admin Dashboard</h1>
          <span style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: '#2563eb', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>Role: Super Admin</span>
        </header>

        <div style={{ padding: '2rem', flex: 1 }}>
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Welcome back, {user.username}!</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              This is the Super Admin control panel. From here, you have full access to manage all users (Admins, Instructors, Participants), configure system settings, and oversee all activities on the TATC platform.
            </p>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
              Your email: <strong>{user.email}</strong><br />
              Status: <strong style={{ color: '#10b981' }}>{user.status_approve}</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
