"use server";

import { redirect } from "next/navigation";
import { getAuthErrorMessage } from "../../lib/auth-error-message";
import { getConfiguredSiteUrl } from "../../lib/site-url";
import { createClient } from "../../lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=Email is required");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getConfiguredSiteUrl()}/reset-password`,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(getAuthErrorMessage(error, "password-reset"))}`,
    );
  }

  redirect("/forgot-password?sent=1");
}
