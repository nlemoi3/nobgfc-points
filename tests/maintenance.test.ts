import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dateMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260914150000_correct_2026_noibt_dates.sql",
    import.meta.url,
  ),
  "utf8",
);
const performanceMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260914151000_optimize_rls_and_foreign_keys.sql",
    import.meta.url,
  ),
  "utf8",
);

test("2026 NOIBT official dates and fishing window are recorded", () => {
  assert.match(dateMigration, /start_date = date '2026-08-19'/);
  assert.match(dateMigration, /end_date = date '2026-08-22'/);
  assert.match(dateMigration, /original_start_date = date '2026-08-19'/);
  assert.match(dateMigration, /original_end_date = date '2026-08-22'/);
  assert.match(dateMigration, /9:30 AM on August 20/);
  assert.match(dateMigration, /updated_count <> 1/);
});

test("all six justified foreign keys receive covering indexes", () => {
  for (const indexName of [
    "angler_awards_angler_id_idx",
    "boat_awards_boat_id_idx",
    "boat_owners_angler_id_idx",
    "event_rosters_event_id_idx",
    "event_rosters_boat_id_idx",
    "event_rosters_angler_id_idx",
  ]) {
    assert.match(performanceMigration, new RegExp(`create index if not exists ${indexName}`));
  }
});

test("maintenance does not remove unused indexes", () => {
  assert.doesNotMatch(performanceMigration, /drop\s+index/i);
});

test("catch policy consolidation preserves public and official access", () => {
  assert.match(
    performanceMigration,
    /create policy "Published catches or officials can read"[\s\S]*?to anon, authenticated[\s\S]*?status = 'approved'[\s\S]*?has_app_role\('weighmaster'\)/,
  );
  assert.match(
    performanceMigration,
    /create policy "Authorized catch submission"[\s\S]*?has_app_role\('admin'\)[\s\S]*?has_app_role\('weighmaster'\)[\s\S]*?status = 'pending'/,
  );
});

test("request and role policy consolidation preserves administrator access", () => {
  assert.match(
    performanceMigration,
    /create policy "Authorized boat profile request submission"[\s\S]*?status = 'new'[\s\S]*?has_app_role\('admin'\)/,
  );
  assert.match(
    performanceMigration,
    /create policy "Authorized role read"[\s\S]*?auth\.uid\(\)[\s\S]*?user_id[\s\S]*?has_app_role\('admin'\)/,
  );
});
