import "server-only";
import { createClient } from "./supabase/server";

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string | null;
};

export async function getAdminUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_auth_users");

  return {
    users: (data || []) as AdminUserRow[],
    error,
  };
}
