"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function confirmSignup(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const token = String(formData.get("token") || "");

  // Validate password match
  if (password !== confirmPassword) {
    redirect(`/signup?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Passwords do not match")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Password must be at least 8 characters")}`);
  }

  const supabase = await createClient();

  // Verify the token and exchange it for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);

  if (exchangeError) {
    redirect(`/signup?error=${encodeURIComponent("Invalid or expired link. Please request a new invite.")}`);
  }

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?error=${encodeURIComponent("Session not established. Please try again.")}`);
  }

  // Update the user's password
  const { error: updateError } = await supabase.auth.updateUser({
    password: password,
  });

  if (updateError) {
    redirect(`/signup?error=${encodeURIComponent(updateError.message)}`);
  }

  // Get user's role for redirect
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Redirect based on role
  redirect(
    roleRow?.role === "admin"
      ? "/admin"
      : roleRow?.role === "weighmaster"
        ? "/admin/catch-entry"
        : "/dashboard",
  );
}
