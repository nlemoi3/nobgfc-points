"use server";

import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";

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

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  if (error) {
    redirect(`/admin/members?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/members?sent=1");
}