import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManagePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', urutan: 0, status: 'PUBLISHED' });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cms/partners');
      const json = await res.json();
      if (json.success) setPartners(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    const form = new FormData();
    if (formData.id) form.append('id', formData.id);
    form.append('name', formData.name);
    form.append('urutan', formData.urutan);
    form.append('status', formData.status);
    if (imageFile) form.append('logo', imageFile);

    try {
      const res = await apiFetch('/api/cms/partners', {
        method: 'POST',
        body: form
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchPartners();
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus partner ini?')) return;
    try {
      const res = await apiFetch('/api/cms/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) fetchPartners();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (partner = null) => {
    if (partner) {
      setFormData({ id: partner.id, name: partner.name, urutan: partner.urutan, status: partner.status });
    } else {
      setFormData({ id: '', name: '', urutan: partners.length + 1, status: 'PUBLISHED' });
    }
    setImageFile(null);
    setMessage('');
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Media Partners</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Partner</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Urutan</th>
                <th style={{ padding: '1rem' }}>Logo</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{p.urutan}</td>
                  <td style={{ padding: '1rem' }}><img src={p.logo_url} alt="Logo" style={{ height: '30px', background: 'var(--border-color)', borderRadius: '4px', padding: '2px' }} /></td>
                  <td style={{ padding: '1rem' }}>{p.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: p.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9', color: p.status === 'PUBLISHED' ? '#166534' : 'var(--text-muted)' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => openModal(p)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{formData.id ? 'Edit Partner' : 'Add Partner'}</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Partner Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Urutan</label>
                  <input type="number" value={formData.urutan} onChange={e => setFormData({ ...formData, urutan: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Logo Image {formData.id && '(Kosongkan jika tidak mengubah)'}</label>
                <input type="file" accept="image/jpeg, image/png, image/webp" onChange={e => setImageFile(e.target.files[0])} required={!formData.id} style={{ fontSize: '0.9rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Maks. 2MB. Rekomendasi lebar 400px (PNG Transparan).</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePartners;
