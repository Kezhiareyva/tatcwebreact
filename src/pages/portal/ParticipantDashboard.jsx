import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ batches: [], upcoming_sessions: [], open_programs: [], attendance_stats: {}, materials: [] });
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentReg, setPaymentReg] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const participantId = user?.profile?.id || 0;

      // Fetch Dashboard Data
      const res = await apiFetch(`/api/portal/student_dashboard?participant_id=${participantId}`);
      const json = await res.json();
      if (json.success) setData(json.data);

      // Fetch Registrations
      const resReg = await apiFetch(`/api/portal/registrations`);
      const jsonReg = await resReg.json();
      if (jsonReg.success) setRegistrations(jsonReg.data);

    } catch (err) {
      console.error('Error fetching participant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.profile) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    if (!paymentFile || !paymentReg) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('payment_proof', paymentFile);

      const res = await apiFetch(`/api/portal/registrations/${paymentReg}/payment`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        alert('Bukti pembayaran berhasil diunggah. Tim admin akan segera memverifikasi.');
        setPaymentReg(null);
        setPaymentFile(null);
        fetchData();
      } else {
        alert(json.message || 'Gagal mengupload bukti pembayaran.');
      }
    } catch (err) {
      alert('Gagal mengupload bukti pembayaran.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Memuat data dashboard...</div>
        <p style={{ fontSize: '0.9rem' }}>Mohon tunggu sebentar.</p>
      </div>
    );
  }

  if (!user?.profile) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Welcome Banner — generic, no profile data */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--primary-color)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <span>Portal Peserta TATC</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Selamat datang!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Pending notice — same visual style as the "no active programs" card */}
        <div style={{
          background: 'var(--surface-color)',
          border: '1px dashed var(--border-color)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Profil Peserta Sedang Dipersiapkan
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Akun Anda sudah aktif, namun data profil peserta belum ditautkan oleh tim administrasi. Biasanya ini selesai dalam 1×24 jam setelah pendaftaran. Jika sudah lebih dari itu, silakan hubungi admin TATC.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ padding: '9px 22px', borderRadius: '8px', fontSize: '0.9rem' }}>
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  const { batches = [], upcoming_sessions = [], open_programs = [], attendance_stats = {} } = data;

  // Categorize batches
  const activeBatches = batches.filter(b => (b.status === 'ACTIVE' || b.enrollment_status === 'ENROLLED') && b.status !== 'COMPLETED' && b.enrollment_status !== 'COMPLETED');
  const pastBatches = batches.filter(b => b.status === 'COMPLETED' || b.enrollment_status === 'COMPLETED');

  // Attendance stats
  const totalAtt = (attendance_stats.PRESENT || 0) + (attendance_stats.ABSENT || 0) + (attendance_stats.PERMITTED || 0) + (attendance_stats.SICK || 0);
  const presentPct = totalAtt > 0 ? Math.round(((attendance_stats.PRESENT || 0) / totalAtt) * 100) : 100;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', label: 'Menunggu Pembayaran' };
      case 'UNDER_REVIEW':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: 'Sedang Diverifikasi Admin' };
      case 'ACCEPTED':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', label: 'Diterima / Lolos' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', label: 'Pendaftaran Ditolak' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', label: status };
    }
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--primary-color)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <span>Portal Peserta TATC</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Selamat datang, {user.profile.full_name}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            NIP / ID Peserta: <strong style={{ color: 'var(--text-main)' }}>{user.profile.participant_number || '-'}</strong> | Email: {user.profile.email || user.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/portal/participant/schedule" className="btn btn-primary" style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <span>📅</span> Jadwal Kelas Saya
          </Link>
        </div>
      </div>

      {/* Summary Stat Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>PROGRAM AKTIF</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>{activeBatches.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Program yang sedang dijalani</div>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>JADWAL SESI MENDATANG</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{upcoming_sessions.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Dari semua program diikuti</div>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>PROGRAM DISELESAIKAN</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#3b82f6' }}>{pastBatches.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Riwayat program terdahulu</div>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>TINGKAT KEHADIRAN</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: presentPct >= 80 ? '#10b981' : '#f59e0b' }}>{presentPct}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Presensi kelas berjalan</div>
        </div>
      </div>

      {/* SECTION 1: PROGRAM YANG SEDANG DIJALANI SAAT INI */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)' }}>Program yang Sedang Dijalani</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Daftar pelatihan aktif tempat Anda terdaftar saat ini</p>
          </div>
          {activeBatches.length > 0 && (
            <Link to="/portal/participant/schedule" style={{ fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
              Lihat Semua Jadwal &rarr;
            </Link>
          )}
        </div>

        {activeBatches.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {activeBatches.map(b => (
              <div key={b.id} style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '20px' }}>
                      Sedang Berjalan
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {b.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    {b.program_name}
                  </h3>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
                    Batch: {b.name}
                  </div>

                  {b.program_description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.program_description}
                    </p>
                  )}

                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Periode Pelatihan:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {b.start_date ? new Date(b.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'} s/d {b.end_date ? new Date(b.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selesai'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link to="/portal/participant/schedule" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none' }}>
                    📅 Jadwal Kelas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* JIKA BELUM IKUT APA-APA: TAMPILKAN INFORMASI RAMAH & DAFTAR PROGRAM YANG DIBUKA */
          <div>
            <div style={{
              background: 'var(--surface-color)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Anda Belum Mengikuti Program Aktif Apapun
              </h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Saat ini Anda belum terdaftar dalam program pelatihan aktif di TATC. Jangan lewatkan kesempatan untuk memperdalam keahlian dan sertifikasi profesional Anda. Pilih dan daftar ke program yang sedang dibuka di bawah ini!
              </p>
            </div>

            {/* DAFTAR PROGRAM YANG SEDANG DIBUKA */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🔥</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Program Pelatihan yang Sedang Dibuka Pendaftarannya
                </h3>
              </div>

              {open_programs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  Saat ini belum ada batch program baru yang dibuka. Silakan cek berkala atau hubungi tim administrasi TATC.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {open_programs.map(op => {
                    const fee = Number(op.registration_fee || 0);
                    return (
                      <div key={op.batch_id} style={{
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '12px' }}>
                              Batch Terbuka
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{op.batch_code}</span>
                          </div>

                          <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            {op.program_name}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.75rem' }}>
                            Batch: {op.batch_name}
                          </div>

                          {op.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem', display: '-webkit-box', WebKitLineClamp: 3, WebKitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {op.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '1.25rem' }}>
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mulai Kelas</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                {op.start_date ? new Date(op.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Segera'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biaya Registrasi</div>
                              <div style={{ fontSize: '1rem', fontWeight: '800', color: fee > 0 ? 'var(--primary-color)' : '#10b981' }}>
                                {fee > 0 ? `Rp ${fee.toLocaleString('id-ID')}` : 'Gratis'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/portal/register?program_id=${op.program_id}&batch_id=${op.batch_id}`}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            display: 'block'
                          }}
                        >
                          Daftar Sekarang &rarr;
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: STATUS PENGAJUAN PENDAFTARAN & PEMBAYARAN (JIKA ADA) */}
      {registrations.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Status Pengajuan Pendaftaran Program
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {registrations.map(reg => {
              const badge = getStatusBadge(reg.status);
              const fee = Number(reg.total_amount || 0);

              return (
                <div key={reg.id} style={{
                  background: 'var(--surface-color)',
                  border: `1px solid ${reg.status === 'PENDING_PAYMENT' ? '#fde68a' : 'var(--border-color)'}`,
                  borderRadius: '14px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Diajukan: {new Date(reg.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {reg.program_name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Batch: <strong>{reg.batch_name}</strong>
                    </p>

                    {reg.notes && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <strong>Catatan Admin:</strong> {reg.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '220px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Biaya Pendaftaran:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: fee > 0 ? 'var(--primary-color)' : '#10b981', marginBottom: '0.75rem' }}>
                      {fee > 0 ? `Rp ${fee.toLocaleString('id-ID')}` : 'Gratis'}
                    </div>

                    {reg.status === 'PENDING_PAYMENT' && (
                      paymentReg === reg.id ? (
                        <form onSubmit={handleUploadPayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.8rem', textAlign: 'left', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            Transfer ke: <strong>Mandiri 123-00-9876543-2</strong> a.n. TATC
                          </div>
                          <input
                            type="file"
                            required
                            accept="image/*,.pdf"
                            onChange={e => setPaymentFile(e.target.files[0])}
                            style={{ fontSize: '0.8rem', width: '100%' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button type="button" onClick={() => setPaymentReg(null)} style={{ padding: '5px 10px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                              Batal
                            </button>
                            <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: '6px' }}>
                              {uploading ? 'Mengunggah...' : 'Kirim Bukti'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => setPaymentReg(reg.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}>
                          Upload Bukti Transfer
                        </button>
                      )
                    )}

                    {reg.status === 'UNDER_REVIEW' && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '240px', textAlign: 'right' }}>
                        Bukti pendaftaran sedang dalam proses validasi oleh tim administrasi TATC.
                      </p>
                    )}

                    {reg.status === 'ACCEPTED' && (
                      <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                        ✓ Anda telah resmi terdaftar di batch ini.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: PROGRAM YANG PERNAH DIIKUTI SEBELUMNYA */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Program yang Pernah Diikuti
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Riwayat program pelatihan yang telah selesai Anda ikuti di TATC
            </p>
          </div>
          <Link to="/verify" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
            Verifikasi Sertifikat &rarr;
          </Link>
        </div>

        {pastBatches.length === 0 ? (
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            Belum ada riwayat program pelatihan yang telah selesai.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {pastBatches.map(pb => (
              <div key={pb.id} style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', background: '#f3f4f6', color: '#4b5563', borderRadius: '12px' }}>
                      Program Selesai
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pb.code}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {pb.program_name}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Batch: {pb.name}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Periode: {pb.start_date ? new Date(pb.start_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'} s/d {pb.end_date ? new Date(pb.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <Link to="/verify" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none' }}>
                    Lihat Sertifikat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default ParticipantDashboard;
