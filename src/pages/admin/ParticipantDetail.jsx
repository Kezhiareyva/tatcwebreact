import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

/* ── helpers ──────────────────────────────────────────────────────────────── */
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

const Badge = ({ value, map }) => {
  const cfg = map[value] || { bg: '#f3f4f6', color: '#4b5563' };
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {value || '—'}
    </span>
  );
};

const statusMap = {
  ACTIVE:    { bg: '#dcfce7', color: '#166534' },
  INACTIVE:  { bg: '#fee2e2', color: '#991b1b' },
};
const enrollMap = {
  ENROLLED:   { bg: '#dbeafe', color: '#1e40af' },
  COMPLETED:  { bg: '#dcfce7', color: '#166534' },
  DROPPED:    { bg: '#fee2e2', color: '#991b1b' },
};
const attMap = {
  PRESENT:  { bg: '#dcfce7', color: '#166534' },
  ABSENT:   { bg: '#fee2e2', color: '#991b1b' },
  LATE:     { bg: '#fef9c3', color: '#854d0e' },
  EXCUSED:  { bg: '#e0f2fe', color: '#075985' },
};
const examMap = {
  PASSED:  { bg: '#dcfce7', color: '#166534' },
  FAILED:  { bg: '#fee2e2', color: '#991b1b' },
  PENDING: { bg: '#f3f4f6', color: '#4b5563' },
};
const regMap = {
  PENDING_PAYMENT: { bg: '#fef9c3', color: '#854d0e' },
  UNDER_REVIEW:    { bg: '#e0f2fe', color: '#075985' },
  ACCEPTED:        { bg: '#dcfce7', color: '#166534' },
  REJECTED:        { bg: '#fee2e2', color: '#991b1b' },
  REVISION_NEEDED: { bg: '#fce7f3', color: '#9d174d' },
  CANCELLED:       { bg: '#f3f4f6', color: '#4b5563' },
};

