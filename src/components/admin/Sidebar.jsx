import React from 'react';
import { NavLink } from 'react-router-dom';

const Icon = ({ children }) => (
  <span className="nav-icon" aria-hidden="true">{children}</span>
);

const Sidebar = ({ open = false, onClose }) => {
  const nav = [
    { label: 'Dashboard', to: '/admin', end: true, icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { label: 'Visit Main Site', to: '/', icon: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></> },
    { section: 'Master Data' },
    { label: 'Programs', to: '/admin/master/programs', icon: <><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 3"/></> },
    { label: 'Modules', to: '/admin/master/modules', icon: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></> },
    { label: 'Participants', to: '/admin/participants', icon: <><circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 7.7M19 14a5 5 0 0 1 3 4.5"/></> },
    { label: 'Registrations', to: '/admin/registrations', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
    { label: 'Instructors', to: '/admin/master/instructors', icon: <><circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
    { label: 'Rooms', to: '/admin/master/rooms', icon: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M9 21V10"/></> },
    { section: 'Academic Operations' },
    { label: 'Batches / Classes', to: '/admin/academic/batches', icon: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4M17 2v4M3 9h18"/></> },
    { label: 'Sessions & Schedule', to: '/admin/academic/sessions', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> },
    { label: 'Berita Acara (BAP)', to: '/admin/academic/bap', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></> },
    { label: 'Exams', to: '/admin/academic/exams', icon: <><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></> },
    { label: 'Grades', to: '/admin/academic/grades', icon: <><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/></> },
    { label: 'Certificates', to: '/admin/academic/certificates', icon: <><path d="M7 3h10v18l-5-3-5 3z"/><path d="M9 8h6M9 12h6"/></> },
    { section: 'Content Management' },
    { label: 'Banners', to: '/admin/cms/banners', icon: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m21 16-5-5-8 8"/></> },
    { label: 'Partners', to: '/admin/cms/partners', icon: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0"/></> },
    { label: 'News & Events', to: '/admin/cms/news', icon: <><path d="M5 3h11l3 3v15H5z"/><path d="M16 3v4h4M8 11h8M8 15h6"/></> },
    { section: 'System' },
    { label: 'User Accounts', to: '/admin/system/users', icon: <><circle cx="9" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 11h6M19 8v6"/></> },
    { label: 'Notification Queue', to: '/admin/system/notifications', icon: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></> },
  ];

  return (
    <>
      {open && <button className="sidebar-overlay" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-mark"><img src="/tatc.png" alt="TATC" /></div>
          <div className="brand-copy"><strong>TATC</strong><span>Web Platform</span></div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">×</button>
        </div>
        <div className="sidebar-scroll">
          <nav className="sidebar-nav" aria-label="Admin navigation">
            {nav.map((item, i) => item.section ? (
              <div className="nav-section" key={item.section}>{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg></Icon>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-status"><span className="status-dot" /> System online</div>
          <small>Admin Console · TATC</small>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
