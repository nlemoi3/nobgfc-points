import { supabase } from "../../lib/supabase";

export default async function StandingsPage() {
const { data, error } = await supabase
  .from("catches")
  .select(`
    points_awarded,
    status,
    boats(name)
  `)
  .eq("status", "approved");

  const standings: Record<string, number> = {};

  data?.forEach((catchRecord: any) => {
    const boatName = catchRecord.boats?.name || "Unknown Boat";
    standings[boatName] =
      (standings[boatName] || 0) + Number(catchRecord.points_awarded || 0);
  });

  const sortedStandings = Object.entries(standings).sort((a, b) => b[1] - a[1]);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {sortedStandings.length === 0 && <p>No points entered yet.</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map(([boat, points], index) => (
            <tr key={boat}>
              <td>{index + 1}</td>
              <td>{boat}</td>
              <td>{points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}