begin;

alter table public.catches
  add column if not exists entry_token uuid;

create unique index if not exists catches_entry_token_unique_idx
  on public.catches (entry_token);

comment on column public.catches.entry_token is
  'Client-generated idempotency token that prevents duplicate catch rows when a submission is retried.';

commit;

