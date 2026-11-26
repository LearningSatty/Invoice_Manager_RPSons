import { useState, useEffect } from 'react';
import { Plus, Download, Printer, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function InvoicesPage() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInvoices(); }, []);

  async function fetchInvoices() {
    try {
      const { data, error } = await supabase.from('invoices').select('*, sellers(firm_name), buyers(name)').order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      addToast('Error loading invoices: ' + (err.message || err), 'error');
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF(id) {
    window.open(`/api/invoices/${id}/pdf?download=1`, '_blank');
  }

  function previewPDF(id) {
    window.open(`/api/invoices/${id}/pdf`, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div className="page"><p className="muted">Loading invoices...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Invoices</h2>
        <Link to="/create-invoice" className="btn btn-primary"><Plus size={18} /> New Invoice</Link>
      </div>
      <table>
        <thead>
          <tr><th>Invoice No.</th><th>Seller Firm</th><th>Buyer</th><th>Date</th><th>PO No.</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.invoice_number}</td>
              <td>{inv.sellers?.firm_name || '—'}</td>
              <td>{inv.buyers?.name || '—'}</td>
              <td>{inv.date || '—'}</td>
              <td>{inv.po_number || '—'}</td>
              <td>₹ {(inv.total || 0).toFixed(2)}</td>
              <td className="actions">
                <button className="btn icon-btn" onClick={() => downloadPDF(inv.id)}><Download size={16} /></button>
                <Link className="btn icon-btn" title="Edit invoice" to={`/invoices/${inv.id}/edit`}><Pencil size={16} /></Link>
                <button className="btn icon-btn" title="Preview PDF" onClick={() => previewPDF(inv.id)}>
                  <Printer size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
