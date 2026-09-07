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

  return {
    year,
    start: `${year}-01-01T00:00:00.000Z`,
    end: `${year + 1}-01-01T00:00:00.000Z`,
  };
}
