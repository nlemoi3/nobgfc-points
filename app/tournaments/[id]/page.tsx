import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  compareTournamentStandings,
  formatCatchWeight,
  isBillfishSpecies,
  isCatchWithinEventDates,
  isWeighedCatch,
  laterValidTimestamp,
} from "../../../lib/scoring";

export const dynamic = "force-dynamic";

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

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  const [{ data: event }, { data: catches }] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,start_date,end_date,status,notes,is_tournament")
      .eq("id", eventId)
      .single(),
    supabase
      .from("catches")
      .select(`
        id,
        weight,
        points_awarded,
        status,
        catch_datetime,
        photo_url,
        boats(id,name),
        anglers(id,first_name,last_name),
        species(name)
      `)
      .eq("event_id", eventId)
      .eq("status", "approved"),
  ]);

  if (!event?.is_tournament) {
    notFound();
  }

  const eligibleCatches =
    catches?.filter((catchRecord: any) =>
      isCatchWithinEventDates(
        catchRecord.catch_datetime,
        event?.start_date,
        event?.end_date,
      ),
    ) || [];
  const excludedCatchCount = (catches?.length || 0) - eligibleCatches.length;

  const boatScores: Record<
    string,
    {
      points: number;
      id?: number;
      name: string;
      totalReachedAt: string | null;
    }
  > = {};
  const anglerScores: Record<
    string,
    { id?: number; name: string; points: number }
  > = {};

  eligibleCatches.forEach((c: any) => {
    // Rule 12: tournament point rankings include billfish points only.
    if (!isBillfishSpecies(c.species?.name)) return;

    const boatName = c.boats?.name || "Unknown Boat";
    const boatKey = c.boats?.id ? String(c.boats.id) : `unknown:${boatName}`;
    const anglerName =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim() ||
      "Unknown Angler";
    const anglerKey = c.anglers?.id
      ? String(c.anglers.id)
      : `unknown:${anglerName}`;
    const points = Number(c.points_awarded || 0);

    if (!boatScores[boatKey]) {
      boatScores[boatKey] = {
        points: 0,
        id: c.boats?.id,
        name: boatName,
        totalReachedAt: null,
      };
    }

    boatScores[boatKey].points += points;
    if (points > 0) {
      boatScores[boatKey].totalReachedAt = laterValidTimestamp(
        boatScores[boatKey].totalReachedAt,
        c.catch_datetime,
      );
    }

    if (!anglerScores[anglerKey]) {
      anglerScores[anglerKey] = {
        id: c.anglers?.id,
        name: anglerName,
        points: 0,
      };
    }
    anglerScores[anglerKey].points += points;
  });

  const boatStandings = Object.entries(boatScores).sort(
    (a, b) =>
      compareTournamentStandings(a[1], b[1]) ||
      a[1].name.localeCompare(b[1].name),
  );
  const anglerStandings = Object.entries(anglerScores).sort(
    (a, b) => b[1].points - a[1].points || a[1].name.localeCompare(b[1].name),
  );

  const firstPlaceBoat = boatStandings[0];
  const secondPlaceBoat = boatStandings[1];
  const thirdPlaceBoat = boatStandings[2];
  const topAngler = anglerStandings[0];

  const largestBlueMarlin = eligibleCatches
    .filter((c: any) => c.species?.name === "Blue Marlin" && isWeighedCatch(c))
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestTuna = eligibleCatches
    .filter(
      (c: any) =>
        c.species?.name === "Yellowfin Tuna" &&
        isWeighedCatch(c)
    )
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestWahoo = eligibleCatches
    .filter((c: any) => c.species?.name === "Wahoo" && isWeighedCatch(c))
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestDolphin = eligibleCatches
    .filter((c: any) => c.species?.name === "Dolphin" && isWeighedCatch(c))
    .sort((a: any, b: any) => b.weight - a.weight)[0];

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
      <p>
        <Link href="/tournaments">← Back to Tournament Archive</Link>
      </p>

      <h1>{event?.name || "Tournament"}</h1>

      <p>
        {formatDate(event?.start_date)} – {formatDate(event?.end_date)}
        <br />
        Status: <span className={statusClass(event?.status)}>{event?.status || "scheduled"}</span>
      </p>

      {(event?.status === "cancelled" || event?.status === "rescheduled") && (
        <p className="schedule-notice">
          <strong>Scheduling Update:</strong> {event.notes || "Tournament schedule was updated."}
        </p>
      )}

      {event?.notes && event?.status !== "cancelled" && event?.status !== "rescheduled" && (
        <p>
          <strong>Notes:</strong> {event.notes}
        </p>
      )}

      {excludedCatchCount > 0 && (
        <p className="schedule-notice">
          {excludedCatchCount} legacy {excludedCatchCount === 1 ? "catch was" : "catches were"}{" "}
          excluded because the recorded catch date falls outside this event.
        </p>
      )}

      <h2>Tournament Awards</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>1st Place Boat</h3>
          {firstPlaceBoat ? (
            <>
              <strong>
                {firstPlaceBoat[1].id ? (
                  <Link href={`/boats/${firstPlaceBoat[1].id}`}>
                    {firstPlaceBoat[1].name}
                  </Link>
                ) : (
                  firstPlaceBoat[1].name
                )}
              </strong>
              <br />
              {firstPlaceBoat[1].points.toFixed(1)} points
            </>
          ) : (
            "No Results"
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>2nd Place Boat</h3>
          {secondPlaceBoat ? (
            <>
              <strong>
                {secondPlaceBoat[1].id ? (
                  <Link href={`/boats/${secondPlaceBoat[1].id}`}>
                    {secondPlaceBoat[1].name}
                  </Link>
                ) : (
                  secondPlaceBoat[1].name
                )}
              </strong>
              <br />
              {secondPlaceBoat[1].points.toFixed(1)} points
            </>
          ) : (
            "No Results"
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>3rd Place Boat</h3>
          {thirdPlaceBoat ? (
            <>
              <strong>
                {thirdPlaceBoat[1].id ? (
                  <Link href={`/boats/${thirdPlaceBoat[1].id}`}>
                    {thirdPlaceBoat[1].name}
                  </Link>
                ) : (
                  thirdPlaceBoat[1].name
                )}
              </strong>
              <br />
              {thirdPlaceBoat[1].points.toFixed(1)} points
            </>
          ) : (
            "No Results"
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>Top Billfish Angler</h3>
          {topAngler ? (
            <>
              <strong>
                {topAngler[1].id ? (
                  <Link href={`/anglers/${topAngler[1].id}`}>
                    {topAngler[1].name}
                  </Link>
                ) : (
                  topAngler[1].name
                )}
              </strong>
              <br />
              {topAngler[1].points.toFixed(1)} points
            </>
          ) : (
            "No Results"
          )}
        </div>
      </div>

      <h2>Boat Standings</h2>

      <p>Only billfish points count toward tournament rankings.</p>

      {boatStandings.length === 0 ? (
        <p>No catches entered for this tournament.</p>
      ) : (
        <div className="table-wrap mobile-card-wrap" role="region" aria-label="Tournament boat standings" tabIndex={0}>
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
            {boatStandings.map(([boatKey, result], index) => (
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
      )}

      <p className="muted">
        Tied boat totals are ranked by which boat reached the total first, as
        required by tournament Rule 5.
      </p>

      <h2 style={{ marginTop: "30px" }}>Angler Standings</h2>

      {anglerStandings.length === 0 ? (
        <p>No angler points entered for this tournament.</p>
      ) : (
        <div className="table-wrap mobile-card-wrap" role="region" aria-label="Tournament angler standings" tabIndex={0}>
        <table className="admin-table mobile-card-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Angler</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {anglerStandings.map(([anglerKey, result], index) => (
              <tr key={anglerKey}>
                <td data-label="Rank">{index + 1}</td>
                <td data-label="Angler">
                  {result.id ? (
                    <Link href={`/anglers/${result.id}`}>{result.name}</Link>
                  ) : (
                    result.name
                  )}
                </td>
                <td data-label="Points">{result.points.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <h2 style={{ marginTop: "30px" }}>Largest Fish</h2>

      <ul>
        <li>
          Blue Marlin:{" "}
          {largestBlueMarlin ? (
            <Link href={`/catches/${largestBlueMarlin.id}`}>
              {largestBlueMarlin.weight} lbs
            </Link>
          ) : (
            "No catch"
          )}
        </li>
        <li>
          Yellowfin Tuna:{" "}
          {largestTuna ? (
            <Link href={`/catches/${largestTuna.id}`}>
              {largestTuna.weight} lbs
            </Link>
          ) : (
            "No catch"
          )}
        </li>
        <li>
          Wahoo:{" "}
          {largestWahoo ? (
            <Link href={`/catches/${largestWahoo.id}`}>
              {largestWahoo.weight} lbs
            </Link>
          ) : (
            "No catch"
          )}
        </li>
        <li>
          Dolphin:{" "}
          {largestDolphin ? (
            <Link href={`/catches/${largestDolphin.id}`}>
              {largestDolphin.weight} lbs
            </Link>
          ) : (
            "No catch"
          )}
        </li>
      </ul>

      <h2>All Tournament Catches</h2>

      {eligibleCatches.length === 0 ? (
        <p>No catches entered for this tournament.</p>
      ) : (
        <div className="table-wrap mobile-card-wrap" role="region" aria-label="All tournament catches" tabIndex={0}>
        <table className="admin-table mobile-card-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Boat</th>
              <th>Angler</th>
              <th>Species</th>
              <th>Weight</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {eligibleCatches.map((c: any) => (
              <tr key={c.id}>
                <td data-label="Photo">
                  {c.photo_url ? (
                    <a href={c.photo_url} target="_blank">
                      <img
                        src={c.photo_url}
                        alt="Catch"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td data-label="Boat">
                  {c.boats?.id ? (
                    <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                  ) : (
                    c.boats?.name
                  )}
                </td>

                <td data-label="Angler">
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
                <td data-label="Species">
                  <Link href={`/catches/${c.id}`}>{c.species?.name}</Link>
                </td>
                <td data-label="Weight">{formatCatchWeight(c)}</td>
                <td data-label="Points">{c.points_awarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
