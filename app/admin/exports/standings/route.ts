import { getCurrentUserRole } from "../../../../lib/auth";
import { createCsv, createCsvResponse } from "../../../../lib/csv";
import { buildBoatStandings } from "../../../../lib/reconciliation";
import { canRunCompetitionOperations } from "../../../../lib/role-access";
import { getActiveSeasonRange } from "../../../../lib/season";
import { createClient } from "../../../../lib/supabase/server";

export async function GET() {
  const role = await getCurrentUserRole();
  if (!canRunCompetitionOperations(role)) {
    return new Response("Competition official access required.", { status: 403 });
  }

  const supabase = await createClient();
  const { year, start, end } = await getActiveSeasonRange(supabase);
  const { data, error } = await supabase
    .from("catches")
    .select("id,boat_id,weight,line_class,released,tagged,points_awarded,boats(id,name),species(name)")
    .eq("status", "approved")
    .gte("catch_datetime", start)
    .lt("catch_datetime", end);

  if (error) return new Response(error.message, { status: 500 });

  const rows = buildBoatStandings(data || []).map((standing) => [
    standing.rank,
    standing.boatId,
    standing.boatName,
    standing.officialPoints.toFixed(1),
    standing.countingCatches,
    standing.approvedCatches,
  ]);
  const csv = createCsv(
    [
      "Rank",
      "Boat ID",
      "Boat",
      "Official Points",
      "Counting Catches",
      "Approved Catches",
    ],
    rows,
  );

  return createCsvResponse(csv, `nobgfc-${year}-official-boat-standings.csv`);
}
