import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { key, url } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}
