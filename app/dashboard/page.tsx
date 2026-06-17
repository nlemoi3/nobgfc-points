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
    const angler = `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

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

  const anglerLeader = Object.entries(anglerCatches)
    .map(([name, catches]) => ({
      name,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points)[0];

  const recentCatches = [...(catches || [])]
    .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
    .slice(0, 10);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>NOBGFC Dashboard</h1>

      <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "20px", minWidth: "300px" }}>
          <h2>Boat Champion Leader</h2>
          {boatLeader ? (
            <>
              <p><strong>{boatLeader.name}</strong></p>
              <p>{boatLeader.points.toFixed(1)} points</p>
            </>
          ) : (
            <p>No catches entered</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "20px", minWidth: "300px" }}>
          <h2>Angling Champion Leader</h2>
          {anglerLeader ? (
            <>
              <p><strong>{anglerLeader.name}</strong></p>
              <p>{anglerLeader.points.toFixed(1)} points</p>
            </>
          ) : (
            <p>No catches entered</p>
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