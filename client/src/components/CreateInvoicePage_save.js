async function saveInvoice(e) {
    e.preventDefault();
    if (!invoice.invoice_number || !/^\\d+$/.test(invoice.invoice_number)) { addToast('Invoice number must be numeric', 'error'); return; }
    if (!invoice.seller_id) { addToast('Seller is required', 'error'); return; }
    if (!invoice.buyer_id) { addToast('Buyer is required', 'error'); return; }
    if (!invoice.po_number) { addToast('PO Number is required', 'error'); return; }
    if (numberWarning) { addToast(numberWarning, 'error'); return; }

    // Send all data (invoice + items) in one request
    const payload = {
      invoice_number: invoice.invoice_number,
      date: invoice.date,
      seller_id: invoice.seller_id,
      buyer_id: invoice.buyer_id,
      billing_address_id: invoice.billing_address_id,
      shipping_address_id: invoice.shipping_address_id,
      po_number: invoice.po_number,
      place_of_supply: invoice.place_of_supply,
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
    
    const { error } = await supabase.from('invoices').insert([payload]);
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Invoice saved successfully', 'success');
    navigate('/invoices');
  }
