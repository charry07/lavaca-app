-- RPC: get users who most frequently share sessions with a given user.
-- Usage: select * from public.get_frequent_users('user-123', 7);

create or replace function public.get_frequent_users(
  p_user_id text,
  p_limit integer default 7
)
returns table (
  id text,
  display_name text,
  username text,
  phone text,
  avatar_url text,
  created_at timestamptz,
  shared_count bigint,
  last_shared_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with my_sessions as (
    select distinct p.join_code
    from public.participants p
    where p.user_id = p_user_id
  ),
  co_participants as (
    select
      p.user_id,
      count(*)::bigint as shared_count,
      max(p.joined_at) as last_shared_at
    from public.participants p
    join my_sessions ms on ms.join_code = p.join_code
    where p.user_id is not null
      and p.user_id <> p_user_id
    group by p.user_id
  )
  select
    u.id,
    u.display_name,
    u.username,
    u.phone,
    u.avatar_url,
    u.created_at,
    cp.shared_count,
    cp.last_shared_at
  from co_participants cp
  join public.users u on u.id = cp.user_id
  order by cp.shared_count desc, cp.last_shared_at desc
  limit greatest(1, least(coalesce(p_limit, 7), 50));
$$;

grant execute on function public.get_frequent_users(text, integer) to anon, authenticated;
