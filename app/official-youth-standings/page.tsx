import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

export default async function OfficialYouthStandingsPage() {
  const { start: seasonStart, end: seasonEnd } = await getActiveSeasonRange(supabase);
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
  .eq("status", "approved")
  .gte("catch_datetime", seasonStart)
  .lt("catch_datetime", seasonEnd);

  const youthCatches = new Map<
    string,
    { anglerId?: number; anglerName: string; catches: any[] }
  >();

  data?.forEach((catchRecord: any) => {
    if (!catchRecord.anglers?.is_youth) return;

    const anglerId = catchRecord.anglers?.id;
    const anglerName =
      `${catchRecord.anglers?.first_name || "Unknown"} ${catchRecord.anglers?.last_name || "Angler"}`;
    const key = anglerId ? String(anglerId) : `unknown:${anglerName}`;
    const group = youthCatches.get(key) || {
      anglerId,
      anglerName,
      catches: [],
    };

    group.catches.push(catchRecord);
    youthCatches.set(key, group);
  });

  const standings = Array.from(youthCatches.values())
    .map(({ anglerId, anglerName, catches }) => ({
      anglerId,
      anglerName,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort(
      (a, b) =>
        b.points - a.points || a.anglerName.localeCompare(b.anglerName)
    );

  return (
    <main className="panel">
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
            <tr key={row.anglerId ?? row.anglerName}>
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
