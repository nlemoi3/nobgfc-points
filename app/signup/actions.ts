"use server";

import { redirect } from "next/navigation";
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nobgfc-points.vercel.app"}/login`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?sent=1");
}"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function confirmSignup(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  // Validate password match
  if (password !== confirmPassword) {
    redirect(`/signup?error=${encodeURIComponent("Passwords do not match")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters")}`);
  }

  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?error=${encodeURIComponent("Session not established from invite link. Please open the invite again.")}`);
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
