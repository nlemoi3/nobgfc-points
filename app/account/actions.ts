"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

export async function updateAccount(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phoneNumber = String(formData.get("phone_number") || "").trim() || null;
  const dateOfBirth = String(formData.get("date_of_birth") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;

  if (!email || !email.includes("@")) {
    redirect("/account?error=Please enter a valid email address");
  }

  const supabase = await createClient();
  const { data: angler, error: anglerError } = await supabase
    .from("anglers")
    .update({
      email,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
      address,
    })
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (anglerError) {
    redirect(`/account?error=${encodeURIComponent(anglerError.message)}`);
  }

  const emailChanged = (user.email || "").toLowerCase() !== email;
  if (emailChanged) {
    const { error: updateEmailError } = await supabase.auth.updateUser({ email });

    if (updateEmailError) {
      redirect(`/account?error=${encodeURIComponent(updateEmailError.message)}`);
    }

    if (!angler) {
      redirect(
        "/account?warning=No linked angler profile was found. Email update requested; check your inbox to confirm your new address.",
      );
    }

    redirect(
      "/account?success=Profile updated. Check your inbox to confirm your new email address.",
    );
  }

  if (!angler) {
    redirect(
      "/account?warning=No linked angler profile was found. Only your sign-in email can be updated here.",
    );
  }

  redirect("/account?success=Account details updated successfully.");
}

export async function updateAccountPassword(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 8) {
    redirect("/account?error=Password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    redirect("/account?error=Passwords do not match");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?success=Password updated successfully.");
}
