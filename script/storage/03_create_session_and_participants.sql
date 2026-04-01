-- Create a session and participants
-- Usage (psql):
--   psql "$DATABASE_URL" \
--     -v session_id='sess-custom-001' \
--     -v join_code='VACA-NEW1' \
--     -v admin_id='user-custom-001' \
--     -v total_amount='180000' \
--     -v currency='COP' \
--     -v split_mode='equal' \
--     -v description='Lunch team' \
--     -v status='open' \
--     -v participant_ids='user-custom-001,user-dev-002,user-dev-003' \
--     -v participant_names='New User,Carlos Romero,Maria Perez' \
--     -v participant_amounts='60000,60000,60000' \
--     -f script/storage/03_create_session_and_participants.sql

insert into public.sessions (
  id,
  join_code,
  admin_id,
  total_amount,
  currency,
  split_mode,
  description,
  status,
  created_at
)
values (
  :'session_id',
  :'join_code',
  :'admin_id',
  :'total_amount'::numeric,
  :'currency',
  :'split_mode',
  :'description',
  :'status',
  now()
)
on conflict (id) do update
set
  join_code = excluded.join_code,
  admin_id = excluded.admin_id,
  total_amount = excluded.total_amount,
  currency = excluded.currency,
  split_mode = excluded.split_mode,
  description = excluded.description,
  status = excluded.status;

with data as (
  select
    trim(user_id) as user_id,
    trim(display_name) as display_name,
    trim(amount) as amount,
    row_number() over () as idx
  from unnest(
    string_to_array(:'participant_ids', ','),
    string_to_array(:'participant_names', ','),
    string_to_array(:'participant_amounts', ',')
  ) as t(user_id, display_name, amount)
)
insert into public.participants (
  join_code,
  user_id,
  display_name,
  amount,
  status,
  joined_at
)
select
  :'join_code',
  d.user_id,
  d.display_name,
  d.amount::numeric,
  'pending',
  now()
from data d
on conflict (join_code, user_id) do update
set
  display_name = excluded.display_name,
  amount = excluded.amount;
