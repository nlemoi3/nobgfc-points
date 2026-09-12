begin;

create table if not exists public.catch_audit_log (
  id bigint generated always as identity primary key,
  catch_id bigint not null,
  action text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  changed_fields text[] not null default '{}',
  old_record jsonb,
  new_record jsonb,
  occurred_at timestamptz not null default now(),
  constraint catch_audit_log_action_allowed
    check (action in ('baseline', 'submitted', 'edited', 'approved', 'rejected', 'recalculated', 'deleted'))
);

comment on table public.catch_audit_log is
  'Append-only administrative history for catch submissions and changes.';
comment on column public.catch_audit_log.catch_id is
  'Intentionally not a foreign key so deletion history remains available.';

create index if not exists catch_audit_log_catch_id_occurred_at_idx
  on public.catch_audit_log (catch_id, occurred_at desc);
create index if not exists catch_audit_log_occurred_at_idx
  on public.catch_audit_log (occurred_at desc);
create index if not exists catch_audit_log_actor_user_id_idx
  on public.catch_audit_log (actor_user_id)
  where actor_user_id is not null;

alter table public.catch_audit_log enable row level security;

revoke all on table public.catch_audit_log from anon, authenticated;
grant select on table public.catch_audit_log to authenticated;

drop policy if exists "Competition officials can view catch history"
  on public.catch_audit_log;
create policy "Competition officials can view catch history"
on public.catch_audit_log
for select
to authenticated
using ((select public.has_app_role('weighmaster')));

create or replace function public.record_catch_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
  audit_catch_id bigint;
  audit_changed_fields text[] := '{}';
  audit_actor_role text;
begin
  audit_catch_id := case when tg_op = 'DELETE' then old.id else new.id end;

  if tg_op = 'INSERT' then
    audit_action := 'submitted';
    select coalesce(array_agg(key order by key), '{}')
      into audit_changed_fields
    from jsonb_object_keys(to_jsonb(new)) as key;
  elsif tg_op = 'DELETE' then
    audit_action := 'deleted';
    select coalesce(array_agg(key order by key), '{}')
      into audit_changed_fields
    from jsonb_object_keys(to_jsonb(old)) as key;
  else
    select coalesce(array_agg(key order by key), '{}')
      into audit_changed_fields
    from (
      select key from jsonb_object_keys(to_jsonb(old)) as key
      union
      select key from jsonb_object_keys(to_jsonb(new)) as key
    ) as keys
    where to_jsonb(old) -> key is distinct from to_jsonb(new) -> key;

    if new.status is distinct from old.status and new.status = 'approved' then
      audit_action := 'approved';
    elsif new.status is distinct from old.status and new.status = 'rejected' then
      audit_action := 'rejected';
    elsif audit_changed_fields = array['points_awarded']::text[] then
      audit_action := 'recalculated';
    else
      audit_action := 'edited';
    end if;
  end if;

  select role into audit_actor_role
  from public.user_roles
  where user_id = auth.uid();

  insert into public.catch_audit_log (
    catch_id,
    action,
    actor_user_id,
    actor_email,
    actor_role,
    changed_fields,
    old_record,
    new_record
  )
  values (
    audit_catch_id,
    audit_action,
    auth.uid(),
    auth.jwt() ->> 'email',
    audit_actor_role,
    audit_changed_fields,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.record_catch_audit() from public;

drop trigger if exists record_catch_audit on public.catches;
create trigger record_catch_audit
after insert or update or delete on public.catches
for each row execute function public.record_catch_audit();

insert into public.catch_audit_log (
  catch_id,
  action,
  actor_role,
  changed_fields,
  new_record,
  occurred_at
)
select
  catch_record.id,
  'baseline',
  'system',
  array(select key from jsonb_object_keys(to_jsonb(catch_record)) as key order by key),
  to_jsonb(catch_record),
  now()
from public.catches as catch_record
where not exists (
  select 1
  from public.catch_audit_log as existing
  where existing.catch_id = catch_record.id
);

commit;
