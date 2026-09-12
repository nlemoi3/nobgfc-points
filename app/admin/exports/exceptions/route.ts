import { getCurrentUserRole } from "../../../../lib/auth";
import { createCsv, createCsvResponse } from "../../../../lib/csv";
import { getCatchChecks } from "../../../../lib/reconciliation";
import { canRunCompetitionOperations } from "../../../../lib/role-access";
import { getActiveSeasonRange } from "../../../../lib/season";
import { createClient } from "../../../../lib/supabase/server";
import { formatClubDate } from "../../../../lib/submission-timing";

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
      events(id,name,status,start_date,end_date),boats(id,name),
      anglers(id,first_name,last_name),species(id,name)
    `)
    .gte("catch_datetime", start)
    .lt("catch_datetime", end)
    .order("catch_datetime");

  if (error) return new Response(error.message, { status: 500 });

  const rows = (data || []).flatMap((catchRecord: any) => {
    const checks = getCatchChecks(catchRecord);
    if (!checks.hasException) return [];

    const issues = [
      !checks.scoreMatches ? "Stored score mismatch" : null,
      !checks.eventDateMatches ? "Catch date outside event" : null,
      checks.submissionTiming.isLate
        ? `Tag/release submission ${checks.submissionTiming.daysLate} day${checks.submissionTiming.daysLate === 1 ? "" : "s"} late`
        : null,
    ].filter(Boolean);

    return [[
      catchRecord.id,
      issues.join("; "),
      catchRecord.status,
      catchRecord.catch_datetime,
      catchRecord.created_at,
      catchRecord.events?.name,
      catchRecord.boats?.name,
      `${catchRecord.anglers?.first_name || ""} ${catchRecord.anglers?.last_name || ""}`.trim(),
      catchRecord.species?.name,
      checks.storedPoints.toFixed(1),
      checks.expectedPoints.toFixed(1),
      checks.difference.toFixed(1),
      checks.eventDateMatches ? "Yes" : "No",
      checks.submissionTiming.applies
        ? formatClubDate(checks.submissionTiming.deadlineDate)
        : "Not applicable",
      checks.submissionTiming.isLate ? "Yes" : "No",
      catchRecord.eligibility_notes,
    ]];
  });
  const csv = createCsv(
    [
      "Catch ID",
      "Issues",
      "Status",
      "Catch Date/Time",
      "Submitted At",
      "Event",
      "Boat",
      "Angler",
      "Species",
      "Stored Points",
      "Expected Points",
      "Difference",
      "Catch Date Inside Event",
      "Tag/Release Submission Deadline",
      "Late Submission Warning",
      "Review Notes",
    ],
    rows,
  );

  return createCsvResponse(csv, `nobgfc-${year}-scoring-exceptions.csv`);
}
