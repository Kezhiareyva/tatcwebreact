import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

const InputGrades = () => {
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch batches & exams
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [resBatches, resExams] = await Promise.all([
          apiFetch('/api/batches'),
          apiFetch('/api/exams')
        ]);
        const jsonB = await resBatches.json();
        const jsonE = await resExams.json();
        if (jsonB.success) setBatches(jsonB.data);
        if (jsonE.success) setExams(jsonE.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch participants when batch and exam are selected
  useEffect(() => {
    if (!selectedBatch || !selectedExam) {
      setParticipants([]);
      return;
    }

    const fetchParticipants = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/exam_results?exam_id=${selectedExam}&batch_id=${selectedBatch}`);
        const json = await res.json();
        if (json.success) {
          // prefill data
          const data = json.data.map(p => ({
            ...p,
            score: p.score || '',
            status: p.status || 'PENDING',
            notes: p.notes || ''
          }));
          setParticipants(data);

          // if there is an existing exam_date in the data, use it
          if (data.length > 0 && data[0].exam_date) {
            setExamDate(data[0].exam_date);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [selectedBatch, selectedExam]);

  const handleChange = (id, field, value) => {
    setParticipants(participants.map(p => {
      if (p.participant_id === id) {
        let newP = { ...p, [field]: value };
        // Auto status based on passing grade if score changes
        if (field === 'score' && value !== '') {
          const selectedExamData = exams.find(e => e.id === selectedExam);
          if (selectedExamData && selectedExamData.passing_grade) {
            newP.status = parseFloat(value) >= parseFloat(selectedExamData.passing_grade) ? 'PASSED' : 'FAILED';
          }
        }
        return newP;
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setMessage('');
    try {
      const res = await apiFetch('/api/exam_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExam,
          exam_date: examDate,
          results: participants
        })
      });
      const json = await res.json();
      setMessage(json.message);
      if (json.success) setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Gagal menyimpan data.');
    }
  };

  const handleExport = () => {
    if (participants.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    // Find exam details
    const selectedExamData = exams.find(e => e.id === selectedExam);
    const examName = selectedExamData ? selectedExamData.name : 'Unknown Exam';
    const batchName = batches.find(b => b.id === selectedBatch)?.name || 'Unknown Batch';

    const headers = ["NIP / Nomor Identitas", "Nama Lengkap", "Modul / Ujian", "Skor", "Status Kelulusan", "Catatan"];
    const csvRows = [headers.join(',')];

    participants.forEach(p => {
      const row = [
        `"${p.participant_number || ''}"`,
        `"${p.full_name || ''}"`,
        `"${examName}"`,
        `"${p.score || ''}"`,
        `"${p.status || 'PENDING'}"`,
        `"${p.notes || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nilai_${batchName.replace(/ /g, '_')}_${examName.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Input Grades (Nilai Ujian)</h1>

      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Batch</label>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <option value="">-- Pilih Batch --</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.program_name})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Ujian</label>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <option value="">-- Pilih Ujian --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type}) - KKM: {e.passing_grade || '-'}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Tanggal Ujian</label>
          <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
        </div>
      </div>

      {loading && <p>Loading participants...</p>}

      {!loading && selectedBatch && selectedExam && participants.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Tidak ada peserta di batch ini.</p>
      )}

      {!loading && selectedBatch && selectedExam && participants.length > 0 && (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Formulir Nilai</h2>
              <button onClick={handleExport} className="btn btn-glass" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', color: '#059669', borderColor: '#34d399', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export Nilai (CSV)
              </button>
            </div>
            {message && <span style={{ color: message.includes('Gagal') ? '#ef4444' : '#10b981', fontWeight: '500' }}>{message}</span>}
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>Save All Grades</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Peserta</th>
                <th style={{ width: '150px' }}>Score</th>
                <th style={{ width: '150px' }}>Status</th>
                <th>Catatan Khusus</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.participant_id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{p.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.participant_number || '-'}</div>
                  </td>
                  <td>
                    <input type="number" step="0.01" value={p.score} onChange={e => handleChange(p.participant_id, 'score', e.target.value)} placeholder="0-100" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                  </td>
                  <td>
                    <select value={p.status} onChange={e => handleChange(p.participant_id, 'status', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 'bold', color: p.status === 'PASSED' ? '#166534' : (p.status === 'FAILED' ? '#991b1b' : '#92400e'), background: p.status === 'PASSED' ? '#dcfce7' : (p.status === 'FAILED' ? '#fee2e2' : '#fef3c7') }}>
                      <option value="PENDING">Pending</option>
                      <option value="PASSED">Passed (Lulus)</option>
                      <option value="FAILED">Failed (Gagal)</option>
                    </select>
                  </td>
                  <td>
                    <input type="text" value={p.notes} onChange={e => handleChange(p.participant_id, 'notes', e.target.value)} placeholder="Opsional" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InputGrades;
