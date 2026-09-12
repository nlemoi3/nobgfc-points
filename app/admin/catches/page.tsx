import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getCatchChecks } from "../../../lib/reconciliation";
import { formatCatchWeight } from "../../../lib/scoring";
import { createClient } from "../../../lib/supabase/server";
import { formatClubDate } from "../../../lib/submission-timing";

type CatchQueueParams = {
  attention?: string;
  created?: string;
  q?: string;
  status?: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function searchableText(catchRecord: any) {
  return [
    catchRecord.id,
    catchRecord.events?.name,
    catchRecord.boats?.name,
    catchRecord.anglers?.first_name,
    catchRecord.anglers?.last_name,
    catchRecord.species?.name,
    catchRecord.eligibility_notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default async function AdminCatchesPage({
  searchParams,
}: {
  searchParams: Promise<CatchQueueParams>;
}) {
  noStore();

  const {
    attention = "all",
    created,
    q = "",
    status = "all",
  } = await searchParams;
  const supabase = await createClient();

  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      line_class,
      points_awarded,
      released,
      tagged,
      status,
      catch_datetime,
      created_at,
      eligibility_notes,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name,status,start_date,end_date)
    `)
    .order("catch_datetime", { ascending: false });

  const rows =
    catches?.map((catchRecord: any) => ({
      ...catchRecord,
      checks: getCatchChecks(catchRecord),
    })) || [];
  const normalizedQuery = q.trim().toLowerCase();
  const filteredRows = rows
    .filter((catchRecord: any) => {
      if (status !== "all" && (catchRecord.status || "approved") !== status) {
        return false;
      }
      if (normalizedQuery && !searchableText(catchRecord).includes(normalizedQuery)) {
        return false;
      }

      if (attention === "needs-review") {
        return catchRecord.status === "pending" || catchRecord.checks.hasException;
      }
      if (attention === "scoring") {
        return !catchRecord.checks.scoreMatches || !catchRecord.checks.eventDateMatches;
      }
      if (attention === "late") {
        return catchRecord.checks.submissionTiming.isLate;
      }
      return true;
    })
    .sort((left: any, right: any) => {
      const leftPending = left.status === "pending" ? 1 : 0;
      const rightPending = right.status === "pending" ? 1 : 0;
      if (leftPending !== rightPending) return rightPending - leftPending;

      const leftException = left.checks.hasException ? 1 : 0;
      const rightException = right.checks.hasException ? 1 : 0;
      if (leftException !== rightException) return rightException - leftException;

      return new Date(right.catch_datetime).getTime() - new Date(left.catch_datetime).getTime();
    });

  const pendingCount = rows.filter((row: any) => row.status === "pending").length;
  const exceptionCount = rows.filter((row: any) => row.checks.hasException).length;

  return (
    <main className="panel">
      <div className="toolbar">
        <div>
          <p className="eyebrow">Operational review queue</p>
          <h1>Manage Catches</h1>
        </div>
        <Link href="/admin/catch-entry" className="btn">
          + Add Catch
        </Link>
      </div>

      {created === "1" ? (
        <p className="alert">Catch saved as pending and ready for review.</p>
      ) : null}

      {error ? <p className="alert alert-danger">Error: {error.message}</p> : null}

      <div className="review-summary" aria-label="Catch queue summary">
        <div><strong>{rows.length}</strong><span>Total catches</span></div>
        <div><strong>{pendingCount}</strong><span>Pending review</span></div>
        <div><strong>{exceptionCount}</strong><span>Checks needing attention</span></div>
        <div><strong>{filteredRows.length}</strong><span>Showing now</span></div>
      </div>

      <form className="review-filters" method="get" role="search">
        <label className="review-search-field">
          Search
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Catch #, boat, angler, species, event…"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Attention
          <select name="attention" defaultValue={attention}>
            <option value="all">All catches</option>
            <option value="needs-review">Needs review</option>
            <option value="scoring">Scoring or event date</option>
            <option value="late">Late tag/release warning</option>
          </select>
        </label>
        <div className="review-filter-actions">
          <button className="btn" type="submit">Apply Filters</button>
          <Link className="btn btn-ghost" href="/admin/catches">Clear</Link>
        </div>
      </form>

      <p className="helper-text">
        Pending catches and exceptions appear first. Late tag/release submissions are warnings for manual review; they are not automatically rejected.
      </p>

      <div
        className="table-wrap mobile-card-wrap"
        role="region"
        aria-label="Catch review queue"
        tabIndex={0}
      >
        <table className="admin-table mobile-card-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Event</th>
              <th>Boat</th>
              <th>Angler</th>
              <th>Species</th>
              <th>Weight</th>
              <th>Released</th>
              <th>Tagged</th>
              <th>Status</th>
              <th>Submission Timing</th>
              <th>Review Notes</th>
              <th>Points</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((catchRecord: any) => {
              const { checks } = catchRecord;
              const timing = checks.submissionTiming;
              const rowClass =
                !checks.scoreMatches || !checks.eventDateMatches
                  ? "row-danger"
                  : catchRecord.status === "pending" || timing.isLate
                    ? "row-warning"
                    : undefined;

              return (
                <tr key={catchRecord.id} className={rowClass}>
                  <td data-label="Date/Time">
                    <Link href={`/admin/catches/${catchRecord.id}`}>
                      {formatDateTime(catchRecord.catch_datetime)}
                    </Link>
                  </td>
                  <td data-label="Event">
                    {catchRecord.events?.id ? (
                      <Link href={`/tournaments/${catchRecord.events.id}`}>
                        {catchRecord.events.name}
                      </Link>
                    ) : "No event"}
                  </td>
                  <td data-label="Boat">
                    {catchRecord.boats?.id ? (
                      <Link href={`/boats/${catchRecord.boats.id}`}>
                        {catchRecord.boats.name}
                      </Link>
                    ) : "No boat"}
                  </td>
                  <td data-label="Angler">
                    {catchRecord.anglers?.id ? (
                      <Link href={`/anglers/${catchRecord.anglers.id}`}>
                        {catchRecord.anglers.first_name} {catchRecord.anglers.last_name}
                      </Link>
                    ) : "No angler"}
                  </td>
                  <td data-label="Species">{catchRecord.species?.name || "-"}</td>
                  <td data-label="Weight">{formatCatchWeight(catchRecord)}</td>
                  <td data-label="Released">{catchRecord.released ? "Yes" : "No"}</td>
                  <td data-label="Tagged">{catchRecord.tagged ? "Yes" : "No"}</td>
                  <td data-label="Status">
                    <span className={`status-chip status-${catchRecord.status || "approved"}`}>
                      {catchRecord.status || "approved"}
                    </span>
                  </td>
                  <td data-label="Submission Timing">
                    {!timing.applies
                      ? "Not applicable"
                      : timing.isLate
                        ? <strong className="text-warning">Review: {timing.daysLate} day{timing.daysLate === 1 ? "" : "s"} late</strong>
                        : <>On time · due {formatClubDate(timing.deadlineDate)}</>}
                  </td>
                  <td data-label="Review Notes">{catchRecord.eligibility_notes || "-"}</td>
                  <td data-label="Points">
                    {catchRecord.points_awarded}
                    {!checks.scoreMatches ? ` (expected ${checks.expectedPoints})` : ""}
                  </td>
                  <td data-label="Action">
                    <Link href={`/admin/catches/${catchRecord.id}`}>Review Catch</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 && !error ? (
        <div className="empty-state">
          <h2>No catches match these filters</h2>
          <p>Clear the filters or try a broader search.</p>
        </div>
      ) : null}
    </main>
  );
}
