import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function SellersPage() {
  const { addToast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [form, setForm] = useState({
    firm_name: '', address: '', city: '', pincode: '', phone: '', gstin: '', email: '', state: '', pan_number: '', fssai_license_no: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  async function fetchSellers() {
    try {
      const { data, error } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSellers(data || []);
    } catch (err) {
      addToast('Error loading sellers: ' + (err.message || err), 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('sellers')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sellers').insert([form]);
        if (error) throw error;
      }
      setForm({ firm_name: '', address: '', city: '', pincode: '', phone: '', gstin: '', email: '', state: '', pan_number: '', fssai_license_no: '' });
      setShowForm(false);
      setEditingId(null);
      await fetchSellers();
      addToast(editingId ? 'Seller updated successfully' : 'Seller created successfully', 'success');
    } catch (err) {
      addToast('Error saving seller: ' + (err.message || err), 'error');
    }
  }

  async function deleteSeller(id) {
    if (!window.confirm('Delete this seller/firm?')) return;
    try {
      const { error } = await supabase.from('sellers').delete().eq('id', id);
      if (error) throw error;
      await fetchSellers();
      addToast('Seller deleted successfully', 'success');
    } catch (err) {
      addToast('Error deleting seller: ' + (err.message || err), 'error');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sellers / Firm</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(true); setEditingId(null);
          setForm({ firm_name: '', address: '', city: '', pincode: '', phone: '', gstin: '', email: '', state: '', pan_number: '', fssai_license_no: '' });
        }}>
          <Plus size={18} /> Add Seller Firm
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit Seller Firm' : 'Add Seller Firm'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field full">
              <label>Firm Name <span className="req">*</span></label>
              <input required value={form.firm_name} onChange={e => setForm({ ...form, firm_name: e.target.value })} />
            </div>
            <div className="field full">
              <label>Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="field">
              <label>City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
            </div>
            <div className="field">
              <label>GSTIN</label>
              <input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} />
            </div>
            <div className="field">
              <label>PAN Number</label>
              <input value={form.pan_number} onChange={e => setForm({ ...form, pan_number: e.target.value })} />
            </div>
            <div className="field">
              <label>FSSAI License No.</label>
              <input value={form.fssai_license_no} onChange={e => setForm({ ...form, fssai_license_no: e.target.value })} />
            </div>
            <div className="field full">
              <label>State</label>
              <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr><th>Firm Name</th><th>Address</th><th>City</th><th>Pincode</th><th>GSTIN</th><th>PAN</th><th>FSSAI</th><th>State</th><th>Phone</th><th>Email</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {sellers.map(s => (
            <tr key={s.id}>
              <td>{s.firm_name}</td>
              <td>{s.address || '—'}</td>
              <td>{s.city || '—'}</td>
              <td>{s.pincode || '—'}</td>
              <td>{s.gstin || '—'}</td>
              <td>{s.pan_number || '—'}</td>
              <td>{s.fssai_license_no || '—'}</td>
              <td>{s.state || '—'}</td>
              <td>{s.phone || '—'}</td>
              <td>{s.email || '—'}</td>
              <td className="actions">
                <button className="btn icon-btn" onClick={() => {
                  setForm({ firm_name: s.firm_name || '', address: s.address || '', city: s.city || '', pincode: s.pincode || '', phone: s.phone || '', gstin: s.gstin || '', email: s.email || '', state: s.state || '', pan_number: s.pan_number || '', fssai_license_no: s.fssai_license_no || '' });
                  setEditingId(s.id); setShowForm(true);
                }}><Edit3 size={16} /></button>
                <button className="btn icon-btn danger" onClick={() => deleteSeller(s.id)}><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
