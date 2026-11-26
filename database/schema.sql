-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/ijeafbhiqsnllouehvgh/sql

-- Drop all tables safely if they exist
drop table if exists invoice_items cascade;
drop table if exists invoices cascade;
drop table if exists buyers cascade;
drop table if exists sellers cascade;
drop table if exists buyer_addresses cascade;

-- Sellers / Firm table
create table if not exists sellers (
  id uuid default uuid_generate_v4() primary key,
  firm_name text not null,
  address text,
  city text,
  pincode text,
  phone text,
  gstin text,
  email text,
  state text,
  pan_number text,
  fssai_license_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Buyers table
create table if not exists buyers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  gstin text,
  pan_no text,
  cin_no text,
  tin_no text,
  email text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Buyer addresses (billing & shipping)
create table if not exists buyer_addresses (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references buyers(id) on delete cascade,
  type text check (type in ('billing','shipping')) default 'billing',
  address_line text,
  phone text,
  city text,
  state text,
  pincode text,
  country text default 'India',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null,
  date date,
  seller_id uuid references sellers(id),
  buyer_id uuid references buyers(id),
  billing_address_id uuid references buyer_addresses(id),
  shipping_address_id uuid references buyer_addresses(id),
  po_number text not null,
  place_of_supply text,
  state text,
  tax_percentage numeric default 0,
  subtotal numeric default 0,
  tax numeric default 0,
  total numeric default 0,
  total_in_words text,
  created_at timestamptz default now()
);

-- Invoice line items
create table if not exists invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade,
  item_name text,
  item_code text,
  hsn_sac text,
  quantity numeric default 0,
  unit text,
  price_per_unit numeric default 0,
  amount numeric default 0
);

-- Row Level Security
alter table sellers enable row level security;
alter table buyers enable row level security;
alter table buyer_addresses enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Allow all on sellers" on sellers for all using (true) with check (true);
create policy "Allow all on buyers" on buyers for all using (true) with check (true);
create policy "Allow all on buyer_addresses" on buyer_addresses for all using (true) with check (true);
create policy "Allow all on invoices" on invoices for all using (true) with check (true);
create policy "Allow all on invoice_items" on invoice_items for all using (true) with check (true);

-- Grant table-level privileges
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
