import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageBAP = () => {
  const [bapList, setBapList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBap, setSelectedBap] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [syncAttendance, setSyncAttendance] = useState(true);
  const [message, setMessage] = useState({ text: '', ok: true });

  const fetchBapList = async () => {
    setLoading(true);
    try {
      const q = filterStatus ? `?status=${filterStatus}` : '';
      const res = await apiFetch(`/api/bap${q}`);
      const json = await res.json();
      if (json.success) {
        setBapList(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBapList();
  }, [filterStatus]);

  const openDetail = async (id) => {
    setLoadingDetail(true);
    setReviewNotes('');
    setMessage({ text: '', ok: true });
    try {
      const res = await apiFetch(`/api/bap?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedBap(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReview = async (action) => {
    if (!selectedBap) return;
    if ((action === 'reject' || action === 'request_revision') && !reviewNotes.trim()) {
      setMessage({ text: 'Catatan Admin wajib diisi.', ok: false });
      return;
    }
    const confirmText = action === 'approve'
      ? 'Setujui Berita Acara Pembelajaran (BAP) ini?'
      : action === 'reject'
        ? 'Tolak BAP ini? BAP yang ditolak tidak dapat diubah kembali oleh instruktur.'
        : 'Kembalikan BAP ini ke instruktur untuk direvisi?';
    if (!window.confirm(confirmText)) return;

    setActionLoading(true);
    setMessage({ text: '', ok: true });
    try {
      const res = await apiFetch(`/api/bap/${selectedBap.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          review_notes: reviewNotes,
          sync_attendance: syncAttendance,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ text: json.message, ok: true });
        // Refresh detail & list
        openDetail(selectedBap.id);
        fetchBapList();
      } else {
        setMessage({ text: json.message || 'Gagal memproses review.', ok: false });
      }
    } catch (err) {
      setMessage({ text: 'Terjadi kesalahan sistem.', ok: false });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
            Verifikasi & Arsip BAP (Berita Acara Pembelajaran)
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
            Pantau kinerja instruktur, pelaksanaan modul, dan rekapitulasi presensi peserta secara resmi.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
          >
            <option value="">Semua Status</option>
            <option value="SUBMITTED">Menunggu Review (Submitted)</option>
            <option value="APPROVED">Disetujui (Approved)</option>
            <option value="REVISION_REQUESTED">Perlu Revisi</option>
            <option value="REJECTED">Ditolak (Rejected)</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data BAP...</div>
        ) : bapList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada data Berita Acara yang ditemukan.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Tanggal Kelas</th>
                <th style={{ padding: '12px 16px' }}>Instruktur</th>
                <th style={{ padding: '12px 16px' }}>Modul & Topik</th>
                <th style={{ padding: '12px 16px' }}>Batch / Program</th>
                <th style={{ padding: '12px 16px' }}>Metode</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bapList.map(item => {
                const statusColors = {
                  DRAFT: { bg: '#f1f5f9', color: '#475569' },
                  SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8' },
                  APPROVED: { bg: '#dcfce7', color: '#15803d' },
                  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
                  REVISION_REQUESTED: { bg: '#fef3c7', color: '#92400e' },
                };
                const badge = statusColors[item.status] || statusColors.DRAFT;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{item.teaching_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.submitted_at ? `Submit: ${new Date(item.submitted_at).toLocaleDateString('id-ID')}` : 'Belum disubmit'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.instructor_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{item.session_title}</div>
                      {item.topic_title && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                          Pertemuan {item.topic_sequence}: {item.topic_title}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{item.batch_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.program_name}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#334155', fontWeight: 500 }}>
                        {item.method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: badge.bg, color: badge.color }}>
                        {item.status}
                      </span>
                      {item.sync_attendance === 1 && (
                        <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>✓ Presensi Tersinkron</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => openDetail(item.id)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem' }}
                      >
                        Periksa & Cetak
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL & VERIFICATION MODAL */}
      {selectedBap && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', color: '#000', borderRadius: '12px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Header modal */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Detail Berita Acara Pembelajaran</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID BAP: #{selectedBap.id}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  🖨️ Cetak Dokumen
                </button>
                <button
                  onClick={() => setSelectedBap(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Notification message */}
            {message.text && (
              <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', background: message.ok ? '#dcfce7' : '#fee2e2', color: message.ok ? '#166534' : '#991b1b' }}>
                {message.text}
              </div>
            )}

            {/* Printable Document Area */}
            <div id="bap-print-area">
              {/* Kop Surat */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <img src="/Logo2.png" alt="TATC Logo" style={{ height: '60px', marginRight: '1rem' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    TAMAN AVIATION TRAINING CENTER (TATC)
                  </h2>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#333' }}>
                    Approved Maintenance Training Organization (AMTO) & Aviation Education
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                    Telp: (021) 1234-5678 | Email: academic@tatc.co.id | Website: tatc.co.id
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textDecoration: 'underline' }}>
                  BERITA ACARA PEMBELAJARAN (BAP)
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                  Status Dokumen: <strong style={{ color: selectedBap.status === 'APPROVED' ? '#15803d' : (selectedBap.status === 'REJECTED' ? '#b91c1c' : selectedBap.status === 'REVISION_REQUESTED' ? '#92400e' : '#1d4ed8') }}>{selectedBap.status}</strong>
                </p>
              </div>

              {/* Information Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '160px', padding: '4px 0', fontWeight: 600 }}>Program Pendidikan</td>
                    <td style={{ width: '12px' }}>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.program_name}</td>
                    <td style={{ width: '130px', padding: '4px 0', fontWeight: 600 }}>Tanggal Kelas</td>
                    <td style={{ width: '12px' }}>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.teaching_date}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Batch / Angkatan</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.batch_name} ({selectedBap.batch_code || '-'})</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Metode Pelaksanaan</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.method}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Modul Pelajaran</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.module_name || selectedBap.session_title}</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Durasi Aktual</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }}>{selectedBap.duration_hours} Jam</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Topik / Pertemuan</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }} colSpan={4}>
                      {selectedBap.topic_title ? `Pertemuan ${selectedBap.topic_sequence}: ${selectedBap.topic_title}` : selectedBap.session_title}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Instruktur Pengampu</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }} colSpan={4}>
                      <strong>{selectedBap.instructor_name}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>Ruangan / Lokasi</td>
                    <td>:</td>
                    <td style={{ padding: '4px 0' }} colSpan={4}>{selectedBap.location || selectedBap.room_name || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Catatan Pembelajaran Instruktur:</strong>
                <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-line' }}>{selectedBap.notes || 'Tidak ada catatan.'}</p>
              </div>

              {/* Participant Attendance */}
              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', fontWeight: 700 }}>
                Daftar Kehadiran Peserta ({selectedBap.attendance?.length || 0} Orang)
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '30px' }}>No</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '110px' }}>No. Peserta</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Nama Lengkap Peserta</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '90px' }}>Kehadiran</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBap.attendance || []).map((p, idx) => (
                    <tr key={p.participant_id || idx}>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{p.participant_number || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 500 }}>{p.full_name}</td>
                      <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 600 }}>
                        {p.status === 'PRESENT' ? 'HADIR' : (p.status === 'EXCUSED' ? 'IZIN/SAKIT' : (p.status === 'LATE' ? 'TERLAMBAT' : 'ALPHA'))}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '0.82rem', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <p style={{ margin: '0 0 50px 0' }}>Instruktur Pengampu,</p>
                  <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>{selectedBap.instructor_name}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#666' }}>Tercatat di Sistem</p>
                </div>

                <div style={{ textAlign: 'center', width: '200px' }}>
                  <p style={{ margin: '0 0 50px 0' }}>Bagian Akademik / Admin,</p>
                  <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
                    {selectedBap.reviewer_name || '( .......................................... )'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#666' }}>
                    {selectedBap.reviewed_at ? `Disetujui: ${new Date(selectedBap.reviewed_at).toLocaleDateString('id-ID')}` : 'Belum Diverifikasi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Review Action Box (Hidden during print) */}
            {selectedBap.status === 'SUBMITTED' && <div className="no-print" style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700 }}>
                Tindakan Verifikasi Administrator
              </h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Catatan Review / Feedback ke Instruktur:
                </label>
                <input
                  type="text"
                  placeholder="Catatan approval, alasan penolakan, atau instruksi revisi..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="syncAttendanceCheck"
                  checked={syncAttendance}
                  onChange={e => setSyncAttendance(e.target.checked)}
                />
                <label htmlFor="syncAttendanceCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                  Sinkronkan daftar kehadiran di atas secara otomatis ke tabel presensi peserta TATC.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReview('reject')}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {actionLoading ? 'Memproses...' : '✕ Tolak BAP'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReview('request_revision')}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {actionLoading ? 'Memproses...' : '↻ Minta Revisi'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReview('approve')}
                  style={{ padding: '8px 18px', borderRadius: '6px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {actionLoading ? 'Memproses...' : '✓ Setujui BAP & Kinerja'}
                </button>
              </div>
            </div>}

          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBAP;
