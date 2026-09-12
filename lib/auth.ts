import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isRoleAuthorized, type AppRole } from "./role-access";

export type { AppRole } from "./role-access";

export async function getCurrentUser() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log("[auth] getCurrentUser: no user", error ? { message: error.message } : undefined);
      return null;
    }

    console.log("[auth] getCurrentUser: user present", { id: data.user.id });
    return data.user;
  } catch (e) {
    console.error("[auth] getCurrentUser error", e);
    return null;
  }
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const user = authData.user;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  return ["member", "boat", "weighmaster", "admin"].includes(data.role)
    ? data.role
    : null;
}

export async function getCurrentUserAngler() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const user = authData.user;
  const { data, error } = await supabase.rpc("claim_angler_profile");

  if (error || !data) {
    return null;
  }

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingRole) {
    await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "member" });
  }

  return data;
}

export async function linkCurrentUserToAngler(anglerId: number) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase.rpc("claim_angler_profile");

  if (error || !data || Number(data.id) !== anglerId) {
    return null;
  }

  return data;
}

export async function requireRole(requiredRole: AppRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?next=${requiredRole === "admin" ? "/admin" : "/admin/catch-entry"}`,
    );
  }

  const role = await getCurrentUserRole();
  const authorized = isRoleAuthorized(role, requiredRole);

  if (!authorized) {
    redirect("/unauthorized");
  }

  return { role, user };
}
