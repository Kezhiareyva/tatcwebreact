import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

const ParticipantSchedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const participantId = user?.profile?.id || 0;
        const res = await apiFetch(`/api/portal/student_dashboard?participant_id=${participantId}`);
        const json = await res.json();
        if (json.success) {
          setSessions(json.data.upcoming_sessions || []);
        }
      } catch (err) {
        console.error('Failed to fetch participant schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.profile) fetchData();
    else setLoading(false);
  }, [user]);

  if (!user?.profile) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <Link to="/portal/participant" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              &larr; Kembali ke Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Jadwal Kelas Saya
          </h1>
        </div>

        <div style={{
          background: 'var(--surface-color)',
          border: '1px dashed var(--border-color)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Profil Peserta Sedang Dipersiapkan
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Jadwal kelas akan muncul di sini setelah profil peserta Anda ditautkan oleh tim administrasi TATC.
          </p>
          <Link to="/portal/participant" className="btn btn-glass" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem' }}>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get distinct programs from sessions
  const programOptions = Array.from(new Set(sessions.map(s => s.program_name).filter(Boolean)));

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredSessions = sessions.filter(s => {
    const matchProgram = selectedProgram === 'ALL' || s.program_name === selectedProgram;
    const q = searchQuery.trim().toLowerCase();
    const matchQuery = !q || [s.title, s.module_name, s.batch_name, s.room_name, s.instructor_name].some(
      v => String(v || '').toLowerCase().includes(q)
    );
    return matchProgram && matchQuery;
  });

  // Calculate stats
  const todayCount = sessions.filter(s => s.session_date === todayStr).length;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <Link to="/portal/participant" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              &larr; Kembali ke Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Jadwal Kelas Saya
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Seluruh agenda dan jadwal sesi kelas mendatang dari semua program pelatihan yang Anda ikuti.
          </p>
        </div>

        {todayCount > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>🔔</span> Ada {todayCount} sesi kelas hari ini!
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: '1 1 400px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari topik sesi, modul, instruktur..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              🔍
            </span>
          </div>

          {/* Program Filter */}
          {programOptions.length > 1 && (
            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            >
              <option value="ALL">Semua Program ({sessions.length})</option>
              {programOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Menampilkan <strong>{filteredSessions.length}</strong> dari {sessions.length} sesi
        </div>
      </div>

      {/* Schedule Content */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuat jadwal kelas...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{
          background: 'var(--surface-color)',
          border: '1px dashed var(--border-color)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Tidak Ada Jadwal Kelas Mendatang
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {sessions.length === 0
              ? 'Anda belum memiliki jadwal kelas aktif. Pastikan Anda telah terdaftar dan diterima pada batch pelatihan.'
              : 'Tidak ada sesi kelas yang cocok dengan filter pencarian Anda.'}
          </p>
          <Link to="/portal/participant" className="btn btn-glass" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem' }}>
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSessions.map((s, idx) => {
            const isToday = s.session_date === todayStr;
            const dateObj = new Date(s.session_date);
            const dateFormatted = dateObj.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });

            return (
              <div key={s.id || idx} style={{
                background: 'var(--surface-color)',
                border: `1px solid ${isToday ? '#3b82f6' : 'var(--border-color)'}`,
                borderLeft: `5px solid ${isToday ? '#3b82f6' : 'var(--primary-color)'}`,
                borderRadius: '14px',
                padding: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: isToday ? '0 4px 14px rgba(59, 130, 246, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: isToday ? '#dbeafe' : 'rgba(0,0,0,0.04)',
                      color: isToday ? '#1d4ed8' : 'var(--text-muted)'
                    }}>
                      {isToday ? '⚡ HARI INI' : 'SESI MENDATANG'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                      {s.program_name} {s.batch_name ? `(${s.batch_name})` : ''}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {s.title}
                  </h3>

                  {s.module_name && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Modul: <strong style={{ color: 'var(--text-main)' }}>{s.module_name}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {s.room_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📍</span> {s.room_name}
                      </div>
                    )}
                    {s.instructor_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👨‍🏫</span> Instruktur: <strong style={{ color: 'var(--text-main)' }}>{s.instructor_name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  minWidth: '200px',
                  background: 'rgba(0,0,0,0.02)',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {dateFormatted}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)} WIB
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: s.status === 'COMPLETED' ? '#dcfce7' : '#f3f4f6',
                      color: s.status === 'COMPLETED' ? '#166534' : '#4b5563'
                    }}>
                      {s.status || 'SCHEDULED'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ParticipantSchedule;
