import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminEventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Manage Events</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Notes</th>
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
              <td>{event.status || "scheduled"}</td>
              <td>{event.notes || "-"}</td>
              <td>
                <Link href={`/admin/events/${event.id}`}>
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
