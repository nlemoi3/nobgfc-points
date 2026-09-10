import assert from "node:assert/strict";
import test from "node:test";

import { getAuthErrorMessage } from "../lib/auth-error-message.ts";

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
