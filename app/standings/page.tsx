import { supabase } from "../../lib/supabase";

export default async function StandingsPage() {
  const { data, error } = await supabase
    .from("catches")
    .select(`
      points_awarded,
      boats(name)
    `);

  const standings: Record<string, number> = {};

  data?.forEach((catchRecord: any) => {
    const boatName = catchRecord.boats?.name || "Unknown Boat";

    standings[boatName] =
      (standings[boatName] || 0) +
      Number(catchRecord.points_awarded || 0);
  });

  const sortedStandings = Object.entries(standings)
    .sort((a, b) => b[1] - a[1]);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Standings</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <ol>
        {sortedStandings.map(([boat, points]) => (
          <li key={boat}>
            <strong>{boat}</strong> — {points.toFixed(1)} points
          </li>
        ))}
      </ol>
    </main>
  );
}