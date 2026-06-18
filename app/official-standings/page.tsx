import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";

export default async function OfficialStandingsPage() {
const { data, error } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    released,
    tagged,
    status,
    weight,
    boats(name),
    species(name)
  `)
  .eq("status", "approved");

  const boatCatches: Record<string, any[]> = {};

  data?.forEach((catchRecord: any) => {
    const boatName = catchRecord.boats?.name || "Unknown Boat";

    if (!boatCatches[boatName]) {
      boatCatches[boatName] = [];
    }

    boatCatches[boatName].push(catchRecord);
  });

  const standings = Object.entries(boatCatches)
    .map(([boatName, catches]) => ({
      boatName,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Official Boat Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Official Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr key={row.boatName}>
              <td>{index + 1}</td>
              <td>{row.boatName}</td>
              <td>{row.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}