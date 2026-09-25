import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

const InstructorBAP = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eligibleSessions, setEligibleSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionDetail, setSessionDetail] = useState(null);
  const [activeBap, setActiveBap] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ text: '', ok: true });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    method: 'ONSITE',
    duration_hours: 2,
    location: '',
    notes: '',
  });

  // Load eligible sessions & history
  const loadBapData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/portal/instructor/bap');
      const json = await res.json();
      if (json.success) {
        setEligibleSessions(json.data.eligible_sessions || []);
        setHistory(json.data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.profile) loadBapData();
    else setLoading(false);
  }, [user]);

  // When a session is selected from eligible sessions
  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setFormMsg({ text: '', ok: true });
    if (!sessionId) {
      setSessionDetail(null);
      setActiveBap(null);
      setParticipants([]);
      return;
    }

    setLoadingForm(true);
    try {
      const res = await apiFetch(`/api/portal/instructor/bap/session/${sessionId}`);
      const json = await res.json();
      if (json.success) {
        const { session, participants: pList, existing_bap } = json.data;
        setSessionDetail(session);
        setActiveBap(existing_bap);
        setFormData({
          method: existing_bap?.method || 'ONSITE',
          duration_hours: existing_bap?.duration_hours || session.duration_hours || 2,
          location: existing_bap?.location || session.room_name || '',
          notes: existing_bap?.notes || '',
        });

        const savedAttendance = new Map(
          (existing_bap?.attendance || []).map(item => [item.participant_id, item])
        );
        setParticipants(
          pList.map(p => ({
            participant_id: p.participant_id,
            full_name: p.full_name,
            participant_number: p.participant_number,
            status: savedAttendance.get(p.participant_id)?.status || 'PRESENT',
            notes: savedAttendance.get(p.participant_id)?.notes || '',
          }))
        );
      } else {
        setFormMsg({ text: json.message || 'Gagal memuat sesi.', ok: false });
        setSessionDetail(null);
        setActiveBap(null);
      }
    } catch (err) {
      setFormMsg({ text: 'Terjadi kesalahan sistem saat memuat form sesi.', ok: false });
      setSessionDetail(null);
      setActiveBap(null);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleStatusChange = (participantId, status) => {
    setParticipants(prev =>
      prev.map(p => (p.participant_id === participantId ? { ...p, status } : p))
    );
  };

  const handleNotesChange = (participantId, notes) => {
    setParticipants(prev =>
      prev.map(p => (p.participant_id === participantId ? { ...p, notes } : p))
    );
  };

  const handleSubmit = async (action) => {
    if (!selectedSessionId) return;

    if (action === 'submit') {
      const confirmSubmit = window.confirm(
        'Submit Berita Acara Pembelajaran (BAP)? Setelah dikirim ke sistem, data akan diverifikasi oleh Admin.'
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setFormMsg({ text: '', ok: true });

    try {
      const payload = {
        session_id: Number(selectedSessionId),
        method: formData.method,
        duration_hours: Number(formData.duration_hours),
        location: formData.location,
        notes: formData.notes,
        attendance: participants,
        action, // 'save_draft' | 'submit'
      };

      const res = await apiFetch('/api/portal/instructor/bap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setFormMsg({ text: json.message, ok: true });
        // Refresh history & eligible list
        loadBapData();
        if (action === 'submit') {
          // If submitted, open print preview
          setShowPrintModal(true);
        }
      } else {
        setFormMsg({ text: json.message || 'Gagal memproses BAP.', ok: false });
      }
    } catch (err) {
      setFormMsg({ text: 'Terjadi kesalahan pada koneksi server.', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  // View historical BAP detail
  const handleViewHistory = async (bapId) => {
    try {
      const res = await apiFetch(`/api/portal/instructor/bap/${bapId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedHistoryItem(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat Berita Acara...</div>;
  }

  if (!user?.profile) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Profile Not Linked</h2>
        <p style={{ color: 'var(--text-muted)' }}>Akun Anda belum ditautkan dengan data Instruktur.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
            Berita Acara Pembelajaran (BAP)
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
            Pencatatan resmi proses belajar mengajar, kehadiran peserta, dan kinerja instruktur.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, border: '1px solid #bfdbfe' }}>
            📅 Aturan Pengisian: H-1 s/d H+1 Kelas
          </span>
        </div>
      </div>

      {/* Main Grid: Form on Left / History on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '2rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Input Form */}
        <div>
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              1. Pilih Sesi Pembelajaran Aktif
            </h2>

            {eligibleSessions.length === 0 ? (
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ℹ️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Tidak ada sesi yang memenuhi syarat saat ini</div>
                <div style={{ fontSize: '0.85rem' }}>
                  BAP hanya dapat diisi pada <strong>H-1, Hari-H, atau H+1</strong> dari tanggal sesi kelas yang Anda ampu.
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Pilih Jadwal Sesi Kelas:
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectSession(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                >
                  <option value="">-- Pilih sesi kelas yang diajar --</option>
                  {eligibleSessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.session_date} | {s.batch_name} | {s.title} {s.topic_title ? `(Pertemuan ${s.topic_sequence}: ${s.topic_title})` : ''} {s.bap_status ? `[${s.bap_status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loadingForm && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Memuat data sesi dan peserta...
              </div>
            )}

            {formMsg.text && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', background: formMsg.ok ? '#dcfce7' : '#fee2e2', color: formMsg.ok ? '#166534' : '#991b1b', border: `1px solid ${formMsg.ok ? '#bbf7d0' : '#fecaca'}` }}>
                {formMsg.text}
              </div>
            )}

            {sessionDetail && !loadingForm && (
              <div style={{ marginTop: '1.5rem' }}>
                {/* Session Card Info */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>
                      {sessionDetail.program_name}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#047857', background: '#d1fae5', padding: '2px 8px', borderRadius: '12px' }}>
                      Batch: {sessionDetail.batch_name}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{sessionDetail.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>Modul:</strong> {sessionDetail.module_name || '-'}</div>
                    <div>
                      <strong>Pertemuan/Topik:</strong> {sessionDetail.topic_title ? `Pertemuan ${sessionDetail.topic_sequence} — ${sessionDetail.topic_title}` : 'Belum di-assign topik khusus'}
                    </div>
                    <div><strong>Jadwal:</strong> {sessionDetail.session_date} ({sessionDetail.start_time} - {sessionDetail.end_time})</div>
                  </div>
                </div>

                {activeBap?.status === 'REVISION_REQUESTED' && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.9rem' }}>
                    <strong>Perlu revisi dari Admin.</strong>{' '}
                    {activeBap.review_notes || 'Silakan perbaiki BAP lalu kirim ulang.'}
                  </div>
                )}

                {activeBap && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(activeBap.status) && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                    BAP ini berstatus <strong>{activeBap.status}</strong> dan tidak dapat diubah.
                  </div>
                )}

                {/* Form Inputs: Method, Duration, Room */}
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  2. Metode & Pelaksanaan
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Metode Pembelajaran <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.method}
                      onChange={e => setFormData(f => ({ ...f, method: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    >
                      <option value="ONSITE">Onsite (Tatap Muka)</option>
                      <option value="ONLINE">Online (Virtual Class / Zoom)</option>
                      <option value="HYBRID">Hybrid (Campuran)</option>
                      <option value="SIMULATOR">Simulator / Workshop</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Durasi Aktual (Jam) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={formData.duration_hours}
                      onChange={e => setFormData(f => ({ ...f, duration_hours: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Ruangan / Lokasi / Link
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: R. Teori 2 / Workshop A"
                      value={formData.location}
                      onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Catatan Pembelajaran / Kinerja Instruktur
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Uraian ringkas materi yang telah disampaikan, pencapaian kompetensi, kendala atau tugas..."
                    value={formData.notes}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* Participant Attendance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                    3. Kehadiran Peserta ({participants.length} Peserta)
                  </h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setParticipants(prev => prev.map(p => ({ ...p, status: 'PRESENT' })))}
                      style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Set Semua Hadir
                    </button>
                  </div>
                </div>

                {participants.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Belum ada peserta yang terdaftar pada batch ini.
                  </p>
                ) : (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '35px' }}>No</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nama Peserta</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '170px' }}>Status Kehadiran</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, idx) => (
                          <tr key={p.participant_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.participant_number || '-'}</div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select
                                value={p.status}
                                onChange={e => handleStatusChange(p.participant_id, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  background:
                                    p.status === 'PRESENT' ? '#dcfce7' :
                                    p.status === 'EXCUSED' ? '#fef3c7' :
                                    p.status === 'LATE' ? '#fef08a' : '#fee2e2',
                                  color:
                                    p.status === 'PRESENT' ? '#166534' :
                                    p.status === 'EXCUSED' ? '#92400e' :
                                    p.status === 'LATE' ? '#854d0e' : '#991b1b',
                                }}
                              >
                                <option value="PRESENT">Hadir (Present)</option>
                                <option value="EXCUSED">Izin / Sakit</option>
                                <option value="LATE">Terlambat</option>
                                <option value="ABSENT">Alpha (Absen)</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                placeholder="Catatan peserta..."
                                value={p.notes}
                                onChange={e => handleNotesChange(p.participant_id, e.target.value)}
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Actions: Save Draft / Preview Print / Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={submitting || (activeBap && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(activeBap.status))}
                    onClick={() => handleSubmit('save_draft')}
                    style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    💾 Simpan Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    style={{ padding: '10px 18px', borderRadius: '8px', background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🖨️ Cetak / Preview BAP
                  </button>

                  <button
                    type="button"
                    disabled={submitting || (activeBap && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(activeBap.status))}
                    onClick={() => handleSubmit('submit')}
                    className="btn btn-primary"
                    style={{ padding: '10px 22px', borderRadius: '8px', fontWeight: 700 }}
                  >
                    {submitting ? 'Mengirim...' : '🚀 Submit BAP ke Sistem'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: History of BAP */}
        <div>
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Riwayat BAP Saya
            </h2>

            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Belum ada Berita Acara yang dibuat.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map(item => {
                  const statusColors = {
                    DRAFT: { bg: '#f1f5f9', color: '#475569' },
                    SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8' },
                    APPROVED: { bg: '#dcfce7', color: '#15803d' },
                  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
                  REVISION_REQUESTED: { bg: '#fef3c7', color: '#92400e' },
                  };
                  const badge = statusColors[item.status] || statusColors.DRAFT;

                  return (
                    <div
                      key={item.id}
                      style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-hover)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.teaching_date}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color }}>
                          {item.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {item.session_title}
                      </div>
                      {item.topic_title && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginBottom: '0.2rem' }}>
                          Pertemuan {item.topic_sequence}: {item.topic_title}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                        {item.program_name} · {item.batch_name}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleViewHistory(item.id)}
                          style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-main)' }}
                        >
                          Lihat Detail & Cetak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {(showPrintModal || selectedHistoryItem) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', color: '#000', borderRadius: '12px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Close & Print buttons */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <button
                onClick={() => window.print()}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Cetak Dokumen
              </button>
              <button
                onClick={() => { setShowPrintModal(false); setSelectedHistoryItem(null); }}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Tutup
              </button>
            </div>

            {/* Official BAP Document Layout */}
            <div id="bap-print-area">
              {/* Kop Surat */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <img src="/Logo2.png" alt="TATC Logo" style={{ height: '65px', marginRight: '1.25rem' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    TAMAN AVIATION TRAINING CENTER (TATC)
                  </h2>
                  <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#333' }}>
                    Approved Maintenance Training Organization (AMTO) & Aviation Education
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                    Telp: (021) 1234-5678 | Email: academic@tatc.co.id | Website: tatc.co.id
                  </p>
                </div>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, textDecoration: 'underline' }}>
                  BERITA ACARA PEMBELAJARAN (BAP)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#555' }}>
                  Nomor Sesi: SES-{selectedHistoryItem?.session_id || sessionDetail?.id || '0000'} / BAP / {new Date().getFullYear()}
                </p>
              </div>

              {/* Information Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '180px', padding: '5px 0', fontWeight: 600 }}>Program Pendidikan</td>
                    <td style={{ width: '15px' }}>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.program_name || sessionDetail?.program_name || '-'}</td>
                    <td style={{ width: '140px', padding: '5px 0', fontWeight: 600 }}>Tanggal Kelas</td>
                    <td style={{ width: '15px' }}>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.teaching_date || sessionDetail?.session_date || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Batch / Angkatan</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.batch_name || sessionDetail?.batch_name || '-'}</td>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Metode Belajar</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.method || formData.method}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Modul Pelajaran</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.module_name || sessionDetail?.module_name || '-'}</td>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Durasi Pembelajaran</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }}>{selectedHistoryItem?.duration_hours || formData.duration_hours} Jam</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Topik / Pertemuan Ke</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }} colSpan={4}>
                      {selectedHistoryItem?.topic_title
                        ? `Pertemuan ${selectedHistoryItem.topic_sequence}: ${selectedHistoryItem.topic_title}`
                        : (sessionDetail?.topic_title ? `Pertemuan ${sessionDetail.topic_sequence}: ${sessionDetail.topic_title}` : sessionDetail?.title || '-')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Nama Instruktur</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }} colSpan={4}>
                      <strong>{selectedHistoryItem?.instructor_name || user.profile.full_name}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', fontWeight: 600 }}>Lokasi / Ruangan</td>
                    <td>:</td>
                    <td style={{ padding: '5px 0' }} colSpan={4}>
                      {selectedHistoryItem?.location || formData.location || sessionDetail?.room_name || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Catatan Materi & Pembelajaran:</strong>
                <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>
                  {selectedHistoryItem?.notes || formData.notes || 'Tidak ada catatan tambahan.'}
                </p>
              </div>

              {/* Participant Attendance Table */}
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                Daftar Kehadiran Peserta
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '35px' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', width: '110px' }}>No. Peserta</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Nama Lengkap</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '90px' }}>Kehadiran</th>
                    <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedHistoryItem?.attendance || participants).map((p, idx) => (
                    <tr key={p.participant_id || idx}>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{p.participant_number || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 500 }}>{p.full_name}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 600 }}>
                        {p.status === 'PRESENT' ? 'HADIR' : (p.status === 'EXCUSED' ? 'IZIN/SAKIT' : (p.status === 'LATE' ? 'TERLAMBAT' : 'ALPHA'))}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', fontSize: '0.85rem', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <p style={{ margin: '0 0 60px 0' }}>Disiapkan Oleh,<br /><strong>Instruktur Pengampu</strong></p>
                  <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
                    {selectedHistoryItem?.instructor_name || user.profile.full_name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Tanda Tangan Digital Terverifikasi</p>
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <p style={{ margin: '0 0 60px 0' }}>Mengetahui & Menyetujui,<br /><strong>Bagian Akademik / Admin</strong></p>
                  <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
                    {selectedHistoryItem?.reviewer_name || '( .......................................... )'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                    Status: {selectedHistoryItem?.status || 'SUBMITTED'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorBAP;
