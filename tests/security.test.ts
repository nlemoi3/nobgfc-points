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
