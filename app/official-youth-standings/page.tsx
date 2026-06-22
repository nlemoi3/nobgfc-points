import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";

export default async function OfficialYouthStandingsPage() {
const { data, error } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    released,
    tagged,
    status,
    weight,
    anglers(id,first_name,last_name,is_youth),
    species(name)
  `)
  .eq("status", "approved");

  const youthCatches: Record<string, any[]> = {};

  data?.forEach((catchRecord: any) => {
    if (!catchRecord.anglers?.is_youth) return;

    const anglerName =
      `${catchRecord.anglers?.first_name || "Unknown"} ${catchRecord.anglers?.last_name || "Angler"}`;

    if (!youthCatches[anglerName]) {
      youthCatches[anglerName] = [];
    }

    youthCatches[anglerName].push(catchRecord);
  });

  const standings = Object.entries(youthCatches)
    .map(([anglerName, catches]) => ({
      anglerName,
      anglerId: catches[0]?.anglers?.id,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Dutch Prager Youth Standings</h1>

      <p>
        Official youth standings using the same scoring rules as the
        Angling Champion award.
      </p>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Youth Angler</th>
            <th>Official Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr key={row.anglerName}>
              <td>{index + 1}</td>
              <td>
                {row.anglerId ? (
                  <Link href={`/anglers/${row.anglerId}`}>
                    {row.anglerName}
                  </Link>
                ) : (
                  row.anglerName
                )}
              </td>
              <td>{row.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {standings.length === 0 && (
        <p>No youth anglers have qualifying catches yet.</p>
      )}
    </main>
  );
}
