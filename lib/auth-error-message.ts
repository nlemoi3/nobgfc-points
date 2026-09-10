type AuthErrorLike = {
  code?: string;
  message?: string;
};

export function getAuthErrorMessage(
  error: AuthErrorLike,
  flow: "invite" | "password-reset",
) {
  const code = error.code?.toLowerCase() || "";
  const message = error.message?.trim() || "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (
    code === "over_email_send_rate_limit" ||
    normalized.includes("email rate limit")
  ) {
    return "Too many authentication emails were sent recently. Wait about an hour before trying again.";
  }

  if (
    flow === "invite" &&
    (code === "email_exists" || normalized.includes("already been registered"))
  ) {
    return "This email already has an account. Assign its role under Manage Members, or have the user choose Forgot password on the sign-in page.";
  }

  return message || "The authentication request could not be completed. Please try again.";
}

export function getAuthLinkErrorMessage(error: AuthErrorLike) {
  const code = error.code?.toLowerCase() || "";
  const message = error.message?.trim() || "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (
    normalized.includes("pkce") ||
    normalized.includes("code verifier") ||
    normalized.includes("flow state")
  ) {
    return "This link was opened in a different browser than the one used to request it. Return to Forgot password in this browser and request one new link.";
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp")
  ) {
    return "This authentication link is invalid or has expired. Request one new link and use the newest email.";
  }

  return "We could not verify this authentication link. Request one new link and use the newest email.";
}