const fmtDate = (val) => {
  if (!val) return null;
  return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtDateTime = (val) => {
  if (!val) return null;
  return new Date(val).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ── component ────────────────────────────────────────────────────────────── */
const ParticipantDetail = () => {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await apiFetch(`/api/admin/participants/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.message || 'Data tidak ditemukan.');
      } catch {
        setError('Gagal memuat data peserta.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data peserta...</div>
  );
  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
  );

  const { profile, batches, attendance_stats, total_sessions, recent_attendance, exam_results, certificates, registrations } = data;

  const attendancePct = total_sessions > 0
    ? Math.round(((attendance_stats.PRESENT || 0) / total_sessions) * 100)
    : null;

  const initials = (profile.full_name || profile.email || 'P')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* profile completeness */
  const profileFields = ['full_name', 'nik', 'phone', 'birth_place', 'birth_date', 'gender', 'marital_status', 'address', 'occupation', 'institution'];
  const filledCount   = profileFields.filter(f => profile[f] && String(profile[f]).trim() !== '').length;
  const completePct   = Math.round((filledCount / profileFields.length) * 100);
  const completeColor = completePct < 40 ? '#ef4444' : completePct < 80 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ padding: '1.75rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── back + title ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/participants" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          ← Kembali ke Daftar Peserta
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: '0.5rem 0 0' }}>
          Detail Peserta
        </h1>
      </div>

      {/* ── header card ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* avatar */}
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', flexShrink: 0 }}>
          {initials}
        </div>

        {/* info */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {profile.full_name || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nama belum diisi</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>ID: <strong style={{ color: 'var(--text-main)' }}>{profile.participant_number || '—'}</strong></span>
            {profile.email && <span>· {profile.email}</span>}
            {profile.phone && <span>· {profile.phone}</span>}
            {profile.occupation && <span>· {profile.occupation}{profile.institution ? ` @ ${profile.institution}` : ''}</span>}
          </div>
        </div>

        {/* right: status + completeness */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <Badge value={profile.status} map={statusMap} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Kelengkapan profil: <strong style={{ color: completeColor }}>{completePct}%</strong>
            </div>
            <div style={{ width: '140px', height: '6px', borderRadius: '99px', background: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completePct}%`, borderRadius: '99px', background: completeColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── stat cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Batch Diikuti',   value: batches.length,              color: '#3b82f6' },
          { label: 'Total Sesi',      value: total_sessions,              color: '#8b5cf6' },
          { label: 'Hadir',           value: attendance_stats.PRESENT || 0, color: '#22c55e' },
          { label: 'Tidak Hadir',     value: attendance_stats.ABSENT  || 0, color: '#ef4444' },
          { label: 'Kehadiran',       value: attendancePct !== null ? `${attendancePct}%` : '—', color: attendancePct >= 80 ? '#22c55e' : attendancePct >= 60 ? '#f59e0b' : '#ef4444' },
          { label: 'Sertifikat',      value: certificates.length,         color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── data pribadi ──────────────────────────────────────────────────── */}
      <Section title="Data Pribadi" icon="👤">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.1rem' }}>
          <Field label="Nama Lengkap"          value={profile.full_name} />
          <Field label="NIK"                   value={profile.nik} />
          <Field label="Tempat Lahir"          value={profile.birth_place} />
          <Field label="Tanggal Lahir"         value={fmtDate(profile.birth_date)} />
          <Field label="Jenis Kelamin"         value={profile.gender} />
          <Field label="Status Pernikahan"     value={profile.marital_status} />
          <Field label="Nomor Telepon"         value={profile.phone} />
          <Field label="Email"                 value={profile.email} />
          <Field label="Pekerjaan"             value={profile.occupation} />
          <Field label="Instansi / Perusahaan" value={profile.institution} />
          <Field label="Alamat" value={profile.address} wide />
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Terdaftar: <strong>{fmtDateTime(profile.created_at)}</strong></span>
          <span>Diperbarui: <strong>{fmtDateTime(profile.updated_at)}</strong></span>
        </div>
      </Section>

      {/* ── program & batch ───────────────────────────────────────────────── */}
      <Section title={`Program / Batch (${batches.length})`} icon="🎓">
        {batches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Belum mengikuti program apapun.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {batches.map(b => (
              <div key={b.batch_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{b.program_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {b.batch_name}
                    {b.start_date && ` · ${fmtDate(b.start_date)}`}
                    {b.end_date && ` – ${fmtDate(b.end_date)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <Badge value={b.enroll_status} map={enrollMap} />
                  <Badge value={b.batch_status}  map={statusMap} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── kehadiran ─────────────────────────────────────────────────────── */}
      <Section title="Kehadiran" icon="📋">
        {/* summary bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {Object.entries(attendance_stats).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Badge value={status} map={attMap} />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{count}</span>
            </div>
          ))}
          {total_sessions === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada data kehadiran.</span>}
        </div>

        {/* recent attendance table */}
        {recent_attendance.length > 0 && (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              20 Sesi Terakhir
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Tanggal', 'Sesi', 'Modul', 'Batch', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent_attendance.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '7px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(a.session_date)}</td>
                      <td style={{ padding: '7px 8px', fontWeight: '500' }}>{a.session_title}</td>
                      <td style={{ padding: '7px 8px', color: 'var(--text-muted)' }}>{a.module_name || '—'}</td>
                      <td style={{ padding: '7px 8px', color: 'var(--text-muted)' }}>{a.batch_name}</td>
                      <td style={{ padding: '7px 8px' }}><Badge value={a.status} map={attMap} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {/* ── hasil ujian ───────────────────────────────────────────────────── */}
      <Section title={`Hasil Ujian (${exam_results.length})`} icon="📝">
        {exam_results.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Belum ada data ujian.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Ujian', 'Tipe', 'Tanggal', 'Nilai', 'Status', 'Catatan'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exam_results.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '7px 8px', fontWeight: '600' }}>{e.exam_name}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)' }}>{e.exam_type}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(e.exam_date)}</td>
                    <td style={{ padding: '7px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {e.score !== null && e.score !== undefined ? Number(e.score).toFixed(1) : '—'}
                    </td>
                    <td style={{ padding: '7px 8px' }}><Badge value={e.status} map={examMap} /></td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── sertifikat ────────────────────────────────────────────────────── */}
      <Section title={`Sertifikat (${certificates.length})`} icon="🏅">
        {certificates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Belum ada sertifikat yang diterbitkan.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {certificates.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.certificate_number}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Terbit: {fmtDate(c.issue_date)}
                    {c.expiry_date && ` · Berlaku s/d ${fmtDate(c.expiry_date)}`}
                    {' · Kode: '}<code style={{ fontSize: '0.78rem', background: 'var(--border-color)', padding: '1px 5px', borderRadius: '4px' }}>{c.verification_code}</code>
                  </div>
                </div>
                <Badge value={c.status} map={{ VALID: { bg: '#dcfce7', color: '#166534' }, REVOKED: { bg: '#fee2e2', color: '#991b1b' } }} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── riwayat pendaftaran ───────────────────────────────────────────── */}
      <Section title={`Riwayat Pendaftaran (${registrations.length})`} icon="📄">
        {registrations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Belum ada riwayat pendaftaran.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Program', 'Batch', 'Biaya', 'Status', 'Dikirim', 'Catatan'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '7px 8px', fontWeight: '600' }}>{r.program_name}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)' }}>{r.batch_name}</td>
                    <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                      {Number(r.total_amount) > 0
                        ? `Rp ${Number(r.total_amount).toLocaleString('id-ID')}`
                        : <span style={{ color: 'var(--text-muted)' }}>Gratis</span>}
                    </td>
                    <td style={{ padding: '7px 8px' }}><Badge value={r.status} map={regMap} /></td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(r.submitted_at)}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

    </div>
  );
};

export default ParticipantDetail;
