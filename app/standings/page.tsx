import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function StandingsPage() {
const { data, error } = await supabase
  .from("catches")
  .select(`
    points_awarded,
    status,
    boats(id,name)
  `)
  .eq("status", "approved");

  const standings: Record<string, { id?: number; points: number }> = {};

  data?.forEach((catchRecord: any) => {
    const boatName = catchRecord.boats?.name || "Unknown Boat";
    if (!standings[boatName]) {
      standings[boatName] = { id: catchRecord.boats?.id, points: 0 };
    }
    standings[boatName].points += Number(catchRecord.points_awarded || 0);
  });

  const sortedStandings = Object.entries(standings).sort(
    (a, b) => b[1].points - a[1].points,
  );

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
          {sortedStandings.map(([boat, result], index) => (
            <tr key={boat}>
              <td>{index + 1}</td>
              <td>
                {result.id ? <Link href={`/boats/${result.id}`}>{boat}</Link> : boat}
              </td>
              <td>{result.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
