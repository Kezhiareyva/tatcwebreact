import React, { useState, useEffect } from 'react';

const RegistrationVerification = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      const json = await res.json();
      if (json.success) setRegistrations(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleVerify = async (status) => {
    if (!selectedReg) return;
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedReg(null);
        setNotes('');
        fetchRegistrations();
      } else {
        setMessage(json.message);
      }
    } catch (e) {
      setMessage('Gagal memverifikasi pendaftaran.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING_PAYMENT': { bg: '#fef3c7', text: '#92400e', label: 'Menunggu Pembayaran' },
      'UNDER_REVIEW': { bg: '#e0e7ff', text: '#3730a3', label: 'Sedang Direview' },
      'REVISION_NEEDED': { bg: '#fee2e2', text: '#991b1b', label: 'Perlu Revisi' },
      'ACCEPTED': { bg: '#dcfce7', text: '#166534', label: 'Diterima' },
      'REJECTED': { bg: '#fee2e2', text: '#991b1b', label: 'Ditolak' },
      'CANCELLED': { bg: '#f3f4f6', text: '#374151', label: 'Dibatalkan' }
    };
    const style = colors[status] || { bg: '#f3f4f6', text: '#374151', label: status };
    return (
      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: style.bg, color: style.text, fontWeight: 'bold' }}>
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Verifikasi Pendaftaran</h1>
        <button onClick={fetchRegistrations} className="btn" style={{ padding: '8px 16px' }}>Refresh</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Tanggal</th>
                <th style={{ padding: '1rem' }}>Peserta</th>
                <th style={{ padding: '1rem' }}>Program & Batch</th>
                <th style={{ padding: '1rem' }}>Biaya</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data pendaftar.</td></tr>
              ) : registrations.map(reg => (
                <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{reg.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{reg.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{reg.program_name}</div>
                    <div style={{ fontSize: '0.85rem' }}>{reg.batch_name}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>Rp {Number(reg.total_amount).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(reg.status)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => setSelectedReg(reg)} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Detail & Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Detail Pendaftaran</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nama Peserta</p>
                <p style={{ fontWeight: 'bold' }}>{selectedReg.full_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Program</p>
                <p style={{ fontWeight: 'bold' }}>{selectedReg.program_name} - {selectedReg.batch_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nomor Telepon</p>
                <p>{selectedReg.phone || '-'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Biaya</p>
                <p>Rp {Number(selectedReg.total_amount).toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Bukti Pembayaran</h3>
              {selectedReg.payment_proof_url ? (
                <a href={selectedReg.payment_proof_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  Lihat Bukti Transfer &rarr;
                </a>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum upload bukti transfer.</p>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Catatan Verifikasi (opsional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', resize: 'vertical' }} placeholder="Masukkan alasan jika ditolak atau perlu revisi..."></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setSelectedReg(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>Tutup</button>
              {selectedReg.status === 'UNDER_REVIEW' && (
                <>
                  <button onClick={() => handleVerify('REJECTED')} style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Tolak</button>
                  <button onClick={() => handleVerify('ACCEPTED')} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Terima</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationVerification;
