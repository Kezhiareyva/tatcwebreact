import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Token pemulihan tidak ditemukan di URL.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background-main)' }}>
      <nav style={{
        padding: '1rem 0', background: 'var(--surface-color)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)', position: 'fixed', width: '100%', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/"><img src="/tatc.png" alt="Tel-U ATC Logo" style={{ height: '45px', objectFit: 'contain', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }} /></Link>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Buat Kata Sandi Baru</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>Masukkan kata sandi baru Anda untuk akun ini.</p>

          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
          {message && <div style={{ background: '#dcfce7', border: '1px solid #10b981', color: '#047857', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{message}</div>}

          {!token ? (
            <div style={{ marginTop: '2rem' }}>
              <Link to="/forgot-password" className="btn btn-primary" style={{ padding: '10px 20px' }}>Minta Tautan Baru</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Kata Sandi Baru</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)', outline: 'none' }} />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Konfirmasi Kata Sandi Baru</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)', outline: 'none' }} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '14px', width: '100%', fontSize: '1rem', fontWeight: '600' }}>
                {loading ? 'Memproses...' : 'Ubah Kata Sandi'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
