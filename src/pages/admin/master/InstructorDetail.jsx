import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';
import { formatDate, formatTime } from '../../../utils/formatters';

const Field = ({ label, value, wide }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', gridColumn: wide ? '1 / -1' : undefined }}>
    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {label}
    </span>
    <span style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: '500' }}>
      {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
    </span>
  </div>
);

const Section = ({ title, icon, children, action }) => (
  <section style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-hover)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{title}</h2>
      </div>
      {action}
    </div>
    <div style={{ padding: '1.25rem' }}>{children}</div>
  </section>
);

const InstructorDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/admin/instructors/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.message || 'Data tidak ditemukan.');
      } catch {
        setError('Gagal memuat data instruktur.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat detail instruktur...</div>;
  if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!data || !data.profile) return <div style={{ padding: '3rem', textAlign: 'center' }}>Data tidak ditemukan.</div>;

  const { profile, sessions } = data;
  
  let parsedAvail = [];
  try {
    if (profile.availability_json) parsedAvail = JSON.parse(profile.availability_json);
  } catch (e) {
    parsedAvail = [];
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin/master/instructors" className="btn btn-glass" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
          &larr; Kembali
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
          Detail Instruktur
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Kolom Kiri: Profil & Ketersediaan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Section title="Informasi Pribadi" icon="👤">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px dashed var(--border-color)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {profile.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{profile.full_name}</h3>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: profile.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: profile.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                  {profile.status}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <Field label="Email" value={profile.email} />
              <Field label="Nomor Telepon" value={profile.phone} />
              <Field label="Bergabung Sejak" value={profile.created_at ? formatDate(profile.created_at) : null} />
            </div>
          </Section>

          <Section title="Preferensi Jadwal Ketersediaan" icon="🕒">
            {parsedAvail.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {parsedAvail.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{a.day}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.start} - {a.end}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada ketersediaan yang diatur.</p>
            )}
          </Section>
        </div>

        {/* Kolom Kanan: Histori/Jadwal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Section title="Jadwal Mengajar (20 Terakhir)" icon="📅">
            {sessions && sessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((s, i) => (
                  <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.batch_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#3b82f6' }}>
                        {formatDate(s.session_date)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatTime(s.start_time)} - {formatTime(s.end_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada jadwal mengajar yang tercatat.</p>
            )}
          </Section>
        </div>

      </div>
    </div>
  );
};

export default InstructorDetail;
