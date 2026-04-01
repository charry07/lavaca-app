-- Create a user record in public.users
-- Usage (psql):
--   psql "$DATABASE_URL" \
--     -v user_id='user-custom-001' \
--     -v phone='+573001111111' \
--     -v display_name='New User' \
--     -v username='new.user' \
--     -v document_id='1000000001' \
--     -v email='new.user@example.com' \
--     -f script/storage/01_create_user.sql

insert into public.users (
  id,
  phone,
  display_name,
  username,
  document_id,
  email,
  created_at
)
values (
  :'user_id',
  :'phone',
  :'display_name',
  :'username',
  :'document_id',
  :'email',
  now()
)
on conflict (id) do update
set
  phone = excluded.phone,
  display_name = excluded.display_name,
  username = excluded.username,
  document_id = excluded.document_id,
  email = excluded.email;
