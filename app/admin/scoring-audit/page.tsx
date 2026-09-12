import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { formatCatchWeight } from "../../../lib/scoring";
import { getCatchChecks } from "../../../lib/reconciliation";
import { formatClubDate } from "../../../lib/submission-timing";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ScoringAuditPage() {
  noStore();

  const supabase = await createClient();
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      line_class,
      released,
      tagged,
      status,
      eligibility_notes,
      points_awarded,
      catch_datetime,
      created_at,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name,status,start_date,end_date)
    `)
    .order("catch_datetime", { ascending: false });

  const rows =
    catches?.map((c: any) => {
      const checks = getCatchChecks(c);

      return {
        ...c,
        expected: checks.expectedPoints,
        stored: checks.storedPoints,
        difference: checks.difference,
        matches: checks.scoreMatches,
        eventDateMatches: checks.eventDateMatches,
        submissionTiming: checks.submissionTiming,
      };
    }) || [];

  const mismatches = rows.filter((r: any) => !r.matches);
  const eventDateMismatches = rows.filter((r: any) => !r.eventDateMatches);
  const lateSubmissions = rows.filter((r: any) => r.submissionTiming.isLate);

  return (
    <main className="panel">
      <h1>Scoring Audit</h1>

      <p>
        This page recalculates every catch and compares expected points against
        stored points.
      </p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Total Catches</strong>
          <br />
          {rows.length}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Mismatches</strong>
          <br />
          {mismatches.length}
        </div>
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Event-Date Mismatches</strong>
          <br />
          {eventDateMismatches.length}
        </div>
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Late Tag/Release Warnings</strong>
          <br />
          {lateSubmissions.length}
        </div>
      </div>

      <div className="portal-actions">
        <a className="btn btn-ghost" href="/admin/exports/exceptions" download>
          Download Exceptions CSV
        </a>
      </div>

      <div
        className="table-wrap mobile-card-wrap"
        role="region"
        aria-label="Scoring audit results"
        tabIndex={0}
      >
        <table className="admin-table mobile-card-table">
          <thead>
            <tr>
            <th>Score Check</th>
            <th>Event-Date Check</th>
            <th>Submission Timing</th>
            <th>Catch Status</th>
            <th>Review Notes</th>
            <th>Date</th>
            <th>Event</th>
            <th>Event Status</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Line</th>
            <th>Released</th>
            <th>Tagged</th>
            <th>Stored</th>
            <th>Expected</th>
            <th>Difference</th>
            <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c: any) => (
              <tr
              key={c.id}
              className={
                !c.matches || !c.eventDateMatches
                  ? "row-danger"
                  : c.submissionTiming.isLate
                    ? "row-warning"
                    : undefined
              }
            >
              <td data-label="Score Check">{c.matches ? "OK" : "CHECK"}</td>
              <td data-label="Event-Date Check">{c.eventDateMatches ? "OK" : "CHECK"}</td>
              <td data-label="Submission Timing">
                {!c.submissionTiming.applies
                  ? "Not applicable"
                  : c.submissionTiming.isLate
                    ? `REVIEW — ${c.submissionTiming.daysLate} day${c.submissionTiming.daysLate === 1 ? "" : "s"} late`
                    : `On time — due ${formatClubDate(c.submissionTiming.deadlineDate)}`}
              </td>
              <td data-label="Catch Status">{c.status || "-"}</td>
              <td data-label="Review Notes">{c.eligibility_notes || "-"}</td>
              <td data-label="Date">
                <Link href={`/admin/catches/${c.id}`}>
                  {formatDateTime(c.catch_datetime)}
                </Link>
              </td>
              <td data-label="Event">
                {c.events?.id ? (
                  <Link href={`/tournaments/${c.events.id}`}>
                    {c.events?.name}
                  </Link>
                ) : (
                  c.events?.name
                )}
              </td>
              <td data-label="Event Status">{c.events?.status || "-"}</td>
              <td data-label="Boat">
                {c.boats?.id ? (
                  <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                ) : (
                  c.boats?.name
                )}
              </td>
              <td data-label="Angler">
                {c.anglers?.id ? (
                  <Link href={`/anglers/${c.anglers.id}`}>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </Link>
                ) : (
                  <>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </>
                )}
              </td>
              <td data-label="Species">
                <Link href={`/catches/${c.id}`}>{c.species?.name}</Link>
              </td>
              <td data-label="Weight">{formatCatchWeight(c)}</td>
              <td data-label="Line">{c.line_class || "-"}</td>
              <td data-label="Released">{c.released ? "Yes" : "No"}</td>
              <td data-label="Tagged">{c.tagged ? "Yes" : "No"}</td>
              <td data-label="Stored">{c.stored.toFixed(1)}</td>
              <td data-label="Expected">{c.expected.toFixed(1)}</td>
              <td data-label="Difference">{c.difference.toFixed(1)}</td>
              <td data-label="Action">
                <Link href={`/admin/catches/${c.id}`}>Review Catch</Link>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
