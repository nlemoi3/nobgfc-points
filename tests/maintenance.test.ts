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
const indexMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260914151000_add_missing_foreign_key_indexes.sql",
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
    assert.match(indexMigration, new RegExp(`create index if not exists ${indexName}`));
  }
});

test("maintenance does not remove unused indexes", () => {
  assert.doesNotMatch(indexMigration, /drop\s+index/i);
});
