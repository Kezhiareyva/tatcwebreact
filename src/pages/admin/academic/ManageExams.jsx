import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', program_id: '', code: '', name: '', type: 'INTERNAL', passing_grade: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchExams = async () => {
    try {
      const res = await apiFetch('/api/exams');
      const json = await res.json();
      if (json.success) setExams(json.data);
    } catch (e) {
      console.error(e);
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
    fetchExams();
    fetchPrograms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id
      ? `/api/exams?id=${formData.id}`
      : '/api/exams';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();

      if (json.success) {
        setMessage('Berhasil menyimpan data!');
        setShowForm(false);
        fetchExams();
        setFormData({ id: '', program_id: '', code: '', name: '', type: 'INTERNAL', passing_grade: '' });
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ujian ini?')) return;
    try {
      const res = await apiFetch(`/api/exams?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchExams();
      else alert(json.message);
    } catch (e) {
      alert('Error deleting exam.');
    }
  };

  const editExam = (exam) => {
    setFormData({ ...exam, program_id: exam.program_id || '' });
    setShowForm(true);
    setMessage('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Exams</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormData({ id: '', program_id: '', code: '', name: '', type: 'INTERNAL', passing_grade: '' }); setMessage(''); }}>
          {showForm ? 'Cancel' : '+ Add Exam'}
        </button>
      </div>

      {message && <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

      {showForm && (
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>{formData.id ? 'Edit Exam' : 'Add New Exam'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Program Terkait (Opsional)</label>
              <select value={formData.program_id} onChange={e => setFormData({ ...formData, program_id: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="">-- Umum / Tanpa Program Spesifik --</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Kode Ujian</label>
              <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nama Ujian</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tipe Ujian</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="INTERNAL">Internal TATC</option>
                <option value="AMTO_TELU">AMTO Tel-U</option>
                <option value="DKPPU">DKPPU Certification</option>
                <option value="SELECTION">Seleksi Awal</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Passing Grade (KKM)</label>
              <input type="number" step="0.01" value={formData.passing_grade} onChange={e => setFormData({ ...formData, passing_grade: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>{loading ? 'Saving...' : 'Save Exam'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Ujian</th>
              <th>Tipe</th>
              <th>Program</th>
              <th>Passing Grade</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr key={exam.id}>
                <td style={{ fontWeight: 'bold' }}>{exam.code}</td>
                <td>{exam.name}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 'bold' }}>{exam.type}</span></td>
                <td>{exam.program_name || '-'}</td>
                <td>{exam.passing_grade || '-'}</td>
                <td>
                  <button onClick={() => editExam(exam)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDelete(exam.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Hapus</button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data ujian.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageExams;
