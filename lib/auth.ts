import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type AppRole = "member" | "boat" | "weighmaster" | "admin";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log("[auth] getCurrentUser: no user", error ? { message: error.message } : undefined);
      return null;
    }

    // Log presence of a user id (no secrets)
    console.log("[auth] getCurrentUser: user present", { id: data.user.id });
    return data.user;
  } catch (e) {
    console.error("[auth] getCurrentUser error", e);
    return null;
  }
});

export const getCurrentUserRole = cache(async (): Promise<AppRole | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  // Log the resolved role for the current user (no secrets)
  console.log("[auth] getCurrentUserRole", { userId: user.id, role: data?.role, error: error ? { message: error.message, status: error.status } : null });

  return ["member", "boat", "weighmaster", "admin"].includes(data?.role)
    ? data.role
    : null;
});

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
