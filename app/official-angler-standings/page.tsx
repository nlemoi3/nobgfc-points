import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";

export default async function OfficialAnglerStandingsPage() {
  const { data, error } = await supabase
    .from("catches")
    .select(`
      id,
      points_awarded,
      released,
      tagged,
      weight,
      anglers(first_name,last_name),
      species(name)
    `);

  const anglerCatches: Record<string, any[]> = {};

  data?.forEach((catchRecord: any) => {
    const anglerName =
      `${catchRecord.anglers?.first_name || "Unknown"} ${catchRecord.anglers?.last_name || "Angler"}`;

    if (!anglerCatches[anglerName]) {
      anglerCatches[anglerName] = [];
    }

    anglerCatches[anglerName].push(catchRecord);
  });

  const standings = Object.entries(anglerCatches)
    .map(([anglerName, catches]) => ({
      anglerName,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Official Angler Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Angler</th>
            <th>Official Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr key={row.anglerName}>
              <td>{index + 1}</td>
              <td>{row.anglerName}</td>
              <td>{row.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}