begin;

create index if not exists angler_awards_angler_id_idx
  on public.angler_awards (angler_id);
create index if not exists boat_awards_boat_id_idx
  on public.boat_awards (boat_id);
create index if not exists boat_owners_angler_id_idx
  on public.boat_owners (angler_id);
create index if not exists event_rosters_event_id_idx
  on public.event_rosters (event_id);
create index if not exists event_rosters_boat_id_idx
  on public.event_rosters (boat_id);
create index if not exists event_rosters_angler_id_idx
  on public.event_rosters (angler_id);

commit;
