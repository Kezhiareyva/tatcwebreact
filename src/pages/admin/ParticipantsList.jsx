import React, { useState, useEffect } from 'react';

const ParticipantsList = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [formData, setFormData] = useState({ id: '', participant_number: '', full_name: '', email: '', phone: '', status: 'ACTIVE' });
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/participants');
      const result = await response.json();
      
      if (result.success) {
        setParticipants(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch data from API. Make sure XAMPP is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchParticipants();
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
      const res = await fetch('/api/participants/import', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        fetchParticipants(); // Refresh table
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
    if (!window.confirm('Yakin ingin menghapus peserta ini? (Soft delete)')) return;
    try {
      const res = await fetch(`/api/participants?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) fetchParticipants();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    if (participants.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    
    // Create CSV content
    const headers = ["NIP / Nomor Identitas", "Nama Lengkap", "Email", "Nomor Telepon", "Program Diikuti", "Status"];
    const csvRows = [headers.join(',')];
    
    participants.forEach(p => {
      const row = [
        `"${p.participant_number || ''}"`,
        `"${p.full_name || ''}"`,
        `"${p.email || ''}"`,
        `"${p.phone || ''}"`,
        `"${p.enrolled_programs || ''}"`,
        `"${p.status || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_peserta_tatc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [p.participant_number, p.full_name, p.email, p.phone, p.enrolled_programs].some(v => String(v || '').toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || (p.status || 'ACTIVE') === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const openModal = (item = null) => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({ id: '', participant_number: '', full_name: '', email: '', phone: '', status: 'ACTIVE' });
    }
    setMessage('');
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Manage Participants</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Data pendaftaran peserta via web terhubung otomatis ke sini. Anda juga tetap dapat menambahkan peserta secara manual.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleExport} className="btn" style={{ padding: '8px 16px', borderRadius: '8px', color: '#059669', border: '1px solid #34d399', background: 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
          <button onClick={() => { setIsImportModalOpen(true); setImportResult(null); }} className="btn" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)', background: 'var(--surface-color)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import CSV
          </button>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>+ Add Participant</button>
        </div>
      </div>

      <div className="toolbar-panel">
        <div className="search-box"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama, nomor, email, program..." /></div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Semua status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
        <span className="result-count">{filteredParticipants.length} dari {participants.length} peserta</span>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading data...</div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--primary-color)' }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>NIP / Number</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Program / Batch Diikuti</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No participants found.</td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.participant_number || '-'}</td>
                      <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                      <td>{p.email}</td>
                      <td>{p.phone || '-'}</td>
                      <td>
                        {p.enrolled_programs ? (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', background: 'rgba(59, 130, 246, 0.08)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-block' }}>
                            {p.enrolled_programs}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Belum ada program aktif
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: p.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: p.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                          {p.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="table-actions">
                        <button onClick={() => openModal(p)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{formData.id ? 'Edit Participant' : 'Add Participant'}</h2>
            {message && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{message}</div>}
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Participant Number (NIP/ID)</label>
                <input type="text" value={formData.participant_number} onChange={e => setFormData({...formData, participant_number: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)' }}>
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
              <h2 className="modal-title">Import Data Peserta (CSV)</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="modal-close">&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <strong>Format Kolom (Wajib Berurutan):</strong><br />
                <code style={{ background: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', display: 'block', marginTop: '5px' }}>
                  nomor_identitas,nama_lengkap,email,nomor_telepon
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
                    <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn" style={{ border: '1px solid var(--border-color)', background: 'transparent' }}>Tutup</button>
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
    </>
  );
};

export default ParticipantsList;
