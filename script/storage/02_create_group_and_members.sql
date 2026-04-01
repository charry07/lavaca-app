-- Create a group and add members in public.group_members
-- Usage (psql):
--   psql "$DATABASE_URL" \
--     -v group_id='group-custom-001' \
--     -v group_name='Friends Group' \
--     -v group_icon='FS' \
--     -v created_by='user-custom-001' \
--     -v member_ids='user-custom-001,user-dev-002,user-dev-003' \
--     -f script/storage/02_create_group_and_members.sql

insert into public.groups (
  id,
  name,
  icon,
  created_by,
  created_at
)
values (
  :'group_id',
  :'group_name',
  :'group_icon',
  :'created_by',
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  icon = excluded.icon,
  created_by = excluded.created_by;

insert into public.group_members (
  group_id,
  user_id,
  created_at
)
select
  :'group_id',
  trim(member_id),
  now()
from unnest(string_to_array(:'member_ids', ',')) as member_id
on conflict (group_id, user_id) do nothing;
