import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const PortalLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || (user.role !== 'PESERTA' && user.role !== 'INSTRUKTUR')) {
    return <Navigate to="/login" replace />;
  }

  const isInstructor = user.role === 'INSTRUKTUR';

  const menuItems = isInstructor ? [
    { name: 'Dashboard', path: '/portal/instructor', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'Manage Attendance', path: '/portal/instructor/attendance', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' }
  ] : [
    { name: 'Dashboard', path: '/portal/participant', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'My Schedule', path: '/portal/participant/schedule', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' }
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
        
        <nav style={{ flex: 1, padding: '1rem 0' }}>
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
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.profile?.full_name || user.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ width: '100%', padding: '0.5rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '60px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'flex-end' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            Back to Main Site
          </Link>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
