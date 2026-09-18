import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageCertificates = () => {
  const [participants, setParticipants] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCertificates = async () => {
    try {
      const res = await apiFetch('/api/certificates');
      const json = await res.json();
      if (json.success) setCertificates(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParticipants = async () => {
    try {
      // Get all participants
      const res = await apiFetch('/api/participants');
      const json = await res.json();
      if (json.success) setParticipants(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchParticipants();
  }, []);

  const issueCertificate = async (participantId) => {
    if (!window.confirm('Terbitkan sertifikat baru untuk peserta ini?')) return;
    setLoading(true);
    setMessage('');

    try {
      const res = await apiFetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId })
      });
      const json = await res.json();

      if (json.success) {
        setMessage(`Sertifikat berhasil diterbitkan. No: ${json.certificate_number}`);
        fetchCertificates();
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menghubungi server.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const changeStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'VALID' ? 'REVOKED' : 'VALID';
    if (!window.confirm(`Ubah status sertifikat ini menjadi ${newStatus}?`)) return;

    try {
      const res = await apiFetch(`/api/certificates?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) fetchCertificates();
      else alert(json.message);
    } catch (e) {
      alert('Error updating status.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sertifikasi & Kelulusan</h1>

      {message && <div style={{ padding: '1rem', background: message.includes('Gagal') ? '#fee2e2' : '#dcfce7', color: message.includes('Gagal') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

        {/* Issue New Certificate Panel */}
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Terbitkan Sertifikat Baru</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Pilih peserta untuk diterbitkan sertifikatnya secara manual. Pastikan peserta telah lulus seluruh syarat akademik.</p>

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            {participants.map(p => (
              <div key={p.id} style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.participant_number || p.email}</div>
                </div>
                <button
                  onClick={() => issueCertificate(p.id)}
                  disabled={loading}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Issue
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Issued Certificates List */}
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Daftar Sertifikat Terbit</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>No Sertifikat</th>
                <th>Peserta</th>
                <th>Kode Verifikasi</th>
                <th>Tanggal Terbit</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{cert.certificate_number}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{cert.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cert.participant_number}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>{cert.verification_code}</td>
                  <td>{cert.issue_date}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: cert.status === 'VALID' ? '#dcfce7' : '#fee2e2', color: cert.status === 'VALID' ? '#166534' : '#991b1b' }}>
                      {cert.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => changeStatus(cert.id, cert.status)}
                      style={{ background: 'transparent', border: 'none', color: cert.status === 'VALID' ? '#ef4444' : '#10b981', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                    >
                      {cert.status === 'VALID' ? 'Revoke' : 'Re-Validate'}
                    </button>
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada sertifikat diterbitkan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageCertificates;
