import assert from "node:assert/strict";
import test from "node:test";

import { parseAuthCallback } from "../lib/auth-callback.ts";
import {
  getAuthErrorMessage,
  getAuthLinkErrorMessage,
} from "../lib/auth-error-message.ts";
import { getSafeAuthRedirect } from "../lib/auth-redirect.ts";

test("authentication callbacks accept only local redirect paths", () => {
  assert.equal(getSafeAuthRedirect("/reset-password"), "/reset-password");
  assert.equal(
    getSafeAuthRedirect("/dashboard?welcome=1"),
    "/dashboard?welcome=1",
  );
  assert.equal(getSafeAuthRedirect("https://attacker.example"), "/dashboard");
  assert.equal(getSafeAuthRedirect("//attacker.example"), "/dashboard");
  assert.equal(getSafeAuthRedirect(null, "/reset-password"), "/reset-password");
});

test("password recovery callbacks accept PKCE authorization codes", () => {
  assert.deepEqual(parseAuthCallback("", "?code=recovery-code"), {
    kind: "pkce",
    code: "recovery-code",
    tokenType: null,
  });
});

test("password recovery callbacks accept implicit session tokens", () => {
  assert.deepEqual(
    parseAuthCallback(
      "#access_token=access&refresh_token=refresh&type=recovery",
      "",
    ),
    {
      kind: "tokens",
      accessToken: "access",
      refreshToken: "refresh",
      tokenType: "recovery",
    },
  );
});

test("email rate limits receive a useful retry message", () => {
  assert.equal(
    getAuthErrorMessage(
      { code: "over_email_send_rate_limit", message: "email rate limit exceeded" },
      "password-reset",
    ),
    "Too many authentication emails were sent recently. Wait about an hour before trying again.",
  );
});

test("existing invitees are directed to account recovery", () => {
  assert.equal(
    getAuthErrorMessage(
      { message: "A user with this email address has already been registered" },
      "invite",
    ),
    "This email already has an account. Assign its role under Manage Members, or have the user choose Forgot password on the sign-in page.",
  );
});

test("unexpected auth errors remain visible", () => {
  assert.equal(
    getAuthErrorMessage({ message: "Unexpected provider error" }, "invite"),
    "Unexpected provider error",
  );
});

test("cross-browser PKCE failures receive recovery instructions", () => {
  assert.equal(
    getAuthLinkErrorMessage({
      message: "PKCE code verifier not found in storage",
    }),
    "This link was opened in a different browser than the one used to request it. Return to Forgot password in this browser and request one new link.",
  );
});

test("expired links tell users to use one new email", () => {
  assert.equal(
    getAuthLinkErrorMessage({ message: "Email link is invalid or has expired" }),
    "This authentication link is invalid or has expired. Request one new link and use the newest email.",
  );
});
