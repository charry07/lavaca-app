-- Review project data before app review/demo
-- Usage:
--   psql "$DATABASE_URL" -f script/storage/90_review_project_data.sql

-- 1) Core row counts
select 'users' as table_name, count(*) as total from public.users
union all
select 'groups', count(*) from public.groups
union all
select 'group_members', count(*) from public.group_members
union all
select 'sessions', count(*) from public.sessions
union all
select 'participants', count(*) from public.participants
union all
select 'payment_accounts', count(*) from public.payment_accounts
union all
select 'notifications', count(*) from public.notifications;

-- 2) Sessions with participant count and total assigned amount
select
  s.join_code,
  s.description,
  s.status,
  s.total_amount,
  count(p.user_id) as participant_count,
  coalesce(sum(p.amount), 0) as assigned_amount,
  s.created_at
from public.sessions s
left join public.participants p on p.join_code = s.join_code
group by s.join_code, s.description, s.status, s.total_amount, s.created_at
order by s.created_at desc;

-- 3) Users with groups and sessions footprint
select
  u.id,
  u.display_name,
  u.username,
  count(distinct gm.group_id) as groups_count,
  count(distinct p.join_code) as sessions_count,
  count(distinct pa.id) as payment_accounts_count
from public.users u
left join public.group_members gm on gm.user_id = u.id
left join public.participants p on p.user_id = u.id
left join public.payment_accounts pa on pa.user_id = u.id and pa.is_active = true
group by u.id, u.display_name, u.username
order by sessions_count desc, groups_count desc, u.display_name;

-- 4) Data quality checks: orphan risks and invalid amounts
select
  p.join_code,
  p.user_id,
  p.amount,
  p.status
from public.participants p
left join public.users u on u.id = p.user_id
left join public.sessions s on s.join_code = p.join_code
where u.id is null
   or s.join_code is null
   or p.amount < 0;

-- 5) Duplicate join code check
select join_code, count(*) as qty
from public.sessions
group by join_code
having count(*) > 1;
