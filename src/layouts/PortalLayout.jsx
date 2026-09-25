import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const PortalLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user || (user.role !== 'PESERTA' && user.role !== 'INSTRUKTUR')) {
    return <Navigate to="/login" replace />;
  }

  const isInstructor = user.role === 'INSTRUKTUR';
  const displayName = user.profile?.full_name || user.name || user.email?.split('@')[0] || 'User';
  const profilePath = isInstructor ? '/portal/instructor/profile' : '/portal/participant/profile';

  const menuItems = isInstructor ? [
    { name: 'Dashboard',         path: '/portal/instructor',           icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'Berita Acara (BAP)', path: '/portal/instructor/bap',       icon: 'M9 12h6 M9 16h6 M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z' },
    { name: 'Manage Attendance', path: '/portal/instructor/attendance', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { name: 'Profil Saya',       path: '/portal/instructor/profile',   icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  ] : [
    { name: 'Dashboard',   path: '/portal/participant',          icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'My Schedule', path: '/portal/participant/schedule', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
    { name: 'Profil Saya', path: '/portal/participant/profile',  icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  ];

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background-color)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: '250px', background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/Logo2.png" alt="TATC" style={{ height: '36px', borderRadius: '50%' }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>TATC Portal</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isInstructor ? 'Instructor' : 'Participant'}</div>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0', display: 'flex', flexDirection: 'column' }}>
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', 
                color: location.pathname === item.path ? 'var(--primary-color)' : 'var(--text-main)', 
                background: location.pathname === item.path ? 'var(--surface-hover)' : 'transparent',
                textDecoration: 'none', fontWeight: location.pathname === item.path ? '600' : '500',
                borderRight: location.pathname === item.path ? '3px solid var(--primary-color)' : 'none'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : 'M' + d} />)}
              </svg>
              {item.name}
            </Link>
          ))}

          {/* Logout button — di bawah nav items */}
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1.5rem', marginTop: 'auto',
              background: 'transparent', border: 'none', borderTop: '1px solid var(--border-color)',
              color: '#ef4444', cursor: 'pointer', fontWeight: '500', fontSize: '1rem',
              width: '100%', textAlign: 'left',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '60px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', flexShrink: 0 }}>
          {/* Left: back to site */}
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Beranda
          </Link>

          {/* Right: profile dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileMenuOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-main)' }}
              aria-expanded={profileMenuOpen}
            >
              <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
                <strong style={{ fontSize: '0.85rem' }}>{displayName}</strong>
                <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isInstructor ? 'Instruktur' : 'Peserta'}</small>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '2px' }}>⌄</span>
            </button>

            {profileMenuOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div onClick={() => setProfileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '200px', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)' }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>{displayName}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
                  </div>
                  <Link
                    to={profilePath}
                    onClick={() => setProfileMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.875rem' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Lihat Profil
                  </Link>
                  <button
                    onClick={async () => { setProfileMenuOpen(false); await logout(); navigate('/login'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderTop: '1px solid var(--border-color)', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
