import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { formatDate, formatTime } from '../../utils/formatters';
import WeeklySchedule from '../../components/portal/WeeklySchedule';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instructorId = user.profile?.id || 0;
        const res = await apiFetch(`/api/portal/instructor_dashboard?instructor_id=${instructorId}`);
        const json = await res.json();
        if (json.success) {
          setSessions(json.data.upcoming_sessions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.profile) fetchData();
    else setLoading(false);
  }, [user]);

  // All sessions from start of current week → for the weekly grid
  const gridSessions = sessions;

  // Only sessions from today onward → for the list below the grid
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingSessions = sessions.filter(s => {
    const d = new Date(String(s.session_date).slice(0, 10));
    return d >= todayStart;
  });

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

  if (!user.profile) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Profile Not Linked</h2>
        <p style={{ color: 'var(--text-muted)' }}>Akun Anda belum ditautkan dengan data Instruktur. Silakan hubungi Administrator.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Instructor Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome back, {user.profile.full_name}</p>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Assigned Sessions</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{upcomingSessions.length}</div>
        </div>
        <div style={{ flex: '1 1 200px', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Link to="/portal/instructor/materials" className="btn btn-glass" style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none' }}>
            Manage Materials &rarr;
          </Link>
        </div>
      </div>

      {/* Weekly Grid */}
      <div style={{ marginBottom: '3rem' }}>
        <WeeklySchedule sessions={gridSessions} />
      </div>

      {/* Upcoming List */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>Upcoming Teaching Schedule (List)</h2>

      {upcomingSessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Tidak ada jadwal mengajar dalam waktu dekat.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tanggal</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Waktu</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Materi / Modul</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Batch</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ruangan</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSessions.map((s, idx) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: idx === upcomingSessions.length - 1 ? 'none' : '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981', background: '#d1fae5', padding: '4px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(s.session_date)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{formatTime(s.start_time)} - {formatTime(s.end_time)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{s.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.module_name}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{s.batch_name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{s.room_name || 'TBA'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
