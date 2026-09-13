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
