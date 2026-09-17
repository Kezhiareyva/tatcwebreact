import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';

const ManageUsers = () => {
  const { user } = useAuth(); // The currently logged-in admin/superadmin
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', email: '', password: '', role: 'PESERTA', status: 'ACTIVE' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`/api/users?requester_role=${user?.role}`);
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user?.role) fetchUsers();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // For Admin, ensure they don't submit ADMIN/SUPERADMIN roles even if they manipulate DOM
    if (!isSuperAdmin && (formData.role === 'ADMIN' || formData.role === 'SUPERADMIN')) {
      setMessage('Admin tidak dapat membuat atau mengubah role menjadi Admin/Superadmin.');
      setLoading(false);
      return;
    }

    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id
      ? `/api/users?id=${formData.id}&requester_role=${user?.role}`
      : `/api/users?requester_role=${user?.role}`;

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();

      if (json.success) {
        setMessage('Berhasil menyimpan pengguna!');
        setShowForm(false);
        fetchUsers();
        setFormData({ id: '', email: '', password: '', role: 'PESERTA', status: 'ACTIVE' });
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
    if (!window.confirm('Yakin ingin menghapus pengguna ini secara permanen? Catatan: Profil akademik di tabel Participants/Instructors tidak akan terhapus.')) return;
    try {
      const res = await apiFetch(`/api/users?id=${id}&requester_role=${user?.role}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchUsers();
      else alert(json.message);
    } catch (e) {
      alert('Error deleting user.');
    }
  };

  const editUser = (targetUser) => {
    setFormData({ ...targetUser, password: '' }); // password reset is optional
    setShowForm(true);
    setMessage('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manage Users (Accounts)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kelola akun login ke dalam sistem. {isSuperAdmin ? 'Anda memiliki akses ke semua peran.' : 'Anda hanya memiliki akses ke akun Peserta dan Instruktur.'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormData({ id: '', email: '', password: '', role: 'PESERTA', status: 'ACTIVE' }); setMessage(''); }}>
          {showForm ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      {message && <div style={{ padding: '1rem', background: message.includes('Gagal') || message.includes('tidak') ? '#fee2e2' : '#dcfce7', color: message.includes('Gagal') || message.includes('tidak') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>{message}</div>}

      {showForm && (
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>{formData.id ? 'Edit User Account' : 'Create New User Account'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Password {formData.id && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Kosongkan jika tidak ingin reset)</span>}</label>
              <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!formData.id} placeholder={formData.id ? "New password..." : "Password..."} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Role (Hak Akses)</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="PESERTA">PESERTA</option>
                <option value="INSTRUKTUR">INSTRUKTUR</option>
                {isSuperAdmin && <option value="ADMIN">ADMIN</option>}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Account Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>{loading ? 'Saving...' : (formData.id ? 'Save Changes' : 'Create User')}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Registered At</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 'bold' }}>{u.email}</td>
                <td>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: u.role.includes('ADMIN') ? '#fee2e2' : '#e0e7ff', color: u.role.includes('ADMIN') ? '#991b1b' : '#3730a3' }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: u.status === 'ACTIVE' ? '#dcfce7' : (u.status === 'SUSPENDED' ? '#fee2e2' : '#f1f5f9'), color: u.status === 'ACTIVE' ? '#166534' : (u.status === 'SUSPENDED' ? '#991b1b' : 'var(--text-muted)') }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.last_login_at || 'Never'}</td>
                <td style={{ fontSize: '0.85rem' }}>{u.created_at}</td>
                <td>
                  <button onClick={() => editUser(u)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px', fontWeight: '600' }}>Edit</button>
                  <button onClick={() => handleDelete(u.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>Hapus</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada pengguna yang dapat ditampilkan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
