import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { formatCatchWeight } from "../../../lib/scoring";
import {
  formatClubDate,
  getSubmissionTiming,
} from "../../../lib/submission-timing";

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

export default async function AdminCatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  noStore();

  const { created } = await searchParams;
  const supabase = await createClient();

  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
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
      events(id,name,end_date)
    `)
    .order("id", { ascending: false });

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Catches</h1>
        <Link href="/admin/catch-entry" className="btn">
          + Add Catch
        </Link>
      </div>

      {created === "1" && (
        <p className="alert">Catch saved as pending and ready for review.</p>
      )}

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div
        className="table-wrap"
        role="region"
        aria-label="Catch review queue"
        tabIndex={0}
      >
        <table className="admin-table">
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
            {catches?.map((c: any) => {
              const timing = getSubmissionTiming({
                released: Boolean(c.released),
                tagged: Boolean(c.tagged),
                submittedAt: c.created_at,
                eventEndDate: c.events?.end_date || null,
              });

              return (
                <tr
                  key={c.id}
                  className={timing.isLate ? "row-warning" : undefined}
                >
              <td>
                <Link href={`/admin/catches/${c.id}`}>
                  {formatDateTime(c.catch_datetime)}
                </Link>
              </td>
              <td>
                {c.events?.id ? (
                  <Link href={`/tournaments/${c.events.id}`}>
                    {c.events?.name}
                  </Link>
                ) : (
                  c.events?.name
                )}
              </td>
              <td>
                {c.boats?.id ? (
                  <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                ) : (
                  c.boats?.name
                )}
              </td>
              <td>
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
              <td>
                {c.species?.name}
              </td>
              <td>{formatCatchWeight(c)}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>

            <td
              style={{
                fontWeight: "bold",
                color:
                  c.status === "approved"
                    ? "green"
                   : c.status === "pending"
                    ? "orange"
                    : "red",
              }}
            >
              {c.status || "approved"}
            </td>

            <td>
              {!timing.applies ? (
                "Not applicable"
              ) : timing.isLate ? (
                <strong className="text-warning">
                  Review: {timing.daysLate} day{timing.daysLate === 1 ? "" : "s"} late
                </strong>
              ) : (
                <>On time · due {formatClubDate(timing.deadlineDate)}</>
              )}
            </td>

            <td>{c.eligibility_notes || "-"}</td>

            <td>{c.points_awarded}</td>
              <td>
                <Link href={`/admin/catches/${c.id}`}>Edit / Delete</Link>
              </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
