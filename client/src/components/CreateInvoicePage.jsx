import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { amountToWords } from '../utils/amountToWords';

function getInvoiceTotals(items, taxPercentage) {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const tax = subtotal * Number(taxPercentage) / 100;
  const total = subtotal + tax;

  return {
    subtotal: subtotal.toFixed(2),
    tax,
    total: total.toFixed(2),
    total_in_words: amountToWords(total)
  };
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState({
    invoice_number: '', date: new Date().toISOString().split('T')[0], seller_id: '', buyer_id: '',
    billing_address_id: '', shipping_address_id: '', po_number: '',
    state: '', tax_percentage: 0, subtotal: 0, tax: 0, total: 0, total_in_words: amountToWords(0),
    items: [{ item_name: '', item_code: '', hsn_sac: '', quantity: 1, unit: 'EA', price_per_unit: '', amount: 0 }],
  });
  const [nextNumber, setNextNumber] = useState('');
  const [numberWarning, setNumberWarning] = useState('');
  const [numberExists, setNumberExists] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [buyerDetail, setBuyerDetail] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(Boolean(invoiceId));

  useEffect(() => {
    fetchBuyers();
    fetchSellers();
    if (invoiceId) {
      setLoadingInvoice(true);
      loadInvoice();
    } else {
      fetchNextNumber();
    }
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed with status ${response.status}`);
      const items = (result.invoice_items || []).map(item => ({
        item_name: item.item_name || '',
        item_code: item.item_code || '',
        hsn_sac: item.hsn_sac || '',
        quantity: String(item.quantity ?? ''),
        unit: item.unit || 'EA',
        price_per_unit: String(item.price_per_unit ?? ''),
        amount: Number(item.amount || 0).toFixed(2)
      }));
      const totals = getInvoiceTotals(items, result.tax_percentage || 0);
      setInvoice({
        invoice_number: result.invoice_number || '',
        date: result.date || new Date().toISOString().split('T')[0],
        seller_id: result.seller_id || '',
        buyer_id: result.buyer_id || '',
        billing_address_id: result.billing_address_id || '',
        shipping_address_id: result.shipping_address_id || '',
        po_number: result.po_number || '',
        state: result.state || '',
        tax_percentage: result.tax_percentage || 0,
        ...totals,
        items
      });
    } catch (err) {
      addToast('Error loading invoice: ' + (err.message || err), 'error');
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function fetchBuyers() {
    try {
      const { data, error } = await supabase.from('buyers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBuyers(data || []);
    } catch (err) {
      addToast('Error loading buyers: ' + (err.message || err), 'error');
    }
  }

  async function fetchSellers() {
    try {
      const { data, error } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSellers(data || []);
    } catch (err) {
      addToast('Error loading sellers: ' + (err.message || err), 'error');
    }
  }

  async function fetchNextNumber() {
    try {
      const { data, error } = await supabase.from('invoices').select('invoice_number').order('invoice_number', { ascending: false }).limit(1);
      if (error) throw error;
      let next = 1;
      if (data && data.length > 0) next = parseInt(data[0].invoice_number, 10) + 1;
      setNextNumber(next.toString());
      setInvoice(prev => ({ ...prev, invoice_number: next.toString() }));
      setNumberWarning('');
      setNumberExists(false);
    } catch (err) {
      addToast('Error loading invoice number: ' + (err.message || err), 'error');
    }
  }

  async function validateNumber() {
    const num = invoice.invoice_number;
    if (!/^\d+$/.test(num)) {
      setNumberExists(false);
      setNumberWarning('Must be numeric');
      return;
    }
    try {
      let existingQuery = supabase.from('invoices').select('id').eq('invoice_number', num);
      if (invoiceId) existingQuery = existingQuery.neq('id', invoiceId);
      const { data: existing, error: existErr } = await existingQuery.limit(1);
      if (existErr) throw existErr;
      if (existing && existing.length > 0) {
        setNumberExists(true);
        setNumberWarning(`Invoice number ${num} is already used.`);
        return;
      }
      setNumberExists(false);
      const { data: maxData, error: maxErr } = await supabase.from('invoices').select('invoice_number').order('invoice_number', { ascending: false }).limit(1);
      if (maxErr) throw maxErr;
      if (maxData && maxData.length > 0) {
        const maxNum = parseInt(maxData[0].invoice_number, 10);
        if (parseInt(num, 10) < maxNum) {
          setNumberWarning(`Invoice number ${num} is less than highest existing (${maxNum}).`);
          return;
        }
      }
      setNumberWarning('');
      setNumberExists(false);
    } catch (err) {
      addToast('Error validating invoice number: ' + (err.message || err), 'error');
    }
  }

  async function loadBuyer() {
    if (!invoice.buyer_id) return;
    try {
      const { data, error } = await supabase.from('buyers').select('*, buyer_addresses(*)').eq('id', invoice.buyer_id).single();
      if (error) throw error;
      setBuyerDetail(data);
    } catch (err) {
      addToast('Error loading buyer: ' + (err.message || err), 'error');
    }
  }

  useEffect(() => { if (invoice.buyer_id) loadBuyer(); }, [invoice.buyer_id]);

  function addItem() {
    setInvoice(prev => ({ ...prev, items: [...prev.items, { item_name: '', item_code: '', hsn_sac: '', quantity: 1, unit: 'EA', price_per_unit: '', amount: 0 }] }));
  }
  function removeItem(i) {
    setInvoice(prev => {
      const items = prev.items.filter((_, idx) => idx !== i);
      return { ...prev, items, ...getInvoiceTotals(items, prev.tax_percentage) };
    });
  }
  function updateItem(i, key, val) {
    setInvoice(prev => {
      const items = [...prev.items];
      items[i] = { ...items[i], [key]: val };
      const q = parseFloat(items[i].quantity) || 0;
      const p = parseFloat(items[i].price_per_unit) || 0;
      items[i].amount = (q * p).toFixed(2);
      return { ...prev, items, ...getInvoiceTotals(items, prev.tax_percentage) };
    });
  }

  function updateTaxPercentage(value) {
    setInvoice(prev => {
      return { ...prev, tax_percentage: value, ...getInvoiceTotals(prev.items, value) };
    });
  }

  async function saveInvoice(e) {
    e.preventDefault();
    if (!invoice.invoice_number || !/^\d+$/.test(invoice.invoice_number)) { addToast('Invoice number must be numeric', 'error'); return; }
    if (!invoice.seller_id) { addToast('Seller is required', 'error'); return; }
    if (!invoice.buyer_id) { addToast('Buyer is required', 'error'); return; }
    if (!invoice.po_number.trim()) { addToast('PO Number is required', 'error'); return; }
    if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
      addToast('Add at least one order item', 'error');
      return;
    }

    for (const [index, item] of invoice.items.entries()) {
      const itemNumber = index + 1;
      const itemName = item.item_name.trim();
      const quantity = Number(item.quantity);
      const pricePerUnit = Number(item.price_per_unit);

      if (!itemName) {
        addToast(`Enter Item Name for item ${itemNumber}`, 'error');
        return;
      }
      if (item.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) {
        addToast(`Enter a valid Quantity greater than 0 for item ${itemNumber}`, 'error');
        return;
      }
      if (!/^(?:\d+\.?\d*|\.\d+)$/.test(item.price_per_unit) || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
        addToast(`Enter a valid Price/Unit greater than 0 for item ${itemNumber}`, 'error');
        return;
      }
    }

    // Send all data (invoice + items) in one payload
    const payload = {
      invoice_number: invoice.invoice_number,
      date: invoice.date,
      seller_id: invoice.seller_id,
      buyer_id: invoice.buyer_id,
      billing_address_id: invoice.billing_address_id,
      shipping_address_id: invoice.shipping_address_id,
      po_number: invoice.po_number,
      state: invoice.state,
      tax_percentage: invoice.tax_percentage || 0,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      total_in_words: invoice.total_in_words,
      items: invoice.items.map(it => ({
        item_name: it.item_name,
        item_code: it.item_code,
        hsn_sac: it.hsn_sac,
        quantity: it.quantity,
        unit: it.unit,
        price_per_unit: it.price_per_unit,
        amount: it.amount
      }))
    };
    try {
      const response = await fetch(invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices', {
        method: invoiceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }

      addToast(invoiceId ? 'Invoice updated successfully' : 'Invoice saved successfully', 'success');
      navigate('/invoices');
    } catch (err) {
      addToast('Error saving invoice: ' + (err.message || err), 'error');
    }
  }

  if (loadingInvoice) {
    return <div className="page"><p className="muted">Loading invoice...</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/invoices"><ArrowLeft size={20} /></Link>
        <h2>{invoiceId ? 'Edit Invoice' : 'Create Invoice'}</h2>
      </div>

      <div className="invoice-form">
        <div className="card trade-card">
          <h3>1. Trade Information</h3>
          <div className="form-grid">
            <div className="field">
              <label>Invoice No.</label>
              <div className="input-with-btn">
                <input
                  required maxLength="20"
                  value={invoice.invoice_number}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    setInvoice(prev => ({ ...prev, invoice_number: v }));
                    setNumberWarning('');
                    setNumberExists(false);
                  }}
                  onBlur={validateNumber}
                />
                <button type="button" className="btn small" onClick={fetchNextNumber}><RefreshCw size={16} /></button>
              </div>
              {numberWarning && <div className={`hint ${numberExists ? 'error' : 'warning'}`}>{numberWarning}</div>}
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" required value={invoice.date} onChange={e => setInvoice({ ...invoice, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Seller / Firm <span className="req">*</span></label>
              <select required value={invoice.seller_id} onChange={e => setInvoice({ ...invoice, seller_id: e.target.value })}>
                <option value="">Select seller firm</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.firm_name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Buyer</label>
              <select required value={invoice.buyer_id} onChange={e => setInvoice({ ...invoice, buyer_id: e.target.value })}>
                <option value="">Select buyer</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Billing Address</label>
              <select value={invoice.billing_address_id} onChange={e => setInvoice({ ...invoice, billing_address_id: e.target.value })}>
                <option value="">Same as buyer default</option>
                {buyerDetail?.buyer_addresses?.filter(a => a.type === 'billing').map(a => (
                  <option key={a.id} value={a.id}>{a.address_line}, {a.city}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Shipping Address</label>
              <select value={invoice.shipping_address_id} onChange={e => setInvoice({ ...invoice, shipping_address_id: e.target.value })}>
                <option value="">Same as billing</option>
                {buyerDetail?.buyer_addresses?.filter(a => a.type === 'shipping').map(a => (
                  <option key={a.id} value={a.id}>{a.address_line}, {a.city}</option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>PO Number <span className="req">*</span></label>
              <input required maxLength={15} value={invoice.po_number} onChange={e => setInvoice({ ...invoice, po_number: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card order-card">
          <h3>2. Order Details</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Item Name</th><th>Item Code</th><th>HSN/SAC</th><th>Quantity</th><th>Unit</th><th>Price/Unit</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i}>
                    <td><input value={it.item_name} onChange={e => updateItem(i, 'item_name', e.target.value)} /></td>
                    <td><input value={it.item_code} onChange={e => updateItem(i, 'item_code', e.target.value)} /></td>
                    <td><input value={it.hsn_sac} onChange={e => updateItem(i, 'hsn_sac', e.target.value)} /></td>
                    <td><input type="number" min="0.01" step="any" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td>
                    <td>
                      <select value={it.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                        <option value="KG">KG</option>
                        <option value="EA">EA</option>
                        <option value="Pack">Pack</option>
                        <option value="Box">Box</option>
                        <option value="m">m</option>
                      </select>
                    </td>
                    <td><input type="text" inputMode="decimal" value={it.price_per_unit} onChange={e => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) updateItem(i, 'price_per_unit', value);
                    }} /></td>
                    <td className="amount">{parseFloat(it.amount).toFixed(2)}</td>
                    <td><button className="btn icon-btn danger" onClick={() => removeItem(i)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn" onClick={addItem}><Plus size={18} /> Add Item</button>
          <div className="totals">
            <div className="tax-row">
              <div className="tax-selector">
                <label htmlFor="tax-percentage">Tax</label>
                <select id="tax-percentage" value={invoice.tax_percentage} onChange={e => updateTaxPercentage(e.target.value)}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <span>{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="grand"><span>Total</span><span>{invoice.total}</span></div>
            <div className="field full">
              <label>Total in Words</label>
              <input value={invoice.total_in_words} readOnly />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveInvoice}><Save size={20} /> {invoiceId ? 'Update Invoice' : 'Save Invoice'}</button>
        </div>
      </div>
    </div>
  );
}
