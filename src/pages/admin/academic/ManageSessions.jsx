import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [modules, setModules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', batch_id: '', module_id: '', room_id: '', title: '', session_date: '', start_time: '', end_time: '', status: 'SCHEDULED', instructors: [] });
  const [message, setMessage] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/sessions');
      const json = await res.json();
      if (json.success) setSessions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [resB, resM, resR, resI] = await Promise.all([
        apiFetch('/api/batches'),
        apiFetch('/api/modules'),
        apiFetch('/api/rooms'),
        apiFetch('/api/instructors')
      ]);
      const [jsonB, jsonM, jsonR, jsonI] = await Promise.all([resB.json(), resM.json(), resR.json(), resI.json()]);
      if (jsonB.success) setBatches(jsonB.data);
      if (jsonM.success) setModules(jsonM.data);
      if (jsonR.success) setRooms(jsonR.data);
      if (jsonI.success) setInstructors(jsonI.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchSessions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await apiFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchSessions();
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan sesi ini?')) return;
    try {
      const res = await apiFetch(`/api/sessions?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setFormData({ ...item, instructors: item.instructors || [] });
    } else {
      setFormData({ id: '', batch_id: batches.length > 0 ? batches[0].id : '', module_id: '', room_id: '', title: '', session_date: '', start_time: '', end_time: '', status: 'SCHEDULED', instructors: [] });
    }
    setMessage('');
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Sessions</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Session</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Date & Time</th>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Batch & Instructor</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data jadwal sesi.</td></tr>
              ) : sessions.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{m.session_date}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.start_time} - {m.end_time}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{m.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.module_name}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{m.batch_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#0ea5e9' }}>{m.instructor_names ? m.instructor_names : 'Tidak ada instruktur'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{m.room_name || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', background: m.status === 'COMPLETED' ? '#dcfce7' : (m.status === 'SCHEDULED' ? '#e0e7ff' : '#fee2e2'), color: m.status === 'COMPLETED' ? '#166534' : (m.status === 'SCHEDULED' ? '#3730a3' : '#991b1b') }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => openModal(m)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Cancel</button>
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
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{formData.id ? 'Edit Session' : 'Add Session'}</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} placeholder="e.g. Day 1: Introduction" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Batch</label>
                  <select value={formData.batch_id} onChange={e => setFormData({ ...formData, batch_id: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="" disabled>Select Batch</option>
                    {batches.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Module (Optional)</label>
                  <select value={formData.module_id || ''} onChange={e => setFormData({ ...formData, module_id: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="">No Module</option>
                    {modules.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Room (Optional)</label>
                  <select value={formData.room_id || ''} onChange={e => setFormData({ ...formData, room_id: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="">No Room</option>
                    {rooms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                  <input type="date" value={formData.session_date} onChange={e => setFormData({ ...formData, session_date: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Time</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Instructors</label>
                <select multiple value={formData.instructors} onChange={e => {
                  const options = [...e.target.options];
                  const values = options.filter(o => o.selected).map(o => o.value);
                  setFormData({ ...formData, instructors: values });
                }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', minHeight: '80px' }}>
                  {instructors.map(ins => <option key={ins.id} value={ins.id}>{ins.full_name}</option>)}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple instructors.</div>
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

export default ManageSessions;
