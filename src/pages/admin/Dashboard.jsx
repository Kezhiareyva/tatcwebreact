import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

const StatCard = ({ label, value, hint, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState({ stats: {}, recent_activities: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gagal mengambil statistik.');
      setData(json.data || { stats: {}, recent_activities: [] });
    } catch (err) {
      setError(err.message || 'Dashboard tidak dapat memuat data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  const { stats, recent_activities = [] } = data;

  return <>
    <div className="page-header page-header-rich">
      <div><span className="eyebrow">TATC Web Platform</span><h1 className="page-title">Dashboard</h1><p>Ringkasan operasional dan aktivitas terbaru hari ini.</p></div>
      <button className="btn btn-glass" onClick={fetchStats}>↻ Refresh</button>
    </div>

    {error && <div className="alert alert-error"><strong>Data belum tersedia.</strong><span>{error}</span></div>}

    <section className="stats-grid">
      <StatCard label="Participants" value={loading ? '—' : (stats.total_participants || 0)} hint="Total peserta terdaftar" icon="◉" />
      <StatCard label="Active batches" value={loading ? '—' : (stats.active_batches || 0)} hint="Batch sedang berjalan" icon="▣" />
      <StatCard label="Instructors" value={loading ? '—' : (stats.total_instructors || 0)} hint="Instruktur aktif" icon="◎" />
      <StatCard label="System status" value="Online" hint="API & dashboard ready" icon="✓" />
    </section>

    <section className="dashboard-grid">
      <div className="panel activity-panel">
        <div className="panel-head"><div><h2>Recent activity</h2><p>Aktivitas terbaru yang tercatat di sistem.</p></div><span className="live-pill"><i /> Live</span></div>
        {loading ? <div className="skeleton-list">{[1, 2, 3, 4].map(i => <div className="skeleton-row" key={i}><span /><div><b /><em /></div></div>)}</div> : recent_activities.length === 0 ? <div className="empty-state"><span>◌</span><strong>Belum ada aktivitas</strong><p>Aktivitas baru akan muncul di sini.</p></div> : <div className="activity-list">{recent_activities.map((act, i) => <div className="activity-item" key={i}><span className="activity-dot" /><div><strong>{act.description}</strong><small>{act.time}</small></div></div>)}</div>}
      </div>
      <div className="panel quick-panel">
        <div className="panel-head"><div><h2>Quick actions</h2><p>Akses cepat ke pekerjaan utama.</p></div></div>
        <div className="quick-actions">
          <Link to="/admin/participants"><span>👥</span><div><strong>Participants</strong><small>Kelola data peserta</small></div><b>→</b></Link>
          <Link to="/admin/academic/sessions"><span>◷</span><div><strong>Schedule</strong><small>Atur sesi pembelajaran</small></div><b>→</b></Link>
          <Link to="/admin/academic/grades"><span>⌁</span><div><strong>Grades</strong><small>Input & review nilai</small></div><b>→</b></Link>
          <Link to="/admin/academic/certificates"><span>◇</span><div><strong>Certificates</strong><small>Kelola sertifikasi</small></div><b>→</b></Link>
        </div>
      </div>
    </section>
  </>;
};
export default Dashboard;
