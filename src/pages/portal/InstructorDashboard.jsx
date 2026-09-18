import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

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
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Instructor Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome back, {user.profile.full_name}</p>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Assigned Sessions</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{sessions.length}</div>
        </div>
        <div style={{ flex: '1 1 200px', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Link to="/portal/instructor/attendance" className="btn btn-primary" style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', marginBottom: '0.5rem' }}>
            Attendance Manager &rarr;
          </Link>
          <Link to="/portal/instructor/materials" className="btn btn-glass" style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none' }}>
            Manage Materials &rarr;
          </Link>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>Upcoming Teaching Schedule</h2>

      {sessions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Tidak ada jadwal mengajar.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', borderTop: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981', background: '#d1fae5', padding: '4px 8px', borderRadius: '12px' }}>{s.session_date}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.start_time} - {s.end_time}</span>
              </div>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{s.module_name}</p>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '0.25rem' }}><strong>Batch:</strong> {s.batch_name}</div>
                <div><strong>Room:</strong> {s.room_name || 'TBA'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
