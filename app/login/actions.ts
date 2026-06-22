"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "");
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(safeNextPath)}`,
    );
  }

  if (safeNextPath) {
    redirect(safeNextPath);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: roleRow } = user
    ? await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  redirect(
    roleRow?.role === "admin"
      ? "/admin"
      : roleRow?.role === "weighmaster"
        ? "/admin/catch-entry"
        : "/dashboard",
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dashboard");
}
