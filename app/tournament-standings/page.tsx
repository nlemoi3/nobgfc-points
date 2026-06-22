import Link from "next/link";
import { supabase } from "../../lib/supabase";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TournamentStandingsPage() {
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    status,
    events(id,name,start_date,end_date,status),
    boats(id,name)
  `)
  .eq("status", "approved");

  const eventStandings: Record<
    string,
    Record<string, { id?: number; points: number }>
  > = {};
  const eventInfo: Record<string, any> = {};

  catches?.forEach((c: any) => {
    const event = c.events;
    const eventId = event?.id;
    const boatName = c.boats?.name || "Unknown Boat";
    const points = Number(c.points_awarded || 0);

    if (!eventId) return;

    eventInfo[eventId] = event;

    if (!eventStandings[eventId]) {
      eventStandings[eventId] = {};
    }

    if (!eventStandings[eventId][boatName]) {
      eventStandings[eventId][boatName] = {
        id: c.boats?.id,
        points: 0,
      };
    }
    eventStandings[eventId][boatName].points += points;
  });

  const eventEntries = Object.entries(eventStandings);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Tournament Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {eventEntries.length === 0 && <p>No tournament catches entered yet.</p>}

      {eventEntries.map(([eventId, boatScores]) => {
        const event = eventInfo[eventId];
        const standings = Object.entries(boatScores).sort(
          (a, b) => b[1].points - a[1].points,
        );

        return (
          <section key={eventId} style={{ marginBottom: "40px" }}>
            <h2>
              <Link href={`/tournaments/${eventId}`}>{event?.name}</Link>
            </h2>

            <p>
              {formatDate(event?.start_date)} – {formatDate(event?.end_date)}
              <br />
              Status: {event?.status || "scheduled"}
            </p>

            <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Boat</th>
                  <th>Points</th>
                </tr>
              </thead>

              <tbody>
                {standings.map(([boat, result], index) => (
                  <tr key={boat}>
                    <td>{index + 1}</td>
                    <td>
                      {result.id ? (
                        <Link href={`/boats/${result.id}`}>{boat}</Link>
                      ) : (
                        boat
                      )}
                    </td>
                    <td>{result.points.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </main>
  );
}
