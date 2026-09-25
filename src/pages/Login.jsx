import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMessage('');
    try {
      const response = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setResendMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Koneksi ke server gagal.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background-main)' }}>
      {/* Navigation */}
      <nav style={{
        padding: '1rem 0', background: 'var(--surface-color)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)', position: 'fixed', width: '100%', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/"><img src="/tatc.png" alt="Tel-U ATC Logo" style={{ height: '45px', objectFit: 'contain', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }} /></Link>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Home</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Main Login Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 2rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), var(--background-main))' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1)' }}>
          <img src="/Logo2.png" alt="TATC Logo" style={{ height: '80px', marginBottom: '1.5rem', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>Log in to your account</h2>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500', textAlign: 'left' }}>
              {error}
              {error === 'Silakan verifikasi email terlebih dahulu.' && (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{ display: 'block', marginTop: '10px', padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  {resending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                </button>
              )}
            </div>
          )}

          {resendMessage && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500', textAlign: 'left', wordBreak: 'break-all' }}>
              {resendMessage}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
                <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>Lupa Sandi?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 74px 12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)', outline: 'none' }} />
                <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', padding: '4px' }}>
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '14px', width: '100%', fontSize: '1rem', fontWeight: '600' }}>
              {loading ? 'Processing...' : 'Log In'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
