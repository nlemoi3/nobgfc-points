import { getCurrentUserRole } from "../../../../lib/auth";
import { createCsv, createCsvResponse } from "../../../../lib/csv";
import { canRunCompetitionOperations } from "../../../../lib/role-access";
import { getActiveSeasonRange } from "../../../../lib/season";
import { createClient } from "../../../../lib/supabase/server";
import {
  formatClubDate,
  getSubmissionTiming,
} from "../../../../lib/submission-timing";

export async function GET() {
  const role = await getCurrentUserRole();
  if (!canRunCompetitionOperations(role)) {
    return new Response("Competition official access required.", { status: 403 });
  }

  const supabase = await createClient();
  const { year, start, end } = await getActiveSeasonRange(supabase);
  const { data, error } = await supabase
    .from("catches")
    .select(`
      id,catch_datetime,created_at,weight,line_class,released,tagged,status,
      points_awarded,eligibility_notes,
      events(id,name,end_date),boats(id,name),
      anglers(id,first_name,last_name),species(id,name)
    `)
    .eq("status", "approved")
    .gte("catch_datetime", start)
    .lt("catch_datetime", end)
    .order("catch_datetime");

  if (error) return new Response(error.message, { status: 500 });

  const rows = (data || []).map((catchRecord: any) => {
    const timing = getSubmissionTiming({
      released: Boolean(catchRecord.released),
      tagged: Boolean(catchRecord.tagged),
      submittedAt: catchRecord.created_at,
      eventEndDate: catchRecord.events?.end_date || null,
    });

    return [
      catchRecord.id,
      catchRecord.catch_datetime,
      catchRecord.created_at,
      catchRecord.events?.name,
      catchRecord.boats?.name,
      `${catchRecord.anglers?.first_name || ""} ${catchRecord.anglers?.last_name || ""}`.trim(),
      catchRecord.species?.name,
      catchRecord.weight,
      catchRecord.line_class,
      catchRecord.released ? "Yes" : "No",
      catchRecord.tagged ? "Yes" : "No",
      catchRecord.points_awarded,
      timing.applies ? formatClubDate(timing.deadlineDate) : "Not applicable",
      timing.isLate ? `Late by ${timing.daysLate} day${timing.daysLate === 1 ? "" : "s"}` : "No",
      catchRecord.eligibility_notes,
    ];
  });

  const csv = createCsv(
    [
      "Catch ID",
      "Catch Date/Time",
      "Submitted At",
      "Event",
      "Boat",
      "Angler",
      "Species",
      "Weight",
      "Line Class",
      "Released",
      "Tagged",
      "Stored Points",
      "Tag/Release Submission Deadline",
      "Late Submission Warning",
      "Review Notes",
    ],
    rows,
  );

  return createCsvResponse(csv, `nobgfc-${year}-approved-catches.csv`);
}
