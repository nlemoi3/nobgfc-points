begin;

do $$
declare
  updated_count integer;
begin
  update public.events
  set
    start_date = date '2026-08-19',
    end_date = date '2026-08-22',
    original_start_date = date '2026-08-19',
    original_end_date = date '2026-08-22',
    notes = 'Official event dates: August 19-22, 2026. Tournament fishing begins after the Captains'' Meeting at approximately 9:30 AM on August 20 and continues through August 22.'
  where name = 'New Orleans Invitational Billfish Tournament'
    and scoring_ruleset = 'noibt_2026'
    and start_date >= date '2026-01-01'
    and start_date < date '2027-01-01';

  get diagnostics updated_count = row_count;

  if updated_count <> 1 then
    raise exception
      'Expected to update exactly one 2026 NOIBT event, updated %.',
      updated_count;
  end if;
end
$$;

commit;
