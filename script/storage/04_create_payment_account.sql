-- Create a payment account for a user
-- Usage (psql):
--   psql "$DATABASE_URL" \
--     -v user_id='user-custom-001' \
--     -v method_type='nequi' \
--     -v account_holder_name='New User' \
--     -v bank_name='Nequi' \
--     -v account_number='3001111111' \
--     -v account_type='ahorros' \
--     -v llave='3001111111' \
--     -v phone='+573001111111' \
--     -v document_id='1000000001' \
--     -v notes='Main account' \
--     -v is_preferred='true' \
--     -f script/storage/04_create_payment_account.sql

insert into public.payment_accounts (
  user_id,
  method_type,
  account_holder_name,
  bank_name,
  account_number,
  account_type,
  llave,
  phone,
  document_id,
  notes,
  is_preferred,
  is_active,
  created_at,
  updated_at
)
values (
  :'user_id',
  :'method_type',
  :'account_holder_name',
  nullif(:'bank_name', ''),
  nullif(:'account_number', ''),
  nullif(:'account_type', ''),
  nullif(:'llave', ''),
  nullif(:'phone', ''),
  nullif(:'document_id', ''),
  nullif(:'notes', ''),
  :'is_preferred'::boolean,
  true,
  now(),
  now()
);
