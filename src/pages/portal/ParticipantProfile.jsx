import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const Field = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </span>
    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '500' }}>
      {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum diisi</span>}
    </span>
  </div>
);

const FormField = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border-color)',
  background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem',
};

const selectStyle = {
  ...inputStyle, background: 'var(--surface-color)',
};

const Section = ({ title, icon, children }) => (
  <section style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-hover)' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem' }}>{children}</div>
  </section>
);

const CompletionBar = ({ profile }) => {
  const fields = ['full_name', 'nik', 'phone', 'birth_place', 'birth_date', 'gender', 'marital_status', 'address', 'occupation', 'institution'];
  const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '').length;
  const pct = Math.round((filled / fields.length) * 100);
  const color = pct < 40 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Kelengkapan Profil</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color }}>{pct}%</span>
        </div>
        <div style={{ height: '8px', borderRadius: '99px', background: 'var(--border-color)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, transition: 'width 0.4s ease' }} />
        </div>
      </div>
      {pct < 100 && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filled}/{fields.length} field terisi · Lengkapi profil untuk memudahkan pendaftaran pelatihan
        </span>
      )}
    </div>
  );
};

/* ── component ────────────────────────────────────────────────────────────── */
const ParticipantProfile = () => {
  const { user, refreshSession } = useAuth();

  const [profile, setProfile]    = useState(null);
  const [batches, setBatches]    = useState([]);
  const [certificates, setCerts] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [editing, setEditing]    = useState(false);
  const [saving, setSaving]      = useState(false);
  const [message, setMessage]    = useState({ text: '', ok: true });
  const [form, setForm]          = useState({});

  /* ── fetch ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const resP = await apiFetch('/api/portal/profile');
        const jsonP = await resP.json();
        if (jsonP.success) {
          setProfile(jsonP.data);
          setForm(jsonP.data);
        }

        // dashboard data (batches)
        const resDash = await apiFetch('/api/portal/student_dashboard').catch(() => null);
        if (resDash) {
          const jsonD = await resDash.json().catch(() => ({}));
          if (jsonD.success) setBatches(jsonD.data.batches || []);
        }

        // certificates via portal
        const resC = await apiFetch('/api/portal/certificates').catch(() => null);
        if (resC) {
          const jsonC = await resC.json().catch(() => ({}));
          if (jsonC.success) setCerts(jsonC.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── save ───────────────────────────────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', ok: true });
    try {
      const payload = {
        full_name:      form.full_name      || '',
        nik:            form.nik            || '',
        birth_place:    form.birth_place    || '',
        birth_date:     form.birth_date     || '',
        gender:         form.gender         || '',
        marital_status: form.marital_status || '',
        phone:          form.phone          || '',
        address:        form.address        || '',
        occupation:     form.occupation     || '',
        institution:    form.institution    || '',
      };
      const res  = await apiFetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const f = (key) => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  /* ── derived ────────────────────────────────────────────────────────────── */
  const pastBatches   = batches.filter(b => b.status === 'COMPLETED' || b.enrollment_status === 'COMPLETED');
  const activeBatches = batches.filter(b => b.status !== 'COMPLETED' && b.enrollment_status !== 'COMPLETED');
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ── loading / empty ────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat profil...</div>
  );
  if (!profile) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Profil tidak ditemukan.</div>
  );

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '960px', margin: '0 auto' }}>

      {/* ── header card ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* avatar */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '800', flexShrink: 0 }}>
          {initials}
        </div>
        {/* info */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
            {profile.full_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nama belum diisi</span>}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>ID: <strong style={{ color: 'var(--text-main)' }}>{profile.participant_number || '-'}</strong></span>
            {profile.occupation && <span>· {profile.occupation}{profile.institution ? ` @ ${profile.institution}` : ''}</span>}
            <span>· {user?.email}</span>
          </div>
        </div>
        {/* edit button */}
        {!editing && (
          <button
            onClick={() => { setEditing(true); setMessage({ text: '', ok: true }); }}
            className="btn btn-primary"
            style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '0.875rem', flexShrink: 0 }}
          >
            ✏️ Edit Profil
          </button>
        )}
      </div>

      {/* completion bar */}
      <CompletionBar profile={profile} />

      {/* flash message */}
      {message.text && (
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', background: message.ok ? '#dcfce7' : '#fee2e2', color: message.ok ? '#166534' : '#991b1b', border: `1px solid ${message.ok ? '#bbf7d0' : '#fecaca'}` }}>
          {message.text}
        </div>
      )}

      {/* ── data pribadi ──────────────────────────────────────────────────── */}
      <Section title="Data Pribadi" icon="👤">
        {editing ? (
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

              <FormField label="Nama Lengkap" required>
                <input type="text" {...f('full_name')} required style={inputStyle} placeholder="Sesuai KTP" />
              </FormField>

              <FormField label="NIK (Nomor KTP)">
                <input type="text" {...f('nik')} maxLength={16} style={inputStyle} placeholder="16 digit nomor KTP" />
              </FormField>

              <FormField label="Nomor Telepon">
                <input type="text" {...f('phone')} style={inputStyle} placeholder="08xx-xxxx-xxxx" />
              </FormField>

              <FormField label="Tempat Lahir">
                <input type="text" {...f('birth_place')} style={inputStyle} />
              </FormField>

              <FormField label="Tanggal Lahir">
                <input type="date" {...f('birth_date')} style={inputStyle} />
              </FormField>

              <FormField label="Jenis Kelamin">
                <select {...f('gender')} style={selectStyle}>
                  <option value="">— Pilih —</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </FormField>

              <FormField label="Status Pernikahan">
                <select {...f('marital_status')} style={selectStyle}>
                  <option value="">— Pilih —</option>
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Cerai">Cerai</option>
                </select>
              </FormField>

              <FormField label="Pekerjaan">
                <input type="text" {...f('occupation')} style={inputStyle} placeholder="Contoh: Pilot, Teknisi, dll" />
              </FormField>

              <FormField label="Instansi / Perusahaan">
                <input type="text" {...f('institution')} style={inputStyle} placeholder="Nama perusahaan atau instansi" />
              </FormField>

            </div>

            {/* alamat full width di luar grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <FormField label="Alamat Lengkap">
                <textarea rows={3} {...f('address')} style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
              </FormField>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button"
                onClick={() => { setEditing(false); setForm(profile); setMessage({ text: '', ok: true }); }}
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
            <Field label="Nama Lengkap"       value={profile.full_name} />
            <Field label="NIK"                value={profile.nik} />
            <Field label="Nomor Telepon"      value={profile.phone} />
            <Field label="Tempat Lahir"       value={profile.birth_place} />
            <Field label="Tanggal Lahir"      value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <Field label="Jenis Kelamin"      value={profile.gender} />
            <Field label="Status Pernikahan"  value={profile.marital_status} />
            <Field label="Pekerjaan"          value={profile.occupation} />
            <Field label="Instansi / Perusahaan" value={profile.institution} />
            <Field label="Alamat"             value={profile.address} />
          </div>
        )}
      </Section>

      {/* ── informasi akun ────────────────────────────────────────────────── */}
      <Section title="Informasi Akun" icon="🔐">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <Field label="Email Login"   value={user?.email} />
          <Field label="Role"          value="Peserta" />
          <Field label="Status Akun"   value={profile.status} />
          <Field label="ID Peserta"    value={profile.participant_number} />
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Untuk mengubah email atau kata sandi, hubungi administrator TATC.
        </p>
      </Section>

      {/* ── program yang diikuti ──────────────────────────────────────────── */}
      <Section title="Program yang Diikuti" icon="🎓">
        {batches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Belum ada program yang diikuti.</p>
            <Link to="/portal/register" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
              Lihat program tersedia →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...activeBatches, ...pastBatches].map(b => {
              const done = b.status === 'COMPLETED' || b.enrollment_status === 'COMPLETED';
              return (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.9rem 1rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>{b.program_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {b.name}
                      {b.start_date && ` · ${new Date(b.start_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`}
                      {b.end_date && ` – ${new Date(b.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: done ? '#f3f4f6' : '#dcfce7', color: done ? '#4b5563' : '#166534' }}>
                    {done ? 'Selesai' : 'Aktif'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── sertifikat ────────────────────────────────────────────────────── */}
      <Section title="Sertifikat" icon="📜">
        {certificates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏅</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Belum ada sertifikat yang diterbitkan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {certificates.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.9rem 1rem', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>{c.certificate_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Diterbitkan: {c.issue_date ? new Date(c.issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    {c.expiry_date && ` · Berlaku s/d ${new Date(c.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: c.status === 'VALID' ? '#dcfce7' : '#fee2e2', color: c.status === 'VALID' ? '#166534' : '#991b1b' }}>
                    {c.status}
                  </span>
                  <Link to={`/verify/${c.verification_code}`} style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
                    Verifikasi →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  );
};

export default ParticipantProfile;
