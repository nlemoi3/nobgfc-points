import Link from "next/link";
import { supabase } from "../../lib/supabase";

function formatDate(value: string | null) {
  if (!value) return "Date to be announced";

  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate) return "Date to be announced";
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export default async function EventsPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id,name,start_date,end_date,status,notes")
    .order("start_date");

  const eventsByYear = new Map<string, typeof events>();

  (events || []).forEach((event) => {
    const year = event.start_date?.slice(0, 4) || "Dates To Be Announced";
    const yearEvents = eventsByYear.get(year) || [];
    yearEvents.push(event);
    eventsByYear.set(year, yearEvents);
  });

  return (
    <main className="panel">
      <div className="toolbar">
        <div>
          <h1>Club Event Schedule</h1>
          <p>Tournament dates, schedule changes, and event status.</p>
        </div>
        <Link href="/tournament-standings" className="btn btn-ghost">
          Tournament Standings
        </Link>
      </div>

      {error && <p className="alert alert-danger">Error: {error.message}</p>}

      {!error && eventsByYear.size === 0 && (
        <p>No events have been scheduled yet.</p>
      )}

      {Array.from(eventsByYear.entries()).map(([year, yearEvents]) => (
        <section key={year} style={{ marginBottom: "32px" }}>
          <h2>{year}</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Schedule Notes</th>
                </tr>
              </thead>
              <tbody>
                {yearEvents?.map((event) => {
                  const status = event.status || "scheduled";

                  return (
                    <tr key={event.id}>
                      <td>{formatDateRange(event.start_date, event.end_date)}</td>
                      <td>
                        <Link href={`/tournaments/${event.id}`}>
                          {event.name}
                        </Link>
                      </td>
                      <td>
                        <span className={`status-chip status-${status}`}>
                          {status}
                        </span>
                      </td>
                      <td>{event.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
