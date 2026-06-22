import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type AppRole = "member" | "boat" | "weighmaster" | "admin";

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
    console.log(
      "[auth] getCurrentUserRole: no auth user",
      authError ? { message: authError.message } : undefined,
    );
    return null;
  }

  const user = authData.user;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("[auth] getCurrentUserRole", {
    userId: user.id,
    role: data?.role,
    error: error ? { message: error.message } : null,
  });

  return ["member", "boat", "weighmaster", "admin"].includes(data?.role)
    ? data.role
    : null;
}

export async function requireRole(requiredRole: AppRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?next=${requiredRole === "admin" ? "/admin" : "/admin/catch-entry"}`,
    );
  }

  const role = await getCurrentUserRole();
  const authorized =
    role === "admin" ||
    role === requiredRole ||
    (requiredRole === "weighmaster" && role === "weighmaster");

  if (!authorized) {
    redirect("/unauthorized");
  }

  return { role, user };
}
