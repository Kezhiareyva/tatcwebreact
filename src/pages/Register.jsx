import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
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
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Home</Link>
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Log In</Link>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 2rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), var(--background-main))' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1)' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>Create your account</h2>

          {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}
          
          {message && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
              {message}
            </div>
          )}

          {!message && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', outline: 'none' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', outline: 'none' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-main)', outline: 'none' }} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '14px', width: '100%', fontSize: '1rem', fontWeight: '600' }}>
                {loading ? 'Processing...' : 'Sign Up'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
