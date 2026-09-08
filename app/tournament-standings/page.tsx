import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getActiveSeasonRange } from "../../lib/season";

const BILLFISH_SPECIES = new Set([
  "Blue Marlin",
  "White Marlin",
  "Sailfish",
  "Spearfish",
  "Swordfish",
]);

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TournamentStandingsPage() {
  const { start: seasonStart, end: seasonEnd } = await getActiveSeasonRange(supabase);
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    status,
    events(id,name,start_date,end_date,status),
    boats(id,name),
    species(name)
  `)
  .eq("status", "approved")
  .gte("catch_datetime", seasonStart)
  .lt("catch_datetime", seasonEnd);

  const eventStandings: Record<
    string,
    Record<string, { id?: number; name: string; points: number }>
  > = {};
  const eventInfo: Record<string, any> = {};

  catches?.forEach((c: any) => {
    // Rule 12: tournament boat awards are based on billfish points only.
    if (!BILLFISH_SPECIES.has(c.species?.name)) return;

    const event = c.events;
    const eventId = event?.id;
    const boatId = c.boats?.id;
    const boatName = c.boats?.name || "Unknown Boat";
    const boatKey = boatId ? String(boatId) : `unknown:${boatName}`;
    const points = Number(c.points_awarded || 0);

    if (!eventId) return;

    eventInfo[eventId] = event;

    if (!eventStandings[eventId]) {
      eventStandings[eventId] = {};
    }

    if (!eventStandings[eventId][boatKey]) {
      eventStandings[eventId][boatKey] = {
        id: boatId,
        name: boatName,
        points: 0,
      };
    }
    eventStandings[eventId][boatKey].points += points;
  });

  const eventEntries = Object.entries(eventStandings);

  return (
    <main className="panel">
      <div className="toolbar">
        <div>
          <h1>Tournament Standings</h1>
          <p>Billfish-point rankings by tournament.</p>
        </div>
        <Link href="/events" className="btn btn-ghost">
          Event Schedule
        </Link>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {eventEntries.length === 0 && (
        <p>No approved billfish catches entered for tournament boat standings yet.</p>
      )}

      {eventEntries.map(([eventId, boatScores]) => {
        const event = eventInfo[eventId];
        const standings = Object.entries(boatScores).sort(
          (a, b) =>
            b[1].points - a[1].points ||
            a[1].name.localeCompare(b[1].name),
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
                {standings.map(([boatKey, result], index) => (
                  <tr key={boatKey}>
                    <td>{index + 1}</td>
                    <td>
                      {result.id ? (
                        <Link href={`/boats/${result.id}`}>{result.name}</Link>
                      ) : (
                        result.name
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
