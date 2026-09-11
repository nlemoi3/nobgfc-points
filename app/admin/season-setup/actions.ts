"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

export async function createSeasonWorkspace(formData: FormData) {
  await requireRole("admin");

  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    redirect("/admin/season-setup?error=invalid-year");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_season", {
    p_year: year,
  });

  if (error) {
    redirect("/admin/season-setup?error=create-failed");
  }

  revalidatePath("/admin/season-setup");
  redirect("/admin/season-setup?created=1");
}
