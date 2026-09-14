import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan dalam URL.');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Terjadi kesalahan saat menghubungi server.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-main)' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Verifikasi Email</h2>
        
        {status === 'verifying' && (
          <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        )}
        
        {status === 'success' && (
          <div>
            <div style={{ color: '#15803d', background: 'rgba(34, 197, 94, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem' }}>
              ✓ {message}
            </div>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>Lanjut ke Login</Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ color: '#b91c1c', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem' }}>
              ✗ {message}
            </div>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', width: '100%' }}>Kembali ke Beranda</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
