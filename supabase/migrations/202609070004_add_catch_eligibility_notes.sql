alter table public.catches
add column if not exists eligibility_notes text;

comment on column public.catches.eligibility_notes is
'Administrative explanation when a catch is excluded from points or requires eligibility review.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'catches_rejection_reason_required'
      and conrelid = 'public.catches'::regclass
  ) then
    alter table public.catches
      add constraint catches_rejection_reason_required
      check (
        status <> 'rejected'
        or nullif(btrim(eligibility_notes), '') is not null
      ) not valid;
  end if;
end
$$;

alter table public.catches
validate constraint catches_rejection_reason_required;
