import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../../lib/api';

const ManageModuleTopics = () => {
  const { moduleId } = useParams();
  const [moduleName, setModuleName] = useState('');
  const [topics, setTopics]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData]     = useState({ id: '', title: '', description: '', sequence_no: 1, duration_hours: 2 });
  const [message, setMessage]       = useState({ text: '', ok: true });
  const [saving, setSaving]         = useState(false);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const [resM, resT] = await Promise.all([
        apiFetch(`/api/modules?id=${moduleId}`),
        apiFetch(`/api/module_topics?module_id=${moduleId}`),
      ]);
      const [jsonM, jsonT] = await Promise.all([resM.json(), resT.json()]);
      if (jsonM.success) setModuleName(jsonM.data?.name || '');
      if (jsonT.success) setTopics(jsonT.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopics(); }, [moduleId]);

  const openModal = (item = null) => {
    if (item) {
      setFormData({ id: item.id, title: item.title, description: item.description || '', sequence_no: item.sequence_no, duration_hours: item.duration_hours || 2 });
    } else {
      const nextSeq = topics.length > 0 ? Math.max(...topics.map(t => t.sequence_no)) + 1 : 1;
      setFormData({ id: '', title: '', description: '', sequence_no: nextSeq, duration_hours: 2 });
    }
    setMessage({ text: '', ok: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', ok: true });
    try {
      const isEdit = Boolean(formData.id);
      const payload = { ...formData, module_id: moduleId };
      const res = await apiFetch(isEdit ? `/api/module_topics?id=${formData.id}` : '/api/module_topics', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchTopics();
      } else {
        setMessage({ text: json.message || 'Gagal menyimpan.', ok: false });
      }
    } catch {
      setMessage({ text: 'Terjadi kesalahan.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus topik ini?')) return;
    try {
      const res = await apiFetch(`/api/module_topics?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchTopics();
    } catch (e) { console.error(e); }
  };

  const inp = { style: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' } };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/master/modules" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
          ← Kembali ke Modules
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Topik Modul</h1>
            {moduleName && <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>Modul: <strong style={{ color: 'var(--text-main)' }}>{moduleName}</strong></p>}
          </div>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Tambah Topik</button>
        </div>
      </div>

      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div>
        ) : topics.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <p style={{ margin: 0 }}>Belum ada topik untuk modul ini.</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Tambahkan topik agar instruktur bisa membuat BAP.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>No.</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Judul Topik</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Durasi</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-color)', background: 'rgba(220,38,38,0.08)', padding: '3px 8px', borderRadius: '20px' }}>
                      {t.sequence_no}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t.description}</div>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {t.duration_hours} jam
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <button onClick={() => openModal(t)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '500', marginRight: '10px', fontSize: '0.875rem' }}>Edit</button>
                    <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
              {formData.id ? 'Edit Topik' : 'Tambah Topik Baru'}
            </h2>

            {message.text && (
              <div style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', borderRadius: '6px', fontSize: '0.875rem', background: message.ok ? '#dcfce7' : '#fee2e2', color: message.ok ? '#166534' : '#991b1b' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Judul Topik <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} required placeholder="Misal: Power Supplies: Lead Acid Batteries" {...inp} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Deskripsi</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} style={{ ...inp.style, resize: 'vertical' }} placeholder="Uraian singkat materi yang dibahas..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>No. Pertemuan</label>
                  <input type="number" min="1" value={formData.sequence_no} onChange={e => setFormData(f => ({ ...f, sequence_no: Number(e.target.value) }))} required {...inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Durasi (jam)</label>
                  <input type="number" min="0.5" step="0.5" value={formData.duration_hours} onChange={e => setFormData(f => ({ ...f, duration_hours: Number(e.target.value) }))} required {...inp} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>Batal</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: '6px' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageModuleTopics;
