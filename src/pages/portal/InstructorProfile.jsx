import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const Field = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '500' }}>
      {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum diisi</span>}
    </span>
  </div>
);

const Section = ({ title, icon, children }) => (
  <section style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-hover)' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </section>
);

/* ── component ────────────────────────────────────────────────────────────── */
const InstructorProfile = () => {
  const { user, refreshSession } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [message, setMessage]     = useState({ text: '', ok: true });
  const [form, setForm]           = useState({});

  /* fetch ------------------------------------------------------------------ */
  useEffect(() => {
    const load = async () => {
      try {
        const [resP, resDash] = await Promise.all([
          apiFetch('/api/portal/profile'),
          user?.profile?.id
            ? apiFetch(`/api/portal/instructor_dashboard?instructor_id=${user.profile.id}`)
            : Promise.resolve(null),
        ]);

        const jsonP = await resP.json();
        if (jsonP.success) {
          setProfile(jsonP.data);
          setForm(jsonP.data);
        }

        if (resDash) {
          const jsonD = await resDash.json();
          if (jsonD.success) setSessions(jsonD.data.upcoming_sessions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  /* save ------------------------------------------------------------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', ok: true });
    try {
      const res  = await apiFetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.full_name || '', phone: form.phone || '' }),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setForm(json.data);
        setEditing(false);
        setMessage({ text: 'Profil berhasil disimpan.', ok: true });
        await refreshSession();
      } else {
        setMessage({ text: json.message || 'Gagal menyimpan profil.', ok: false });
      }
    } catch {
      setMessage({ text: 'Terjadi kesalahan. Coba lagi.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  /* ── render ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat profil...</div>;
  }

  if (!profile) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Profil instruktur tidak ditemukan. Hubungi administrator.</p>
      </div>
    );
  }

  const todayStr   = new Date().toISOString().split('T')[0];
  const todayCount = sessions.filter(s => s.session_date === todayStr).length;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* ── page header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <Link to="/portal/instructor" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            &larr; Kembali ke Dashboard
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', margin: '0.5rem 0 0.25rem' }}>
            Profil Instruktur
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {user?.email}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setMessage({ text: '', ok: true }); }}
            className="btn btn-primary"
            style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '0.875rem' }}
          >
            ✏️ Edit Profil
          </button>
        )}
      </div>

      {/* flash message */}
      {message.text && (
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', background: message.ok ? '#dcfce7' : '#fee2e2', color: message.ok ? '#166534' : '#991b1b', border: `1px solid ${message.ok ? '#bbf7d0' : '#fecaca'}` }}>
          {message.text}
        </div>
      )}

      {/* ── stats strip ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Sesi Mendatang', value: sessions.length, color: '#10b981' },
          { label: 'Sesi Hari Ini',  value: todayCount,      color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── personal info ─────────────────────────────────────────────────── */}
      <Section title="Data Pribadi" icon="👤">
        {editing ? (
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {[
                { key: 'full_name', label: 'Nama Lengkap', type: 'text', required: true },
                { key: 'phone',     label: 'Nomor Telepon', type: 'text' },
              ].map(({ key, label, type, required }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>
                  <input
                    type={type}
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setEditing(false); setForm(profile); setMessage({ text: '', ok: true }); }}
                style={{ padding: '8px 18px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>
                Batal
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary"
                style={{ padding: '8px 20px', borderRadius: '7px', fontSize: '0.875rem' }}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <Field label="Nama Lengkap"  value={profile.full_name} />
            <Field label="Email"         value={profile.email} />
            <Field label="Nomor Telepon" value={profile.phone} />
            <Field label="Status"        value={profile.status} />
          </div>
        )}
      </Section>

      {/* ── account info (read-only) ───────────────────────────────────────── */}
      <Section title="Informasi Akun" icon="🔐">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <Field label="Email Login" value={user?.email} />
          <Field label="Role"        value="Instruktur" />
          <Field label="Status Akun" value={profile.status} />
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Untuk mengubah email atau kata sandi, hubungi administrator TATC.
        </p>
      </Section>

      {/* ── upcoming sessions ─────────────────────────────────────────────── */}
      <Section title="Jadwal Mengajar Mendatang" icon="📅">
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tidak ada jadwal mengajar yang akan datang.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map(s => {
              const isToday = s.session_date === todayStr;
              return (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '0.75rem',
                  padding: '0.9rem 1rem',
                  background: isToday ? 'rgba(59,130,246,0.05)' : 'var(--surface-hover)',
                  borderRadius: '10px',
                  border: `1px solid ${isToday ? '#bfdbfe' : 'var(--border-color)'}`,
                }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      {isToday && (
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#dbeafe', color: '#1d4ed8' }}>
                          HARI INI
                        </span>
                      )}
                      <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.batch_name}{s.module_name ? ` · ${s.module_name}` : ''}{s.room_name ? ` · ${s.room_name}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {new Date(s.session_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)} WIB
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {sessions.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Link to="/portal/instructor" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
              Lihat semua di Dashboard &rarr;
            </Link>
          </div>
        )}
      </Section>

    </div>
  );
};

export default InstructorProfile;
