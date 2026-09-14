import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ManageProgramForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/admin/programs/${id}/fields`);
        const json = await res.json();
        if (json.success) {
          setFields(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [id]);

  const addField = () => {
    setFields([
      ...fields,
      { label: '', field_type: 'TEXT', options_json: '', is_required: false, allowed_extensions: '' }
    ]);
  };

  const removeField = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      const temp = newFields[index];
      newFields[index] = newFields[index - 1];
      newFields[index - 1] = temp;
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      const temp = newFields[index];
      newFields[index] = newFields[index + 1];
      newFields[index + 1] = temp;
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/programs/${id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Form fields saved successfully.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(json.message);
      }
    } catch (err) {
      setMessage('Failed to save fields.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading form builder...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button onClick={() => navigate('/admin/master/programs')} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            &larr; Back to Programs
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Form Builder (Program {id})</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: '8px' }}>
          {saving ? 'Saving...' : 'Save Form'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {fields.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            Belum ada form yang ditambahkan. Klik tombol di bawah untuk menambah pertanyaan.
          </div>
        ) : fields.map((field, index) => (
          <div key={index} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => moveField(index, 'up')} disabled={index === 0} style={{ padding: '4px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}>&uarr;</button>
                <button onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1} style={{ padding: '4px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}>&darr;</button>
              </div>
              <button onClick={() => removeField(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>&times; Remove</button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Label Pertanyaan</label>
                <input type="text" value={field.label} onChange={e => handleChange(index, 'label', e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)' }} placeholder="e.g. Nama Lengkap, Upload Ijazah" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Tipe Input</label>
                <select value={field.field_type} onChange={e => handleChange(index, 'field_type', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)' }}>
                  <option value="TEXT">Text Pendek</option>
                  <option value="TEXTAREA">Text Panjang</option>
                  <option value="SELECT">Dropdown (Select)</option>
                  <option value="RADIO">Pilihan Ganda (Radio)</option>
                  <option value="CHECKBOX">Pilihan Banyak (Checkbox)</option>
                  <option value="FILE">Upload File</option>
                </select>
              </div>
            </div>

            {['SELECT', 'RADIO', 'CHECKBOX'].includes(field.field_type) && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Opsi Jawaban (pisahkan dengan koma)</label>
                <input type="text" value={field.options_json} onChange={e => handleChange(index, 'options_json', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)' }} placeholder="e.g. S, M, L, XL" />
              </div>
            )}

            {field.field_type === 'FILE' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Ekstensi Diizinkan (opsional, misal: .pdf,.jpg)</label>
                <input type="text" value={field.allowed_extensions || ''} onChange={e => handleChange(index, 'allowed_extensions', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background-main)', color: 'var(--text-main)' }} placeholder="e.g. .pdf,.jpg,.png" />
              </div>
            )}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={field.is_required} onChange={e => handleChange(index, 'is_required', e.target.checked)} />
                <span style={{ fontSize: '0.85rem' }}>Wajib Diisi (Required)</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addField} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '2px dashed var(--primary-color)', color: 'var(--primary-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
        + Tambah Pertanyaan
      </button>
    </div>
  );
};

export default ManageProgramForm;
