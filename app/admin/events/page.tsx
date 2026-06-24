import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminEventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date");

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
      <h1>Manage Tournament Scheduling</h1>

      <p className="hint">
        Update dates, set cancelled/rescheduled statuses, and publish scheduling notes.
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
              <th>Scheduling Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {events?.map((event: any) => (
              <tr key={event.id}>
                <td>
                  <Link href={`/tournaments/${event.id}`}>{event.name}</Link>
                </td>
                <td>{event.start_date}</td>
                <td>{event.end_date}</td>
                <td>
                  <span className={statusClass(event.status)}>
                    {event.status || "scheduled"}
                  </span>
                </td>
                <td>{event.notes || "-"}</td>
                <td>
                  <Link href={`/admin/events/${event.id}`}>
                    Edit Schedule
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
