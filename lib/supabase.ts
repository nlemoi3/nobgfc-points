import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase/config";

const { key, url } = getSupabaseConfig();

export const supabase = createClient(url, key);
