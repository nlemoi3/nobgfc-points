import { supabase } from "../../lib/supabase";

export default async function AnglerStandingsPage() {
const { data } = await supabase
  .from("catches")
  .select(`
    points_awarded,
    status,
    anglers(first_name,last_name)
  `)
  .eq("status", "approved");

  const standings: Record<string, number> = {};

  data?.forEach((catchRecord: any) => {
    const angler =
      `${catchRecord.anglers?.first_name} ${catchRecord.anglers?.last_name}`;

    standings[angler] =
      (standings[angler] || 0) +
      Number(catchRecord.points_awarded || 0);
  });

  const sortedStandings = Object.entries(standings)
    .sort((a, b) => b[1] - a[1]);

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
          {sortedStandings.map(([angler, points], index) => (
            <tr key={angler}>
              <td>{index + 1}</td>
              <td>{angler}</td>
              <td>{points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}