import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageBatches = () => {
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', program_id: '', code: '', name: '', start_date: '', end_date: '', status: 'PLANNED' });
  const [message, setMessage] = useState('');

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/batches');
      const json = await res.json();
      if (json.success) setBatches(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await apiFetch('/api/programs');
      const json = await res.json();
      if (json.success) setPrograms(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await apiFetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchBatches();
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan/menghapus batch ini?')) return;
    try {
      const res = await apiFetch(`/api/batches?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) fetchBatches();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData({ ...item, program_id: item.program_id || (programs.length > 0 ? programs[0].id : '') });
    } else {
      setFormData({ id: '', program_id: programs.length > 0 ? programs[0].id : '', code: '', name: '', start_date: '', end_date: '', status: 'PLANNED' });
    }
    setMessage('');
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Batches</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Batch</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Code</th>
                <th style={{ padding: '1rem' }}>Batch Name</th>
                <th style={{ padding: '1rem' }}>Program</th>
                <th style={{ padding: '1rem' }}>Timeline</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data batch.</td></tr>
              ) : batches.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{m.code}</td>
                  <td style={{ padding: '1rem' }}>{m.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{m.program_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem' }}>Start: {m.start_date || '-'}</div>
                    <div style={{ fontSize: '0.85rem' }}>End: {m.end_date || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: m.status === 'ACTIVE' ? '#dcfce7' : (m.status === 'COMPLETED' ? '#e0e7ff' : '#fee2e2'), color: m.status === 'ACTIVE' ? '#166534' : (m.status === 'COMPLETED' ? '#3730a3' : '#991b1b') }}>
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
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{formData.id ? 'Edit Batch' : 'Add Batch'}</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Program</label>
                <select value={formData.program_id} onChange={e => setFormData({ ...formData, program_id: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                  <option value="" disabled>Select a program</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Batch Code</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} placeholder="e.g. B-01" />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Batch Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Date</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Date</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="PLANNED">PLANNED</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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

export default ManageBatches;
