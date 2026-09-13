import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getSafeAuthRedirect } from "../lib/auth-redirect.ts";
import { getConfiguredSiteUrl } from "../lib/site-url.ts";

const securityMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260912235959_security_permissions_hardening.sql",
    import.meta.url,
  ),
  "utf8",
);
const boatRequestMigration = readFileSync(
  new URL(
    "../supabase/migrations/202609130001_atomic_boat_profile_application.sql",
    import.meta.url,
  ),
  "utf8",
);
const noibtMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260913160254_add_noibt_ruleset_and_registrations.sql",
    import.meta.url,
  ),
  "utf8",
);
const noibtPolicyMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260913163600_optimize_noibt_registration_policies.sql",
    import.meta.url,
  ),
  "utf8",
);
const boatRequestPage = readFileSync(
  new URL("../app/admin/boat-profile-requests/[id]/page.tsx", import.meta.url),
  "utf8",
);
const confirmationRoute = readFileSync(
  new URL("../app/auth/confirm/route.ts", import.meta.url),
  "utf8",
);
const invitationAction = readFileSync(
  new URL("../app/admin/invites/actions.ts", import.meta.url),
  "utf8",
);

test("login destinations reject protocol-relative and external redirects", () => {
  assert.equal(getSafeAuthRedirect("/admin/catches", ""), "/admin/catches");
  assert.equal(getSafeAuthRedirect("//attacker.example", ""), "");
  assert.equal(getSafeAuthRedirect("https://attacker.example", ""), "");
});

test("authentication links use a configured canonical origin", () => {
  assert.equal(
    getConfiguredSiteUrl("https://example.com/path?ignored=1"),
    "https://example.com",
  );
  assert.equal(
    getConfiguredSiteUrl("javascript:alert(1)"),
    "https://nobgfc-points.vercel.app",
  );
  assert.equal(
    getConfiguredSiteUrl("not a url"),
    "https://nobgfc-points.vercel.app",
  );
});

test("anonymous request submissions cannot choose workflow status", () => {
  const requestGrant =
    securityMigration.match(
      /grant insert \([\s\S]*?\) on table public\.boat_profile_requests/,
    )?.[0] || "";

  assert.match(requestGrant, /contact_email/);
  assert.doesNotMatch(requestGrant, /\bstatus\b/);
  assert.match(securityMigration, /with check \(status = 'new'\)/);
});

test("weighmaster catch submissions are forced into pending review", () => {
  assert.match(
    securityMigration,
    /create policy "Weighmasters can create pending catches"[\s\S]*?and status = 'pending'/,
  );
});

test("public schema objects default to no anonymous table privileges", () => {
  assert.match(
    securityMigration,
    /alter default privileges for role postgres in schema public\s+revoke all on tables from anon, authenticated/,
  );
  assert.match(
    securityMigration,
    /revoke all on all sequences in schema public from anon, authenticated/,
  );
});

test("boat profile application updates the boat and request atomically", () => {
  assert.match(boatRequestMigration, /^begin;/);
  assert.match(boatRequestMigration, /for update;/);
  assert.match(boatRequestMigration, /set status = 'applied'/);
  assert.match(boatRequestMigration, /request_record\.status not in \('new', 'reviewed'\)/);
  assert.match(boatRequestMigration, /commit;/);
  assert.match(boatRequestPage, /admin_apply_boat_profile_request/);
  assert.doesNotMatch(boatRequestPage, /admin_upsert_boat/);
});

test("atomic boat profile application remains admin-only", () => {
  assert.match(boatRequestMigration, /private\.has_app_role\('admin'\)/);
  assert.match(
    boatRequestMigration,
    /revoke all on function public\.admin_apply_boat_profile_request[\s\S]*?from public, anon/,
  );
  assert.match(
    boatRequestMigration,
    /grant execute on function public\.admin_apply_boat_profile_request[\s\S]*?to authenticated/,
  );
});

test("email confirmation and invitation links choose usable destinations", () => {
  assert.match(confirmationRoute, /passwordSetupTypes = new Set\(\["invite", "recovery"\]\)/);
  assert.match(confirmationRoute, /\? "\/reset-password"\s*:\s*"\/dashboard"/);
  assert.match(invitationAction, /redirectTo: `\$\{siteUrl\}\/reset-password`/);
});

test("NOIBT registration tables are private and protected by RLS", () => {
  assert.match(
    noibtMigration,
    /alter table public\.tournament_registrations enable row level security/,
  );
  assert.match(
    noibtMigration,
    /alter table public\.tournament_registration_participants enable row level security/,
  );
  assert.match(
    noibtMigration,
    /revoke all on table[\s\S]*?tournament_registrations[\s\S]*?from public, anon, authenticated/,
  );
  assert.match(
    noibtMigration,
    /create policy "Admins can manage tournament registrations"[\s\S]*?has_app_role\('admin'\)/,
  );
});

test("NOIBT registration policies avoid duplicate SELECT evaluation", () => {
  assert.match(
    noibtPolicyMigration,
    /create index if not exists tournament_registrations_boat_id_idx/,
  );
  assert.match(
    noibtPolicyMigration,
    /drop policy if exists "Admins can manage tournament registrations"/,
  );
  assert.match(
    noibtPolicyMigration,
    /create policy "Admins can create tournament registrations"[\s\S]*?for insert/,
  );
  assert.doesNotMatch(noibtPolicyMigration, /for all/);
});

test("NOIBT approval requires the registered event, boat, and angler combination", () => {
  assert.match(
    noibtMigration,
    /selected_event\.scoring_ruleset = 'noibt_2026'[\s\S]*?registration\.event_id = new\.event_id[\s\S]*?registration\.boat_id = new\.boat_id[\s\S]*?participant\.angler_id = new\.angler_id/,
  );
});

test("event rulesets cannot change after catches or registrations exist", () => {
  assert.match(
    noibtMigration,
    /create trigger protect_event_scoring_ruleset[\s\S]*?before update of scoring_ruleset on public\.events/,
  );
  assert.match(
    noibtMigration,
    /exists \(select 1 from public\.catches where event_id = old\.id\)[\s\S]*?public\.tournament_registrations where event_id = old\.id/,
  );
});

test("event/date discrepancies are not automatically disqualified in the database", () => {
  const workflowFunction =
    noibtMigration.match(
      /create or replace function public\.enforce_catch_event_workflow\(\)[\s\S]*?revoke all on function/,
    )?.[0] || "";

  assert.doesNotMatch(workflowFunction, /Catch date must fall within/);
  assert.doesNotMatch(workflowFunction, /not selected_event\.is_tournament/);
  assert.match(workflowFunction, /selected_event\.status = 'locked'/);
  assert.match(workflowFunction, /selected_event\.status = 'cancelled'/);
});
