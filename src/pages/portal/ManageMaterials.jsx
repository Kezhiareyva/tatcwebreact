import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

const ManageMaterials = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  // Fetch all assigned sessions for dropdown
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const instructorId = user.profile?.id || 0;
        const res = await apiFetch(`/api/portal/instructor_dashboard?instructor_id=${instructorId}`);
        const json = await res.json();
        if (json.success) setSessions(json.data.upcoming_sessions);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.profile) fetchSessions();
  }, [user]);

  // Fetch materials for selected session
  const fetchMaterials = async () => {
    if (!selectedSessionId) {
      setMaterials([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/portal/materials?session_id=${selectedSessionId}&instructor_id=${user.profile.id}`);
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedSessionId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedSessionId || !title || !file) {
      setError('Sesi, Judul, dan File wajib diisi.');
      return;
    }

    const formData = new FormData();
    formData.append('session_id', selectedSessionId);
    formData.append('instructor_id', user.profile.id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await apiFetch('/api/portal/materials', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message);
        setTitle('');
        setDescription('');
        setFile(null);
        e.target.reset(); // reset file input
        fetchMaterials();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Gagal mengunggah materi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    try {
      const res = await apiFetch(`/api/portal/materials?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchMaterials();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.profile) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '2rem' }}>Materials Manager</h1>

      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Select Session</label>
        <select
          value={selectedSessionId}
          onChange={e => setSelectedSessionId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)' }}
        >
          <option value="">-- Select a Session --</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.session_date} | {s.start_time}-{s.end_time} | {s.title} ({s.batch_name})
            </option>
          ))}
        </select>
      </div>

      {selectedSessionId && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

          {/* Upload Form */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Upload Material</h2>
              {message && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}
              {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Slide Chapter 1" />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows="2"></textarea>
                </div>
                <div className="form-group">
                  <label>File (PDF, PPT, DOC, XLS)</label>
                  <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} required accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" />
                  <small style={{ color: 'var(--text-muted)' }}>Max size: 50MB for PPT, 25MB for others.</small>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
                  {loading ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
            </div>
          </div>

          {/* List Materials */}
          <div style={{ flex: '2 1 400px' }}>
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Uploaded Materials</h2>

              {loading && materials.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : materials.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {materials.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{m.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.file_type.toUpperCase()} • {(m.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={`/public${m.file_url}`} target="_blank" rel="noreferrer" className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>View</a>
                        <button onClick={() => handleDelete(m.id)} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#ef4444' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  Belum ada materi untuk kelas ini.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ManageMaterials;
