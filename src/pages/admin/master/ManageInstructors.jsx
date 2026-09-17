import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [formData, setFormData] = useState({ id: '', full_name: '', email: '', phone: '', status: 'ACTIVE' });
  const [message, setMessage] = useState('');

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/instructors');
      const json = await res.json();
      if (json.success) setInstructors(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await apiFetch('/api/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchInstructors();
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menyimpan data.');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await apiFetch('/api/instructors/import', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        fetchInstructors(); // Refresh table
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengunggah file.');
    } finally {
      setImportLoading(false);
      setImportFile(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus instruktur ini?')) return;
    try {
      const res = await apiFetch(`/api/instructors?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) fetchInstructors();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({ id: '', full_name: '', email: '', phone: '', status: 'ACTIVE' });
    }
    setMessage('');
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Instructors</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => { setIsImportModalOpen(true); setImportResult(null); }} className="btn btn-glass" style={{ padding: '8px 16px', borderRadius: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import CSV
          </button>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Instructor</button>
        </div>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Full Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {instructors.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data instruktur.</td></tr>
              ) : instructors.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{m.full_name}</td>
                  <td style={{ padding: '1rem' }}>{m.email}</td>
                  <td style={{ padding: '1rem' }}>{m.phone}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: m.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: m.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => openModal(m)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{formData.id ? 'Edit Instructor' : 'Add Instructor'}</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Import Data Instruktur (CSV)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="modal-close">&times;</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <strong>Format Kolom (Wajib Berurutan):</strong><br />
                <code style={{ background: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', display: 'block', marginTop: '5px' }}>
                  nama_lengkap,email,nomor_telepon
                </code>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>* Pastikan baris pertama adalah judul kolom (header). Simpan file Excel Anda sebagai <i>Comma Separated Values (.csv)</i>.</p>
              </div>

              {importResult ? (
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Hasil Import:</h3>
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>Berhasil: {importResult.success_count} baris</div>
                  <div style={{ color: '#ef4444', fontWeight: 'bold' }}>Gagal: {importResult.error_count} baris</div>

                  {importResult.errors.length > 0 && (
                    <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto', background: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', color: '#991b1b' }}>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleImport}>
                  <div className="form-group">
                    <label>Pilih File CSV</label>
                    <input type="file" className="form-control" accept=".csv" required onChange={e => setImportFile(e.target.files[0])} />
                  </div>
                  <div className="modal-actions" style={{ marginTop: '2rem' }}>
                    <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn btn-glass">Tutup</button>
                    <button type="submit" className="btn btn-primary" disabled={importLoading}>
                      {importLoading ? 'Mengimpor...' : 'Mulai Import'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstructors;
