import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function BuyersPage() {
  const { addToast } = useToast();
  const [buyers, setBuyers] = useState([]);
  const [form, setForm] = useState({
    name: '', gstin: '', pan_no: '', cin_no: '', tin_no: '', email: '',
    billing_address_line: '', billing_phone: '', shipping_address_line: '', shipping_phone: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

  async function fetchBuyers() {
    try {
      const { data, error } = await supabase.from('buyers').select('*, buyer_addresses(*)').order('created_at', { ascending: false });
      if (error) throw error;
      setBuyers(data || []);
    } catch (err) {
      addToast('Error loading buyers: ' + (err.message || err), 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const addresses = [
        {
          type: 'billing',
          address_line: form.billing_address_line,
          phone: form.billing_phone,
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          is_default: true,
        },
        {
          type: 'shipping',
          address_line: form.shipping_address_line,
          phone: form.shipping_phone,
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          is_default: true,
        },
      ];

      if (editingId) {
        const { error } = await supabase.from('buyers').update({
          name: form.name, gstin: form.gstin, pan_no: form.pan_no, cin_no: form.cin_no,
          tin_no: form.tin_no, email: form.email,
          updated_at: new Date().toISOString(),
        }).eq('id', editingId);
        if (error) throw error;

        const { error: delErr } = await supabase.from('buyer_addresses').delete().eq('buyer_id', editingId);
        if (delErr) throw delErr;
        const { error: insErr } = await supabase.from('buyer_addresses').insert(addresses.map(a => ({ ...a, buyer_id: editingId })));
        if (insErr) throw insErr;
      } else {
        const { data: buyer, error } = await supabase
          .from('buyers')
          .insert([{ name: form.name, gstin: form.gstin, pan_no: form.pan_no, cin_no: form.cin_no, tin_no: form.tin_no, email: form.email }])
          .select()
          .single();
        if (error) throw error;

        const { error: addrError } = await supabase.from('buyer_addresses').insert(addresses.map(a => ({ ...a, buyer_id: buyer.id })));
        if (addrError) throw addrError;
      }

      setForm({
        name: '', gstin: '', pan_no: '', cin_no: '', tin_no: '', email: '',
        billing_address_line: '', billing_phone: '', shipping_address_line: '', shipping_phone: '',
      });
      setShowForm(false);
      setEditingId(null);
      await fetchBuyers();
      addToast(editingId ? 'Buyer updated successfully' : 'Buyer created successfully', 'success');
    } catch (err) {
      addToast('Error saving buyer: ' + (err.message || err), 'error');
    }
  }

  async function deleteBuyer(id) {
    if (!window.confirm('Delete this buyer?')) return;
    try {
      const { error } = await supabase.from('buyers').delete().eq('id', id);
      if (error) throw error;
      await fetchBuyers();
      addToast('Buyer deleted successfully', 'success');
    } catch (err) {
      addToast('Error deleting buyer: ' + (err.message || err), 'error');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Buyers</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(true); setEditingId(null);
          setForm({
            name: '', gstin: '', pan_no: '', cin_no: '', tin_no: '', email: '',
            billing_address_line: '', billing_phone: '', shipping_address_line: '', shipping_phone: '',
          });
        }}>
          <Plus size={18} /> Add Buyer
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit Buyer' : 'Add Buyer'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Buyer Name</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>GSTIN <span className="req">*</span></label>
              <input required value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} />
            </div>
            <div className="field">
              <label>PAN No <span className="req">*</span></label>
              <input required value={form.pan_no} onChange={e => setForm({ ...form, pan_no: e.target.value })} />
            </div>
            <div className="field">
              <label>CIN No</label>
              <input value={form.cin_no} onChange={e => setForm({ ...form, cin_no: e.target.value })} />
            </div>
            <div className="field">
              <label>TIN No</label>
              <input value={form.tin_no} onChange={e => setForm({ ...form, tin_no: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field full">
              <label style={{ fontWeight: 600 }}><h4 style={{ margin: 0, fontSize: '1rem', display: 'inline' }}>Billing Address</h4></label>
            </div>
            <div className="field full">
              <label>Billing Address</label>
              <textarea rows="4" value={form.billing_address_line} onChange={e => setForm({ ...form, billing_address_line: e.target.value })} />
            </div>
            <div className="field">
              <label>Billing Phone</label>
              <input type="tel" value={form.billing_phone} onChange={e => setForm({ ...form, billing_phone: e.target.value })} />
            </div>

            <div className="field full">
              <label style={{ fontWeight: 600 }}><h4 style={{ margin: 0, fontSize: '1rem', display: 'inline' }}>Shipping Address</h4></label>
            </div>
            <div className="field full">
              <label>Shipping Address</label>
              <textarea rows="4" value={form.shipping_address_line} onChange={e => setForm({ ...form, shipping_address_line: e.target.value })} />
            </div>
            <div className="field">
              <label>Shipping Phone</label>
              <input type="tel" value={form.shipping_phone} onChange={e => setForm({ ...form, shipping_phone: e.target.value })} />
            </div>

            <div className="field actions full">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr><th>Name</th><th>GSTIN</th><th>PAN</th><th>CIN</th><th>TIN</th><th>Billing Phone</th><th>Shipping Phone</th><th>Billing Address</th><th>Shipping Address</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {buyers.map(b => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{b.gstin || '—'}</td>
              <td>{b.pan_no || '—'}</td>
              <td>{b.cin_no || '—'}</td>
              <td>{b.tin_no || '—'}</td>
              <td>{b.buyer_addresses?.find(address => address.type === 'billing')?.phone || '—'}</td>
              <td>{b.buyer_addresses?.find(address => address.type === 'shipping')?.phone || b.phone || '—'}</td>
              <td className="address-cell">
                {b.buyer_addresses?.find(address => address.type === 'billing')?.address_line || '—'}
              </td>
              <td className="address-cell">
                {b.buyer_addresses?.find(address => address.type === 'shipping')?.address_line || '—'}
              </td>
              <td className="actions">
                <button className="btn icon-btn" onClick={() => {
                  setForm({
                    name: b.name || '',
                    gstin: b.gstin || '',
                    pan_no: b.pan_no || '',
                    cin_no: b.cin_no || '',
                    tin_no: b.tin_no || '',
                    email: b.email || '',
                    billing_address_line: b.buyer_addresses?.find(address => address.type === 'billing')?.address_line || '',
                    billing_phone: b.buyer_addresses?.find(address => address.type === 'billing')?.phone || '',
                    shipping_address_line: b.buyer_addresses?.find(address => address.type === 'shipping')?.address_line || '',
                    shipping_phone: b.buyer_addresses?.find(address => address.type === 'shipping')?.phone || b.phone || ''
                  });
                  setEditingId(b.id); setShowForm(true);
                }}><Edit3 size={16} /></button>
                <button className="btn icon-btn danger" onClick={() => deleteBuyer(b.id)}><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
