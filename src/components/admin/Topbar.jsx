import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const title = location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ');
  const displayName = user?.profile?.full_name || user?.name || user?.email?.split('@')[0] || 'Administrator';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" onClick={onMenu} aria-label="Open navigation"><span /><span /><span /></button>
        <div className="breadcrumbs"><span>Admin Console</span><b>/</b><strong>{title}</strong></div>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" onClick={() => setIsDark(v => !v)} aria-label="Toggle theme" title="Toggle theme">
          {isDark ? '☀' : '☾'}
        </button>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen}>
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            <span className="profile-meta"><strong>{displayName}</strong><small>{user?.role || 'Admin'}</small></span>
            <span className="chevron">⌄</span>
          </button>
          {menuOpen && (
            <div className="profile-menu">
              <div className="profile-menu-head"><strong>{displayName}</strong><span>{user?.email}</span></div>
              <button onClick={logout}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Topbar;
