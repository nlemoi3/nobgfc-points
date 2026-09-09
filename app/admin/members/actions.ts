"use server";

import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

export async function setMemberRole(formData: FormData) {
  await requireRole("admin");

  const userId = String(formData.get("user_id") || "").trim();
  const role = String(formData.get("role") || "member").trim();

  if (!userId) {
    redirect("/admin/members?error=Missing user ID");
  }

  if (!["member", "boat", "weighmaster", "admin"].includes(role)) {
    redirect("/admin/members?error=Invalid role selected");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    redirect(`/admin/members?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/members?sent=1");
}
