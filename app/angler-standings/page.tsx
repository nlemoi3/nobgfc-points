import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function AnglerStandingsPage() {
const { data } = await supabase
  .from("catches")
  .select(`
    points_awarded,
    status,
    anglers(id,first_name,last_name)
  `)
  .eq("status", "approved");

  const standings: Record<string, { id?: number; points: number }> = {};

  data?.forEach((catchRecord: any) => {
    const angler =
      `${catchRecord.anglers?.first_name} ${catchRecord.anglers?.last_name}`;

    if (!standings[angler]) {
      standings[angler] = { id: catchRecord.anglers?.id, points: 0 };
    }
    standings[angler].points += Number(catchRecord.points_awarded || 0);
  });

  const sortedStandings = Object.entries(standings)
    .sort((a, b) => b[1].points - a[1].points);

  return (
    <main style={{ padding: "40px" }}>
      <h1>Angler Standings</h1>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Angler</th>
            <th>Points</th>
          </tr>
        </thead>

        <tbody>
          {sortedStandings.map(([angler, result], index) => (
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
    </main>
  );
}
