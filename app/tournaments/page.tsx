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

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Tournament Archive</h1>

      <p>
        Browse current and historical NOBGFC tournaments.
      </p>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Tournament</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Results</th>
          </tr>
        </thead>

        <tbody>
          {events?.map((event: any) => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>{formatDate(event.start_date)}</td>
              <td>{formatDate(event.end_date)}</td>
              <td>{event.status || "scheduled"}</td>
              <td>
                <Link href={`/tournaments/${event.id}`}>
                  View Tournament
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}