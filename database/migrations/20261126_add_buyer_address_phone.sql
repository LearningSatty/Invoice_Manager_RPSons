alter table public.buyer_addresses
  add column if not exists phone text;

update public.buyer_addresses as address
set phone = buyer.phone
from public.buyers as buyer
where address.buyer_id = buyer.id
  and address.type = 'shipping'
  and nullif(address.phone, '') is null
  and nullif(buyer.phone, '') is not null;

notify pgrst, 'reload schema';
