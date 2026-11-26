alter table public.invoices
  add column if not exists tax_percentage numeric default 0;

notify pgrst, 'reload schema';
