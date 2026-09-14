import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function News() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const [singleNews, setSingleNews] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    if (slug) {
      fetch(`/api/cms/news?public=true&slug=${slug}`)
        .then(res => res.json())
        .then(json => { 
          if (json.success) setSingleNews(json.data); 
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      fetch('/api/cms/news?public=true')
        .then(res => res.json())
        .then(json => { 
          if (json.success) setNewsList(json.data); 
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
      
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const navStyle = {
    padding: scrolled ? '1rem 0' : '1.5rem 0',
    background: 'var(--navbar-bg)',
    backdropFilter: 'blur(16px)',
    borderBottom: scrolled ? '1px solid var(--navbar-border)' : '1px solid transparent',
    boxShadow: scrolled ? '0 4px 20px -2px rgba(15,23,42,0.1)' : 'none',
    position: 'fixed', width: '100%', top: 0, zIndex: 50, transition: 'all 0.3s ease'
  };

  return (
    <>
      {/* Navigation */}
      <nav style={navStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/"><img src="/tatc.png" alt="Tel-U ATC Logo" style={{ height: '45px', objectFit: 'contain' }} /></Link>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--navbar-text)', opacity: 0.8, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'var(--navbar-text)'}>Home</Link>
            <a href="/#about" style={{ color: 'var(--navbar-text)', opacity: 0.8, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'var(--navbar-text)'}>About Us</a>
            <Link to="/news" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '600' }}>News</Link>
            <a href="#contacts" style={{ color: 'var(--navbar-text)', opacity: 0.8, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'var(--navbar-text)'}>Contacts</a>
            
            <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem', alignItems: 'center' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--navbar-text)', fontSize: '0.95rem', fontWeight: '600' }}>
                    Halo, {user.profile?.full_name || user.name || user.email.split('@')[0]}
                  </span>
                  <Link to={user.role === 'SUPERADMIN' || user.role === 'ADMIN' ? '/admin' : (user.role === 'INSTRUKTUR' ? '/portal/instructor' : '/portal/participant')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Dashboard</Link>
                  <button onClick={async () => { await logout(); navigate('/login'); }} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#ef4444', border: '1px solid #ef4444', background: 'transparent', cursor: 'pointer' }}>Logout</button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn" style={{ padding: '8px 20px', fontSize: '0.9rem', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', background: 'transparent' }}>Log In</Link>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: '100px', minHeight: '80vh', backgroundColor: 'var(--background-main)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div>
          ) : slug && singleNews ? (
            // SINGLE NEWS VIEW
            <article className="premium-card" style={{ overflow: 'hidden' }}>
              {singleNews.image_url && (
                <div style={{ width: '100%', height: '400px', backgroundImage: `url('${singleNews.image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--border-color)' }}></div>
              )}
              <div style={{ padding: '3rem' }}>
                <Link to="/news" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem', fontWeight: '600' }}>&larr; Back to News</Link>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.2 }}>{singleNews.title}</h1>
                <div style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: '2.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {new Date(singleNews.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ color: 'var(--text-main)', lineHeight: 1.8, fontSize: '1.1rem', opacity: 0.9 }} dangerouslySetInnerHTML={{ __html: singleNews.content }}></div>
              </div>
            </article>
          ) : (
            // NEWS LIST VIEW
            <>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '2rem', textAlign: 'center' }}>Latest News & Events</h1>
              
              {newsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Belum ada berita yang diterbitkan.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                  {newsList.map(n => (
                    <Link to={`/news?slug=${n.slug}`} key={n.id} className="premium-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
                      <div style={{ height: '220px', backgroundImage: `url('${n.image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--border-color)' }}></div>
                      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{new Date(n.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.4 }}>{n.title}</h3>
                        <div style={{ marginTop: 'auto', color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          Read more <span style={{ transition: 'transform 0.2s' }}>&rarr;</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer id="contacts" style={{ background: 'var(--text-main)', color: 'var(--background-main)', padding: '4rem 2rem 2rem', width: '100%', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'left' }}>
          <div>
            <h5 style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--surface-color)', fontSize: '1.1rem' }}>Our Address</h5>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
              <a href="https://maps.app.goo.gl/24TFvPCeZArUgqt66" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'inherit'}>
                Jl. Telekomunikasi 1 Terusan Buah Batu Bojongsoang<br />
                Kabupaten Bandung, Jawa Barat
              </a>
            </p>
          </div>
          <div>
            <h5 style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--surface-color)', fontSize: '1.1rem' }}>Contact Us</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.8' }}>
              <li>Phone: <a href="https://wa.me/6282318070048" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'inherit'}>0823-1807-0048</a></li>
              <li>Email: <a href="mailto:amto@telkomuniversity.ac.id" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'inherit'}>amto@telkomuniversity.ac.id</a></li>
              <li>Website: <a href="http://amto.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary-color)'} onMouseOut={e => e.target.style.color = 'inherit'}>http://amto.telkomuniversity.ac.id</a></li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--surface-color)', fontSize: '1.1rem' }}>Social Media</h5>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>For news & updates follow us</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="https://www.instagram.com/teluatc/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', color: 'var(--surface-color)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Telkom University Aviation Training Center. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default News;
