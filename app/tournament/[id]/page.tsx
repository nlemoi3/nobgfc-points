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
      anglers(first_name,last_name),
      species(name)
    `)
    .eq("event_id", eventId)
    .eq("status", "approved");

  const boatScores: Record<string, { points: number; id?: number }> = {};
  const anglerScores: Record<string, number> = {};

  catches?.forEach((c: any) => {
    const boat = c.boats?.name || "Unknown Boat";
    const angler = `${c.anglers?.first_name || ""} ${
      c.anglers?.last_name || ""
    }`.trim();

    if (!boatScores[boat]) {
  boatScores[boat] = { points: 0, id: c.boats?.id };
}

boatScores[boat].points += Number(c.points_awarded || 0);
    anglerScores[angler] =
      (anglerScores[angler] || 0) + Number(c.points_awarded || 0);
  });

  const boatStandings = Object.entries(boatScores).sort(
  (a, b) => b[1].points - a[1].points
);
  const anglerStandings = Object.entries(anglerScores).sort(
    (a, b) => b[1] - a[1]
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

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/tournaments">← Back to Tournament Archive</Link>
      </p>

      <h1>{event?.name || "Tournament"}</h1>

      <p>
        {formatDate(event?.start_date)} – {formatDate(event?.end_date)}
        <br />
        Status: {event?.status || "scheduled"}
      </p>

      {event?.notes && (
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
              <strong>{firstPlaceBoat[0]}</strong>
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
              <strong>{secondPlaceBoat[0]}</strong>
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
              <strong>{thirdPlaceBoat[0]}</strong>
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
              <strong>{topAngler[0]}</strong>
              <br />
              {Number(topAngler[1]).toFixed(1)} points
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
            {anglerStandings.map(([angler, points], index) => (
              <tr key={angler}>
                <td>{index + 1}</td>
                <td>{angler}</td>
                <td>{points.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: "30px" }}>Largest Fish</h2>

      <ul>
        <li>Blue Marlin: {largestBlueMarlin ? `${largestBlueMarlin.weight} lbs` : "No catch"}</li>
        <li>Tuna: {largestTuna ? `${largestTuna.weight} lbs` : "No catch"}</li>
        <li>Wahoo: {largestWahoo ? `${largestWahoo.weight} lbs` : "No catch"}</li>
        <li>Dolphin: {largestDolphin ? `${largestDolphin.weight} lbs` : "No catch"}</li>
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
                  {c.anglers?.first_name} {c.anglers?.last_name}
                </td>
                <td>{c.species?.name}</td>
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