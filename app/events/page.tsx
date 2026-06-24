import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function EventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date");

  return (
    <main className="panel">
      <h1>2026 Events</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <ul>
        {events?.map((event) => (
          <li key={event.id}>
            <strong>
              <Link href={`/tournaments/${event.id}`}>{event.name}</Link>
            </strong>{" "}
            — {event.start_date} to {event.end_date}
          </li>
        ))}
      </ul>
    </main>
  );
}
