require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5002;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Invoice Manager API running' });
});
// ===================== BUYERS =====================

app.get('/api/buyers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/buyers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*, buyer_addresses(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Buyer not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buyers', async (req, res) => {
  try {
    const { name, gstin, pan_no, cin_no, tin_no, email, phone, addresses = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Buyer name is required' });

    const { data: buyer, error } = await supabase
      .from('buyers')
      .insert([{ name, gstin, pan_no, cin_no, tin_no, email, phone }])
      .select()
      .single();
    if (error) throw error;

    if (addresses && addresses.length > 0) {
      const addressRows = addresses.map(addr => ({
        buyer_id: buyer.id,
        type: addr.type || 'billing',
        address_line: addr.address_line || '',
        phone: addr.phone || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        country: addr.country || 'India',
        is_default: addr.is_default || false
      }));
      const { error: addrError } = await supabase.from('buyer_addresses').insert(addressRows);
      if (addrError) throw addrError;
    }

    res.status(201).json(buyer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/buyers/:id', async (req, res) => {
  try {
    const { name, gstin, pan_no, cin_no, tin_no, email, phone } = req.body;
    const { data, error } = await supabase
      .from('buyers')
      .update({ name, gstin, pan_no, cin_no, tin_no, email, phone, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Buyer not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/buyers/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('buyers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Buyer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buyers/:id/addresses', async (req, res) => {
  try {
    const { type, address_line, phone, city, state, pincode, country, is_default } = req.body;
    const { data, error } = await supabase
      .from('buyer_addresses')
      .insert([{
        buyer_id: req.params.id,
        type: type || 'billing',
        address_line, phone, city, state, pincode, country: country || 'India',
        is_default: is_default || false
      }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== SELLERS =====================

app.get('/api/sellers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sellers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Seller not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sellers', async (req, res) => {
  try {
    const { firm_name, address, city, pincode, phone, gstin, email, state, pan_number, fssai_license_no } = req.body;
    if (!firm_name) return res.status(400).json({ error: 'Firm name is required' });

    const { data, error } = await supabase
      .from('sellers')
      .insert([{ firm_name, address, city, pincode, phone, gstin, email, state, pan_number, fssai_license_no }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sellers/:id', async (req, res) => {
  try {
    const { firm_name, address, city, pincode, phone, gstin, email, state, pan_number, fssai_license_no } = req.body;
    const { data, error } = await supabase
      .from('sellers')
      .update({ firm_name, address, city, pincode, phone, gstin, email, state, pan_number, fssai_license_no, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Seller not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sellers/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('sellers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Seller deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== INVOICES =====================

app.get('/api/invoices/next-number', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1);
    if (error) throw error;
    let next = 1;
    if (data && data.length > 0 && data[0].invoice_number) {
      next = parseInt(data[0].invoice_number, 10) + 1;
    }
    res.json({ next_number: next.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/validate-number', async (req, res) => {
  try {
    const { number } = req.query;
    if (!number || !/^\d+$/.test(number)) {
      return res.status(400).json({ valid: false, error: 'Invoice number must be numeric' });
    }
    const { data: existing, error: existingError } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('invoice_number', number)
      .limit(1);
    if (existingError) throw existingError;
    if (existing && existing.length > 0) {
      return res.json({ valid: false, warning: `Invoice number ${number} is already used.` });
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, buyers(name, gstin), invoice_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, buyers(*), invoice_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Invoice not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const body = Array.isArray(req.body) && req.body.length === 1
    ? req.body[0]
    : req.body;
  console.info('[POST /api/invoices] Request received', {
    bodyFormat: Array.isArray(req.body) ? 'array' : typeof req.body,
    invoiceNumber: body && typeof body === 'object' ? body.invoice_number : undefined,
    itemCount: body && Array.isArray(body.items) ? body.items.length : 0
  });

  try {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Request body must be an invoice object or a single-item array' });
    }

    const { invoice_number, date, seller_id, buyer_id, billing_address_id, shipping_address_id, po_number, state, tax_percentage, subtotal, total_in_words, items = [] } = body;
    if (!invoice_number || !/^\d+$/.test(invoice_number)) {
      return res.status(400).json({ error: 'Invoice number is required and must be numeric' });
    }
    if (!seller_id) return res.status(400).json({ error: 'Seller is required' });
    if (!buyer_id) return res.status(400).json({ error: 'Buyer is required' });
    if (typeof po_number !== 'string' || !po_number.trim()) {
      return res.status(400).json({ error: 'PO Number is required' });
    }
    if (po_number.length > 15) return res.status(400).json({ error: 'PO Number cannot exceed 15 characters' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one order item is required' });
    }
    for (const [index, item] of items.entries()) {
      const itemNumber = index + 1;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return res.status(400).json({ error: `Order item ${itemNumber} must be an object` });
      }
      if (typeof item.item_name !== 'string' || !item.item_name.trim()) {
        return res.status(400).json({ error: `Enter Item Name for item ${itemNumber}` });
      }
      const quantity = Number(item.quantity);
      if (item.quantity === '' || item.quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Enter a valid Quantity greater than 0 for item ${itemNumber}` });
      }
      const pricePerUnit = Number(item.price_per_unit);
      if (item.price_per_unit === '' || item.price_per_unit === null || !/^(?:\d+\.?\d*|\.\d+)$/.test(String(item.price_per_unit)) || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({ error: `Enter a valid Price/Unit greater than 0 for item ${itemNumber}` });
      }
    }

    const calculatedSubtotal = Number(subtotal ?? 0);
    const calculatedTaxPercentage = Number(tax_percentage ?? 0);
    if (!Number.isFinite(calculatedSubtotal) || !Number.isFinite(calculatedTaxPercentage)) {
      return res.status(400).json({ error: 'Subtotal and tax percentage must be valid numbers' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoice_number)
      .limit(1);
    if (existingError) throw existingError;
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: `Invoice number ${invoice_number} is already used.` });
    }

    // Calculate tax based on tax_percentage of subtotal
    const calculatedTax = calculatedSubtotal * calculatedTaxPercentage / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([{ invoice_number, date, seller_id, buyer_id, billing_address_id, shipping_address_id, po_number, state, tax_percentage: calculatedTaxPercentage, subtotal: calculatedSubtotal, tax: calculatedTax, total: calculatedTotal, total_in_words: total_in_words || '' }])
      .select()
      .single();
    if (error) throw error;

    if (items.length > 0) {
      const itemRows = items.map(item => ({
        invoice_id: invoice.id,
        item_name: item.item_name.trim(),
        item_code: item.item_code || '',
        hsn_sac: item.hsn_sac || '',
        quantity: Number(item.quantity),
        unit: item.unit || '',
        price_per_unit: Number(item.price_per_unit),
        amount: Number(item.quantity) * Number(item.price_per_unit)
      }));
      const { error: itemError } = await supabase.from('invoice_items').insert(itemRows);
      if (itemError) throw itemError;
    }

    console.info('[POST /api/invoices] Invoice created', { invoiceId: invoice.id, invoiceNumber: invoice_number });
    res.status(201).json(invoice);
  } catch (err) {
    console.error('[POST /api/invoices] Failed to create invoice', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const {
      invoice_number, date, seller_id, buyer_id, billing_address_id,
      shipping_address_id, po_number, state, tax_percentage, subtotal,
      total_in_words, items = []
    } = req.body || {};
    if (!invoice_number || !/^\d+$/.test(invoice_number)) {
      return res.status(400).json({ error: 'Invoice number is required and must be numeric' });
    }
    if (!seller_id) return res.status(400).json({ error: 'Seller is required' });
    if (!buyer_id) return res.status(400).json({ error: 'Buyer is required' });
    if (typeof po_number !== 'string' || !po_number.trim()) {
      return res.status(400).json({ error: 'PO Number is required' });
    }
    if (po_number.length > 15) return res.status(400).json({ error: 'PO Number cannot exceed 15 characters' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one order item is required' });
    }
    for (const [index, item] of items.entries()) {
      const itemNumber = index + 1;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return res.status(400).json({ error: `Order item ${itemNumber} must be an object` });
      }
      if (typeof item.item_name !== 'string' || !item.item_name.trim()) {
        return res.status(400).json({ error: `Enter Item Name for item ${itemNumber}` });
      }
      const quantity = Number(item.quantity);
      if (item.quantity === '' || item.quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Enter a valid Quantity greater than 0 for item ${itemNumber}` });
      }
      const pricePerUnit = Number(item.price_per_unit);
      if (item.price_per_unit === '' || item.price_per_unit === null
        || !/^(?:\d+\.?\d*|\.\d+)$/.test(String(item.price_per_unit))
        || !Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({ error: `Enter a valid Price/Unit greater than 0 for item ${itemNumber}` });
      }
    }

    const calculatedSubtotal = Number(subtotal ?? 0);
    const calculatedTaxPercentage = Number(tax_percentage ?? 0);
    if (!Number.isFinite(calculatedSubtotal) || !Number.isFinite(calculatedTaxPercentage)) {
      return res.status(400).json({ error: 'Subtotal and tax percentage must be valid numbers' });
    }

    const { data: currentInvoice, error: invoiceLookupError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (invoiceLookupError) throw invoiceLookupError;
    if (!currentInvoice) return res.status(404).json({ error: 'Invoice not found' });

    const { data: duplicate, error: duplicateError } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoice_number)
      .neq('id', req.params.id)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if (duplicate?.length) {
      return res.status(400).json({ error: `Invoice number ${invoice_number} is already used.` });
    }

    const calculatedTax = calculatedSubtotal * calculatedTaxPercentage / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        invoice_number, date, seller_id, buyer_id, billing_address_id,
        shipping_address_id, po_number, state,
        tax_percentage: calculatedTaxPercentage,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        total: calculatedTotal,
        total_in_words: total_in_words || ''
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { data: oldItems, error: oldItemsError } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('invoice_id', req.params.id);
    if (oldItemsError) throw oldItemsError;

    const itemRows = items.map(item => ({
      invoice_id: req.params.id,
      item_name: item.item_name.trim(),
      item_code: item.item_code || '',
      hsn_sac: item.hsn_sac || '',
      quantity: Number(item.quantity),
      unit: item.unit || '',
      price_per_unit: Number(item.price_per_unit),
      amount: Number(item.quantity) * Number(item.price_per_unit)
    }));
    const { error: insertItemsError } = await supabase.from('invoice_items').insert(itemRows);
    if (insertItemsError) throw insertItemsError;

    const oldItemIds = (oldItems || []).map(item => item.id);
    if (oldItemIds.length) {
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .in('id', oldItemIds);
      if (deleteItemsError) throw deleteItemsError;
    }

    console.info('[PUT /api/invoices] Invoice updated', {
      invoiceId: req.params.id,
      invoiceNumber: invoice_number
    });
    res.json(updatedInvoice);
  } catch (err) {
    console.error('[PUT /api/invoices] Failed to update invoice', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id/pdf', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, sellers(*), buyers(*), invoice_items(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Invoice not found' });

    const seller = data.sellers || {};
    const buyer = data.buyers || {};
    const items = data.invoice_items || [];
    const addressIds = [data.billing_address_id, data.shipping_address_id].filter(Boolean);
    let addressesById = {};
    if (addressIds.length > 0) {
      const { data: addresses, error: addressError } = await supabase
        .from('buyer_addresses')
        .select('*')
        .in('id', addressIds);
      if (addressError) throw addressError;
      addressesById = Object.fromEntries((addresses || []).map(address => [address.id, address]));
    }

    const billingAddress = addressesById[data.billing_address_id] || {};
    const shippingAddress = addressesById[data.shipping_address_id] || billingAddress;

    res.setHeader('Content-Type', 'application/pdf');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="invoice-${data.invoice_number}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 38;
    const contentWidth = pageWidth - margin * 2;
    const navy = '#17365D';
    const muted = '#64748B';
    const ink = '#1F2937';
    const light = '#EFF4F8';
    const border = '#D6DEE8';
    const money = value => `INR ${Number(value || 0).toFixed(2)}`;
    const textOrDash = value => value === undefined || value === null || value === '' ? '—' : String(value);
    const splitMultilineAddress = value => String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const hasStructuredAddress = address => Boolean(address.city || address.state || address.pincode);
    const districtLine = address => [
      [address.city, address.pincode].filter(Boolean).join(' - '),
      address.country
    ].filter(Boolean).join(' , ');
    const addressLines = address => [
      ...splitMultilineAddress(address.address_line),
      ...(hasStructuredAddress(address) && districtLine(address) ? [districtLine(address)] : [])
    ];
    const drawSectionTitle = (title, x, y, width) => {
      doc.roundedRect(x, y, width, 22, 4).fill(light);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(navy)
        .text(title.toUpperCase(), x + 8, y + 6, { width: width - 16 });
    };
    const columnWidths = [24, 116, 60, 54, 44, 38, 86, contentWidth - 422];
    const drawTableHeader = y => {
      const headers = ['#', 'Description', 'Item Code', 'HSN/SAC', 'Qty', 'Unit', 'Price', 'Amount'];
      let x = margin;
      doc.roundedRect(margin, y, contentWidth, 27, 4).fill(navy);
      headers.forEach((header, index) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF')
          .text(header, x + 4, y + 9, {
            width: columnWidths[index] - 8,
            align: index >= 4 ? 'right' : 'left'
          });
        x += columnWidths[index];
      });
      return y + 27;
    };

    doc.rect(0, 0, pageWidth, 9).fill(navy);
    doc.font('Helvetica-Bold').fontSize(19).fillColor(navy)
      .text('TAX INVOICE', margin, 28, { width: contentWidth, align: 'center' });

    const sellerNameY = 62;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ink)
      .text(textOrDash(seller.firm_name), margin, sellerNameY, { width: contentWidth });
    const sellerAddress = [
      seller.address,
      seller.city,
      seller.state,
      seller.pincode
    ].filter(Boolean).join(', ');
    const sellerAddressY = sellerNameY + 19;
    const sellerContactWidth = contentWidth * 0.4;
    const sellerAddressWidth = contentWidth - sellerContactWidth - 12;
    doc.font('Helvetica').fontSize(8.5).fillColor(muted)
      .text(sellerAddress || 'Address not provided', margin, sellerAddressY, {
        width: sellerAddressWidth,
        lineGap: 2
      });
    const sellerAddressHeight = doc.heightOfString(sellerAddress || 'Address not provided', {
      width: sellerAddressWidth,
      lineGap: 2
    });
    const sellerContactLines = [
      `Phone: ${textOrDash(seller.phone)}`,
      `E-Mail : ${textOrDash(seller.email)}`
    ];
    let sellerContactY = sellerAddressY;
    let sellerContactHeight = 0;
    sellerContactLines.forEach(line => {
      doc.font('Helvetica').fontSize(8.5).fillColor(muted)
        .text(line, margin + sellerAddressWidth + 12, sellerContactY, {
          width: sellerContactWidth,
          align: 'right',
          lineGap: 0
        });
      const lineHeight = doc.heightOfString(line, {
        width: sellerContactWidth,
        lineGap: 0
      });
      sellerContactY += lineHeight + 2;
      sellerContactHeight += lineHeight + 2;
    });
    const sellerGstinY = sellerAddressY + sellerAddressHeight + 4;
    doc.font('Helvetica').fontSize(8.5).fillColor(muted)
      .text(`Vendor GST No: ${textOrDash(seller.gstin)}`, margin, sellerGstinY, { width: contentWidth });

    const sellerHeaderBottom = Math.max(sellerGstinY + 14, sellerAddressY + sellerContactHeight);
    const invoiceDetailsY = sellerHeaderBottom + 6;
    drawSectionTitle('Invoice Details', margin, invoiceDetailsY, contentWidth);
    const detailsBoxY = invoiceDetailsY + 27;
    const detailsBoxHeight = 49;
    const detailsColumnWidth = contentWidth / 2;
    doc.roundedRect(margin, detailsBoxY, contentWidth, detailsBoxHeight, 5)
      .lineWidth(0.7).strokeColor(border).stroke();
    doc.moveTo(margin + detailsColumnWidth, detailsBoxY + 8)
      .lineTo(margin + detailsColumnWidth, detailsBoxY + detailsBoxHeight - 8)
      .lineWidth(0.6).strokeColor(border).stroke();

    const invoiceDetailRows = [
      ['Invoice Number', data.invoice_number],
      ['Date', data.date]
    ];
    invoiceDetailRows.forEach(([label, value], index) => {
      const y = detailsBoxY + 12 + index * 17;
      doc.font('Helvetica').fontSize(8).fillColor(muted).text(label, margin + 10, y, {
        width: detailsColumnWidth * 0.48
      });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(ink)
        .text(textOrDash(value), margin + detailsColumnWidth * 0.48, y, {
          width: detailsColumnWidth * 0.52 - 10
        });
    });
    doc.font('Helvetica').fontSize(8).fillColor(muted)
      .text('PO Number', margin + detailsColumnWidth + 10, detailsBoxY + 12, {
        width: detailsColumnWidth * 0.48
      });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(ink)
      .text(textOrDash(data.po_number), margin + detailsColumnWidth * 1.48, detailsBoxY + 12, {
        width: detailsColumnWidth * 0.52 - 10
      });

    const partyY = detailsBoxY + detailsBoxHeight + 16;
    const gap = 12;
    const cardWidth = (contentWidth - gap) / 2;
    const billAddressLines = addressLines(billingAddress).slice(0, 4);
    const shipAddressLines = addressLines(shippingAddress).slice(0, 4);
    const billToLines = [
      ...(billAddressLines.length ? billAddressLines.slice(1) : ['Address not provided']),
      `CIN No. : ${textOrDash(buyer.cin_no)}`,
      `TIN No. : ${textOrDash(buyer.tin_no)}`,
      `PAN No. : ${textOrDash(buyer.pan_no)}`,
      `GST Number : ${textOrDash(buyer.gstin)}`
    ].filter(Boolean);
    const shipToLines = [
      ...(shipAddressLines.length ? shipAddressLines.slice(1) : ['Address not provided']),
      (shippingAddress.phone || buyer.phone) ? `Contact Number: ${shippingAddress.phone || buyer.phone}` : ''
    ].filter(Boolean);
    const partyLayout = (heading, lines) => {
      const width = cardWidth - 18;
      const body = lines.filter(Boolean).join('\n') || 'Address not provided';
      doc.font('Helvetica-Bold').fontSize(9.5);
      const headingHeight = doc.heightOfString(textOrDash(heading), { width, lineGap: 0 });
      doc.font('Helvetica').fontSize(8);
      const bodyHeight = doc.heightOfString(body, { width, lineGap: 0 });
      return {
        body,
        headingHeight,
        height: 28 + headingHeight + 3 + bodyHeight + 7
      };
    };
    const billLayout = partyLayout(billAddressLines[0], billToLines);
    const shipLayout = partyLayout(shipAddressLines[0], shipToLines);
    const cardHeight = Math.max(
      billLayout.height,
      shipLayout.height
    );
    const drawPartyCard = (title, x, heading, layout) => {
      doc.roundedRect(x, partyY, cardWidth, cardHeight, 5).lineWidth(0.7).strokeColor(border).stroke();
      drawSectionTitle(title, x + 1, partyY + 1, cardWidth - 2);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ink)
        .text(textOrDash(heading), x + 9, partyY + 28, { width: cardWidth - 18 });
      doc.font('Helvetica').fontSize(8).fillColor(muted)
        .text(layout.body, x + 9, partyY + 31 + layout.headingHeight, {
          width: cardWidth - 18,
          lineGap: 0,
          ellipsis: true
        });
    };
    drawPartyCard('Bill To', margin, billAddressLines[0], billLayout);
    drawPartyCard('Ship To', margin + cardWidth + gap, shipAddressLines[0], shipLayout);

    let tableY = drawTableHeader(partyY + cardHeight + 8);
    items.forEach((item, index) => {
      const cells = [
        String(index + 1),
        textOrDash(item.item_name),
        textOrDash(item.item_code),
        textOrDash(item.hsn_sac),
        textOrDash(item.quantity),
        textOrDash(item.unit),
        money(item.price_per_unit),
        money(item.amount)
      ];
      const rowHeight = Math.max(27, ...cells.map((value, cellIndex) => (
        doc.font('Helvetica').fontSize(7.5)
          .heightOfString(value, { width: columnWidths[cellIndex] - 8 }) + 12
      )));
      if (tableY + rowHeight > pageHeight - 52) {
        doc.addPage();
        tableY = drawTableHeader(margin);
      }

      if (index % 2 === 1) doc.rect(margin, tableY, contentWidth, rowHeight).fill('#F8FAFC');
      let x = margin;
      cells.forEach((value, cellIndex) => {
        doc.font('Helvetica').fontSize(7.5).fillColor(ink)
          .text(value, x + 4, tableY + 7, {
            width: columnWidths[cellIndex] - 8,
            height: rowHeight - 10,
            align: cellIndex >= 4 ? 'right' : 'left',
            ellipsis: true
          });
        x += columnWidths[cellIndex];
      });
      doc.moveTo(margin, tableY + rowHeight).lineTo(margin + contentWidth, tableY + rowHeight)
        .lineWidth(0.4).strokeColor(border).stroke();
      tableY += rowHeight;
    });

    const summaryHeight = data.total_in_words ? 184 : 164;
    if (tableY + summaryHeight > pageHeight - 52) {
      doc.addPage();
      tableY = margin;
    }
    const summaryY = tableY + 17;
    const summaryWidth = 224;
    const summaryX = margin + contentWidth - summaryWidth;
    const summaryRows = [
      ['Subtotal', money(data.subtotal)],
      ['Tax', money(data.tax)],
      ['Total', money(data.total)]
    ];
    summaryRows.forEach(([label, value], index) => {
      const y = summaryY + index * 21;
      if (index === 2) doc.roundedRect(summaryX, y - 5, summaryWidth, 27, 4).fill(light);
      doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(index === 2 ? 10 : 8.5)
        .fillColor(index === 2 ? navy : muted).text(label, summaryX + 8, y, { width: 100 });
      doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(index === 2 ? 10 : 8.5)
        .fillColor(index === 2 ? navy : ink)
        .text(value, summaryX + 108, y, { width: summaryWidth - 116, align: 'right' });
    });

    if (data.total_in_words) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(navy)
        .text('Amount in words', margin, summaryY + 4, { width: contentWidth - summaryWidth - 20 });
      doc.font('Helvetica').fontSize(8).fillColor(ink)
        .text(data.total_in_words, margin, summaryY + 18, {
          width: contentWidth - summaryWidth - 20,
          height: 45,
          ellipsis: true
        });
    }

    const footerY = summaryY + 108;
    doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).lineWidth(0.7).strokeColor(border).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(muted)
      .text('Thank you for your business.', margin, footerY + 10, { width: contentWidth * 0.5 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(ink)
      .text(`For ${seller.firm_name || 'Seller'}`, margin + contentWidth * 0.55, footerY + 8, {
        width: contentWidth * 0.45,
        align: 'right'
      });
    doc.moveTo(margin + contentWidth * 0.68, footerY + 70)
      .lineTo(margin + contentWidth, footerY + 70).lineWidth(0.7).strokeColor(muted).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(muted)
      .text('Authorised Signatory', margin + contentWidth * 0.68, footerY + 74, {
        width: contentWidth * 0.32,
        align: 'center'
      });

    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      doc.font('Helvetica').fontSize(7).fillColor(muted)
        .text(`Page ${pageIndex + 1} of ${pageRange.count}`, margin, pageHeight - 24, {
          width: contentWidth,
          align: 'right'
        });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
