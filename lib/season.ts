import { getClubSeasonRange } from "./club-time";

type SupabaseQueryClient = {
  from: (table: string) => any;
};

export async function getActiveSeasonRange(client: SupabaseQueryClient) {
  const fallbackYear = new Date().getUTCFullYear();
  const { data } = await client
    .from("seasons")
    .select("year")
    .eq("active", true)
    .maybeSingle();

  const year = Number(data?.year || fallbackYear);

  return { year, ...getClubSeasonRange(year) };
}
