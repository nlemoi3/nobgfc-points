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
  // Try finding angler by linked user_id first
  const { data, error } = await supabase
    .from("anglers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (data) {
    return data;
  }

  // If no angler linked by user_id, attempt to match by email and link it
  if (user.email) {
    const { data: byEmail, error: emailError } = await supabase
      .from("anglers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (emailError || !byEmail) {
      return null;
    }

    // Try to associate the angler record with this authenticated user
    const { data: updated, error: updateError } = await supabase
      .from("anglers")
      .update({ user_id: user.id })
      .eq("id", byEmail.id)
      .select()
      .maybeSingle();

    if (!updateError && updated) {
      // Assign member role only if the user has no existing role
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

      return updated;
    }

    // If update failed due to RLS or other reasons, still return the matched angler
    return byEmail;
  }

  return null;
}

export async function linkCurrentUserToAngler(anglerId: number) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const user = authData.user;
  const { data, error } = await supabase
    .from("anglers")
    .update({ user_id: user.id })
    .eq("id", anglerId)
    .select()
    .maybeSingle();

  if (error || !data) {
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
  const authorized =
    role === "admin" ||
    role === requiredRole ||
    (requiredRole === "weighmaster" && role === "weighmaster");

  if (!authorized) {
    redirect("/unauthorized");
  }

  return { role, user };
}
