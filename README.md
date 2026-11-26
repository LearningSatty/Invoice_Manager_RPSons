# Invoice_Manager_RPSons

A full-stack Tax Invoice Bill generator built with **React (frontend)** and **Node.js/Express (backend)**, using **Supabase** as the database and **pdfkit** for PDF download.

## Features

- **Sellers / Firm management**
  - Create/manage seller firm with: Firm Name, Address, City, Pincode, Phone, GSTIN, Email, State, PAN Number, FSSAI License No.
  - Seller details are used dynamically in the invoice PDF header (replaces hardcoded values)
- **Trade Information section**
  - Create/manage buyers with Billing address & Shipping address
  - Buyer fields: GSTIN, PAN No, CIN No, TIN No, email, phone
  - Select billing & shipping address while creating a bill
  - Invoice date + Invoice No. (auto-generated, numeric; editable with validation)
  - PO Number (required)
- **Order Details section**
  - Add items: quantity, item name, item code, HSN/SAC, unit, price/unit
  - Auto-calculates amount, sub-total, tax (18%), total
- **Invoice number validation**
  - Numeric only
  - Warns if the invoice number is lower than the highest existing number; only duplicate numbers are blocked
- **PDF download / print** for each saved invoice
- Sample invoice layout matches the provided reference (SHUBHAM TRADERS)

## Project Structure

```
InvoiceManager/
├── server/                 # Node.js + Express backend
│   ├── index.js            # API routes + PDF generation
│   ├── package.json
│   └── .env.example
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   ├── lib/supabase.js
│   │   ├── components/     # Navbar, HomePage, BuyersPage, SellersPage, CreateInvoicePage, InvoicesPage
│   │   └── ...
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql          # Supabase SQL schema
└── README.md
```

## Prerequisites

- Node.js (v18+) and npm
- A Supabase project: `https://ijeafbhiqsnllouehvgh.supabase.co`

## Setup

### 1. Database (Supabase)

1. Go to your Supabase project SQL Editor:
   https://app.supabase.com/project/ijeafbhiqsnllouehvgh/sql
2. Paste and run the contents of `database/schema.sql`.
3. Obtain your **anon public key** and **service role key** from:
   Settings → API (https://app.supabase.com/project/ijeafbhiqsnllouehvgh/settings/api)

For an existing database, do not rerun `database/schema.sql`; it drops and recreates the tables. Apply any required update from `database/migrations/` in the Supabase SQL Editor instead. The buyer address phone fields require `20261126_add_buyer_address_phone.sql`.

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env and add your SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
npm install
npm start        # runs on http://localhost:5002
# or for dev:
npm run dev
```

`.env` contents:
```
SUPABASE_URL=https://ijeafbhiqsnllouehvgh.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5002
CLIENT_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd client
cp .env.example .env
# Edit .env and add your VITE_SUPABASE_ANON_KEY
npm install
npm run dev      # runs on http://localhost:5173
```

`.env` contents:
```
VITE_SUPABASE_URL=https://ijeafbhiqsnllouehvgh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Use the app

- Open http://localhost:5173
- **Sellers / Firm**: create your seller firm (Firm Name, GSTIN, PAN, FSSAI, Address, etc.)
- **Buyers**: create buyers with GSTIN/PAN/CIN/TIN and billing/shipping addresses
- **Create Invoice**: select seller firm, buyer, addresses, date, PO number; add order items; save
- **Invoices**: view saved invoices and **Download PDF**

## API Endpoints (backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/sellers` | List sellers |
| GET | `/api/sellers/:id` | Get seller detail |
| POST | `/api/sellers` | Create seller firm |
| PUT | `/api/sellers/:id` | Update seller firm |
| DELETE | `/api/sellers/:id` | Delete seller firm |
| GET | `/api/buyers` | List buyers |
| GET | `/api/buyers/:id` | Get buyer + addresses |
| POST | `/api/buyers` | Create buyer |
| PUT | `/api/buyers/:id` | Update buyer |
| DELETE | `/api/buyers/:id` | Delete buyer |
| POST | `/api/buyers/:id/addresses` | Add buyer address |
| GET | `/api/invoices/next-number` | Next auto invoice number |
| GET | `/api/invoices/validate-number?number=123` | Validate invoice number |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice detail |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| GET | `/api/invoices/:id/pdf` | Download invoice PDF |

## Notes

- Invoice numbers are **numeric only**. Existing invoice numbers cannot be reused; lower unused numbers display a client-side warning but can be saved.
- Tax is calculated at 18% automatically.
- PDF generation uses `pdfkit` and matches the sample layout (Tax Invoice, seller header, Bill To / Invoice Details / PO No, Ship To, item table, totals, authorised signature).
