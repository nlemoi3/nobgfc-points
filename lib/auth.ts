import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type AppRole = "member" | "boat" | "weighmaster" | "admin";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});

export const getCurrentUserRole = cache(async (): Promise<AppRole | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

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
