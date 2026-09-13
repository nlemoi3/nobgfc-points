import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getActiveSeasonRange } from "../../lib/season";
import {
  compareTournamentStandings,
  isBillfishSpecies,
  isCatchWithinEventDates,
  laterValidTimestamp,
} from "../../lib/scoring";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
}

export default async function TournamentStandingsPage() {
  const { start: seasonStart, end: seasonEnd } =
    await getActiveSeasonRange(supabase);
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      points_awarded,
      catch_datetime,
      status,
      events(id,name,start_date,end_date,status,is_tournament),
      boats(id,name),
      species(name)
    `)
    .eq("status", "approved")
    .gte("catch_datetime", seasonStart)
    .lt("catch_datetime", seasonEnd);

  const eventStandings: Record<
    string,
    Record<
      string,
      { id?: number; name: string; points: number; totalReachedAt: string | null }
    >
  > = {};
  const eventInfo: Record<string, any> = {};

  catches?.forEach((c: any) => {
    // Rule 12: tournament boat awards are based on billfish points only.
    if (!isBillfishSpecies(c.species?.name)) return;

    const event = c.events;
    if (!event?.is_tournament) return;
    if (!isCatchWithinEventDates(c.catch_datetime, event.start_date, event.end_date)) return;
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
        totalReachedAt: null,
      };
    }
    eventStandings[eventId][boatKey].points += points;
    if (points > 0) {
      eventStandings[eventId][boatKey].totalReachedAt = laterValidTimestamp(
        eventStandings[eventId][boatKey].totalReachedAt,
        c.catch_datetime,
      );
    }
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
        <p>
          No approved billfish catches entered for tournament boat standings
          yet.
        </p>
      )}

      {eventEntries.map(([eventId, boatScores]) => {
        const event = eventInfo[eventId];
        const standings = Object.entries(boatScores).sort(
          (a, b) =>
            compareTournamentStandings(a[1], b[1]) ||
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

            <div className="table-wrap mobile-card-wrap" role="region" aria-label={`${event?.name} boat standings`} tabIndex={0}>
            <table className="admin-table mobile-card-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Boat</th>
                  <th>Points</th>
                  <th>Total Reached</th>
                </tr>
              </thead>

              <tbody>
                {standings.map(([boatKey, result], index) => (
                  <tr key={boatKey}>
                    <td data-label="Rank">{index + 1}</td>
                    <td data-label="Boat">
                      {result.id ? (
                        <Link href={`/boats/${result.id}`}>{result.name}</Link>
                      ) : (
                        result.name
                      )}
                    </td>
                    <td data-label="Points">{result.points.toFixed(1)}</td>
                    <td data-label="Total Reached">{formatDateTime(result.totalReachedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <p className="muted">
              Tied boat totals are ranked by which boat reached the total first,
              as required by tournament Rule 5.
            </p>
          </section>
        );
      })}
    </main>
  );
}
