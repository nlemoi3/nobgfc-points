import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  const { data: event } = await supabase
    .from("events")
    .select("id,name,start_date,end_date,status,notes")
    .eq("id", eventId)
    .single();

  const { data: catches } = await supabase
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
    .eq("status", "approved");

  const boatScores: Record<string, { points: number; id?: number }> = {};
  const anglerScores: Record<string, { id?: number; points: number }> = {};

  catches?.forEach((c: any) => {
    const boat = c.boats?.name || "Unknown Boat";
    const angler = `${c.anglers?.first_name || ""} ${
      c.anglers?.last_name || ""
    }`.trim();

    if (!boatScores[boat]) {
  boatScores[boat] = { points: 0, id: c.boats?.id };
}

boatScores[boat].points += Number(c.points_awarded || 0);
    if (!anglerScores[angler]) {
      anglerScores[angler] = { id: c.anglers?.id, points: 0 };
    }
    anglerScores[angler].points += Number(c.points_awarded || 0);
  });

  const boatStandings = Object.entries(boatScores).sort(
  (a, b) => b[1].points - a[1].points
);
  const anglerStandings = Object.entries(anglerScores).sort(
    (a, b) => b[1].points - a[1].points
  );

  const firstPlaceBoat = boatStandings[0];
  const secondPlaceBoat = boatStandings[1];
  const thirdPlaceBoat = boatStandings[2];
  const topAngler = anglerStandings[0];

  const largestBlueMarlin = catches
    ?.filter((c: any) => c.species?.name === "Blue Marlin" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestTuna = catches
    ?.filter(
      (c: any) =>
        ["Yellowfin Tuna", "Bigeye Tuna"].includes(c.species?.name) && c.weight
    )
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestWahoo = catches
    ?.filter((c: any) => c.species?.name === "Wahoo" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestDolphin = catches
    ?.filter((c: any) => c.species?.name === "Dolphin" && c.weight)
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

      <h2>Tournament Awards</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>1st Place Boat</h3>
          {firstPlaceBoat ? (
            <>
              <strong>
                {firstPlaceBoat[1].id ? (
                  <Link href={`/boats/${firstPlaceBoat[1].id}`}>
                    {firstPlaceBoat[0]}
                  </Link>
                ) : (
                  firstPlaceBoat[0]
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
                    {secondPlaceBoat[0]}
                  </Link>
                ) : (
                  secondPlaceBoat[0]
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
                    {thirdPlaceBoat[0]}
                  </Link>
                ) : (
                  thirdPlaceBoat[0]
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
          <h3>Top Angler</h3>
          {topAngler ? (
            <>
              <strong>
                {topAngler[1].id ? (
                  <Link href={`/anglers/${topAngler[1].id}`}>
                    {topAngler[0]}
                  </Link>
                ) : (
                  topAngler[0]
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

      {boatStandings.length === 0 ? (
        <p>No catches entered for this tournament.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Boat</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {boatStandings.map(([boat, result], index) => (
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
      )}

      <h2 style={{ marginTop: "30px" }}>Angler Standings</h2>

      {anglerStandings.length === 0 ? (
        <p>No angler points entered for this tournament.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Angler</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {anglerStandings.map(([angler, result], index) => (
              <tr key={angler}>
                <td>{index + 1}</td>
                <td>
                  {result.id ? (
                    <Link href={`/anglers/${result.id}`}>{angler}</Link>
                  ) : (
                    angler
                  )}
                </td>
                <td>{result.points.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
          Tuna:{" "}
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

      {catches?.length === 0 ? (
        <p>No catches entered for this tournament.</p>
      ) : (
        <table border={1} cellPadding={8}>
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
            {catches?.map((c: any) => (
              <tr key={c.id}>
                <td>
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

                <td>
                  {c.boats?.id ? (
                    <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                  ) : (
                    c.boats?.name
                  )}
                </td>

                <td>
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
                <td>
  <Link href={`/catches/${c.id}`}>
    {c.species?.name}
  </Link>
</td>
                <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
                <td>{c.points_awarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
