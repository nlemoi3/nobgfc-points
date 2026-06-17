import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";

export default async function DashboardPage() {
  const { data: catches } = await supabase
    .from("catches")
    .select(`
      id,
      points_awarded,
      weight,
      released,
      tagged,
      created_at,
      boats(name),
      anglers(first_name,last_name),
      species(name)
    `);

  const boatCatches: Record<string, any[]> = {};
  const anglerCatches: Record<string, any[]> = {};

  catches?.forEach((c: any) => {
    const boat = c.boats?.name || "Unknown Boat";
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    if (!boatCatches[boat]) boatCatches[boat] = [];
    if (!anglerCatches[angler]) anglerCatches[angler] = [];

    boatCatches[boat].push(c);
    anglerCatches[angler].push(c);
  });

  const boatStandings = Object.entries(boatCatches)
    .map(([name, catches]) => ({
      name,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  const boatLeader = boatStandings[0];

  const anglerStandings = Object.entries(anglerCatches)
    .map(([name, catches]) => ({
      name,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  const anglerLeader = anglerStandings[0];

  const recentCatches = [...(catches || [])]
    .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
    .slice(0, 10);

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

  const blueMarlinCatches =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin") || [];

  const anglerCounts: Record<string, number> = {};
  const boatCounts: Record<string, number> = {};

  blueMarlinCatches.forEach((c: any) => {
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    const boat = c.boats?.name || "Unknown Boat";

    anglerCounts[angler] = (anglerCounts[angler] || 0) + 1;
    boatCounts[boat] = (boatCounts[boat] || 0) + 1;
  });

  const topBlueMarlinAngler = Object.entries(anglerCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const topBlueMarlinBoat = Object.entries(boatCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>NOBGFC Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h2>Boat Champion Leader</h2>
          {boatLeader && (
            <>
              <strong>{boatLeader.name}</strong>
              <br />
              {boatLeader.points.toFixed(1)} pts
            </>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h2>Angling Champion Leader</h2>
          {anglerLeader && (
            <>
              <strong>{anglerLeader.name}</strong>
              <br />
              {anglerLeader.points.toFixed(1)} pts
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Largest Blue Marlin</h3>
          {largestBlueMarlin ? `${largestBlueMarlin.weight} lbs` : "No catches"}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Largest Tuna</h3>
          {largestTuna ? `${largestTuna.weight} lbs` : "No catches"}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Largest Wahoo</h3>
          {largestWahoo ? `${largestWahoo.weight} lbs` : "No catches"}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Largest Dolphin</h3>
          {largestDolphin ? `${largestDolphin.weight} lbs` : "No catches"}
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>Most Blue Marlin Angler</h3>
          {topBlueMarlinAngler ? (
            <>
              <strong>{topBlueMarlinAngler[0]}</strong>
              <br />
              {topBlueMarlinAngler[1]} Blue Marlin
            </>
          ) : (
            "No Blue Marlin"
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>Most Blue Marlin Boat</h3>
          {topBlueMarlinBoat ? (
            <>
              <strong>{topBlueMarlinBoat[0]}</strong>
              <br />
              {topBlueMarlinBoat[1]} Blue Marlin
            </>
          ) : (
            "No Blue Marlin"
          )}
        </div>
      </div>

      <h2>Recent Catches</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
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
          {recentCatches.map((c: any) => (
            <tr key={c.id}>
              <td>{c.boats?.name}</td>
              <td>{c.anglers?.first_name} {c.anglers?.last_name}</td>
              <td>{c.species?.name}</td>
              <td>{c.weight || "Released"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>Top 10 Boats</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Official Points</th>
          </tr>
        </thead>
        <tbody>
          {boatStandings.slice(0, 10).map((boat, index) => (
            <tr key={boat.name}>
              <td>{index + 1}</td>
              <td>{boat.name}</td>
              <td>{boat.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}