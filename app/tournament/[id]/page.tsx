import { supabase } from "../../../lib/supabase";

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
  params: { id: string };
}) {
  const eventId = Number(params.id);

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      catch_datetime,
      boats(name),
      anglers(first_name,last_name),
      species(name),
      events(id,name,start_date,end_date,status)
    `)
   .eq("event_id", params.id);

  const event: any = catches?.[0]?.events;

  const boatScores: Record<string, number> = {};
  const anglerScores: Record<string, number> = {};

  catches?.forEach((c: any) => {
    const boat = c.boats?.name || "Unknown Boat";
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    boatScores[boat] =
      (boatScores[boat] || 0) + Number(c.points_awarded || 0);

    anglerScores[angler] =
      (anglerScores[angler] || 0) + Number(c.points_awarded || 0);
  });

  const boatStandings = Object.entries(boatScores)
    .sort((a, b) => b[1] - a[1]);

  const anglerStandings = Object.entries(anglerScores)
    .sort((a, b) => b[1] - a[1]);

  const largestBlueMarlin =
    catches
      ?.filter((c: any) => c.species?.name === "Blue Marlin" && c.weight)
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestTuna =
    catches
      ?.filter(
        (c: any) =>
          ["Yellowfin Tuna", "Bigeye Tuna"].includes(c.species?.name) &&
          c.weight
      )
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestWahoo =
    catches
      ?.filter((c: any) => c.species?.name === "Wahoo" && c.weight)
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestDolphin =
    catches
      ?.filter((c: any) => c.species?.name === "Dolphin" && c.weight)
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>{event?.name}</h1>

      <p>
        {formatDate(event?.start_date)} – {formatDate(event?.end_date)}
        <br />
        Status: {event?.status || "scheduled"}
      </p>

      <h2>Boat Standings</h2>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Points</th>
          </tr>
        </thead>

        <tbody>
          {boatStandings.map(([boat, points], index) => (
            <tr key={boat}>
              <td>{index + 1}</td>
              <td>{boat}</td>
              <td>{points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "30px" }}>Angler Standings</h2>

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

      <h2 style={{ marginTop: "30px" }}>Largest Fish</h2>

      <ul>
        <li>
          Blue Marlin:{" "}
          {largestBlueMarlin
            ? `${largestBlueMarlin.weight} lbs`
            : "No catch"}
        </li>

        <li>
          Tuna:{" "}
          {largestTuna
            ? `${largestTuna.weight} lbs`
            : "No catch"}
        </li>

        <li>
          Wahoo:{" "}
          {largestWahoo
            ? `${largestWahoo.weight} lbs`
            : "No catch"}
        </li>

        <li>
          Dolphin:{" "}
          {largestDolphin
            ? `${largestDolphin.weight} lbs`
            : "No catch"}
        </li>
      </ul>

      <h2>All Tournament Catches</h2>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
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
              <td>{c.boats?.name}</td>
              <td>
                {c.anglers?.first_name} {c.anglers?.last_name}
              </td>
              <td>{c.species?.name}</td>
              <td>{c.weight || "Released"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}