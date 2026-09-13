import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirect } from "../../../lib/auth-redirect";
import { createClient } from "../../../lib/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "invite",
  "magiclink",
  "recovery",
  "signup",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedType = requestUrl.searchParams.get("type");
  const passwordSetupTypes = new Set(["invite", "recovery"]);
  const defaultDestination = passwordSetupTypes.has(requestedType || "")
    ? "/reset-password"
    : "/dashboard";
  const next = getSafeAuthRedirect(
    requestUrl.searchParams.get("next"),
    defaultDestination,
  );

  if (
    tokenHash &&
    requestedType &&
    EMAIL_OTP_TYPES.has(requestedType as EmailOtpType)
  ) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const errorUrl = new URL("/login", requestUrl.origin);
  errorUrl.searchParams.set(
    "error",
    "This authentication link is invalid or has expired. Request a new link and try again.",
  );
  return NextResponse.redirect(errorUrl);
}
