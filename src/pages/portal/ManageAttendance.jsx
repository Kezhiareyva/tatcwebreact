import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ManageAttendance = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all assigned sessions for dropdown
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const instructorId = user.profile?.id || 0;
        const res = await fetch(`/api/portal/instructor_dashboard?instructor_id=${instructorId}`);
        const json = await res.json();
        if (json.success) setSessions(json.data.upcoming_sessions);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.profile) fetchSessions();
  }, [user]);

  // Fetch participants for selected session
  useEffect(() => {
    if (!selectedSessionId) {
      setParticipants([]);
      return;
    }
    
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portal/attendance?session_id=${selectedSessionId}`);
        const json = await res.json();
        if (json.success) {
          // Initialize status if null
          const data = json.data.map(p => ({
            ...p,
            status: p.status || 'PRESENT',
            notes: p.notes || ''
          }));
          setParticipants(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [selectedSessionId]);

  const handleStatusChange = (id, newStatus) => {
    setParticipants(participants.map(p => p.participant_id === id ? { ...p, status: newStatus } : p));
  };

  const handleNotesChange = (id, newNotes) => {
    setParticipants(participants.map(p => p.participant_id === id ? { ...p, notes: newNotes } : p));
  };

  const handleSave = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/portal/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSessionId,
          recorded_by: user.id,
          attendances: participants
        })
      });
      const json = await res.json();
      setMessage(json.message);
      if (json.success) {
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      setMessage('Gagal menyimpan absensi.');
    }
  };

  if (!user?.profile) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '2rem' }}>Attendance Manager</h1>

      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Select Session</label>
        <select 
          value={selectedSessionId} 
          onChange={e => setSelectedSessionId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-main)' }}
        >
          <option value="">-- Choose a session to record attendance --</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>{s.session_date} | {s.batch_name} | {s.title}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading participants...</p>}

      {!loading && selectedSessionId && participants.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Tidak ada peserta yang terdaftar di batch untuk sesi ini.</p>
      )}

      {!loading && selectedSessionId && participants.length > 0 && (
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Participant List</h2>
            {message && <span style={{ color: message.includes('Gagal') ? '#ef4444' : '#10b981', fontWeight: '500' }}>{message}</span>}
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '8px' }}>Save Attendance</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem' }}>Participant</th>
                <th style={{ padding: '1rem 1.5rem', width: '250px' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.participant_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{p.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.participant_number || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <select 
                      value={p.status} 
                      onChange={e => handleStatusChange(p.participant_id, e.target.value)}
                      style={{ 
                        width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', 
                        background: p.status === 'PRESENT' ? '#dcfce7' : (p.status === 'ABSENT' ? '#fee2e2' : '#fef3c7'),
                        color: p.status === 'PRESENT' ? '#166534' : (p.status === 'ABSENT' ? '#991b1b' : '#92400e'),
                        fontWeight: '600'
                      }}
                    >
                      <option value="PRESENT">Present (Hadir)</option>
                      <option value="PERMITTED">Permitted (Izin)</option>
                      <option value="SICK">Sick (Sakit)</option>
                      <option value="ABSENT">Absent (Alpa)</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <input 
                      type="text" 
                      value={p.notes} 
                      onChange={e => handleNotesChange(p.participant_id, e.target.value)}
                      placeholder="Optional notes..."
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }}
                    />
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

export default ManageAttendance;
