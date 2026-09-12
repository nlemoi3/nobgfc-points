"use server";

import { redirect } from "next/navigation";
import { getConfiguredSiteUrl } from "../../lib/site-url";
import { createClient } from "../../lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!email) {
    redirect("/signup?error=Email is required");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=Passwords do not match");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getConfiguredSiteUrl()}/login`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?sent=1");
}
