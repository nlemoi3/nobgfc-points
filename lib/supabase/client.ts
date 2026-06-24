import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { key, url } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
