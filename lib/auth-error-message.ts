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
