import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TournamentsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  const statusClass = (status: string | null) => {
    switch ((status || "scheduled").toLowerCase()) {
      case "cancelled":
        return "status-chip status-cancelled";
      case "rescheduled":
        return "status-chip status-rescheduled";
      case "locked":
        return "status-chip status-locked";
      case "completed":
        return "status-chip status-completed";
      default:
        return "status-chip status-scheduled";
    }
  };

  return (
    <main className="panel">
      <h1>Tournament Archive</h1>

      <p>
        Browse current and historical NOBGFC tournaments.
      </p>

      {error && (
        <p className="alert alert-danger">
          Error: {error.message}
        </p>
      )}

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tournament</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Schedule Notice</th>
              <th>Results</th>
            </tr>
          </thead>

          <tbody>
            {events?.map((event: any) => (
              <tr key={event.id}>
                <td>
                  <Link href={`/tournaments/${event.id}`}>{event.name}</Link>
                </td>
                <td>{formatDate(event.start_date)}</td>
                <td>{formatDate(event.end_date)}</td>
                <td>
                  <span className={statusClass(event.status)}>
                    {event.status || "scheduled"}
                  </span>
                </td>
                <td>{event.notes || "-"}</td>
                <td>
                  <Link href={`/tournaments/${event.id}`}>
                    View Tournament
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
