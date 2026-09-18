import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const VerifyCertificate = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch(`/api/public/verify?code=${code}`);
      const json = await res.json();

      if (json.success) {
        setResult(json);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Gagal menghubungi server verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background-main)' }}>
      {/* Simple Navbar */}
      <nav style={{ padding: '1.25rem 2rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/"><img src="/tatc.png" alt="TATC Logo" style={{ height: '40px' }} /></Link>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500' }}>Back to Home</Link>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Verify Certificate</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
            Masukkan kode verifikasi unik yang tertera pada sertifikat lulusan Tel-U ATC untuk membuktikan keasliannya.
          </p>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', width: '100%', maxWidth: '500px' }}>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontWeight: '600', color: '#334155' }}>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: A1B2C3D4E5"
              required
              style={{ padding: '14px', fontSize: '1.1rem', borderRadius: '8px', border: '2px solid var(--border-color)', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }}
            />
            <button type="submit" disabled={loading} style={{ background: '#ef4444', color: 'var(--surface-color)', padding: '14px', fontSize: '1.1rem', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}>
              {loading ? 'Verifying...' : 'Verifikasi Sekarang'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              <h3 style={{ color: '#991b1b', fontSize: '1.1rem', fontWeight: 'bold' }}>Sertifikat Tidak Valid</h3>
              <p style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: '0.5rem' }}>{error}</p>
            </div>
          )}

          {result && result.success && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: result.data.status === 'VALID' ? '#dcfce7' : '#fef3c7', border: `1px solid ${result.data.status === 'VALID' ? '#4ade80' : '#fbbf24'}`, borderRadius: '8px' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={result.data.status === 'VALID' ? '#16a34a' : '#d97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <h3 style={{ color: result.data.status === 'VALID' ? '#166534' : '#92400e', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {result.message}
                </h3>
              </div>

              <div style={{ background: 'var(--surface-color)', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Nama Peserta</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{result.data.full_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Nomor Sertifikat</div>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>{result.data.certificate_number}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Tanggal Terbit</div>
                  <div style={{ fontSize: '1rem', color: '#334155' }}>{result.data.issue_date}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
