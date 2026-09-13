import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { buildOfficialMemberAnglerStandings } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

export default async function OfficialAnglerStandingsPage() {
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
    line_class,
    anglers(id,first_name,last_name,is_member),
    species(name)
  `)
  .eq("status", "approved")
  .gte("catch_datetime", seasonStart)
  .lt("catch_datetime", seasonEnd);

  const standings = buildOfficialMemberAnglerStandings((data || []) as any[]);

  return (
    <main className="panel">
      <h1>Official Angler Standings</h1>
      <p>Members only.</p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div className="table-wrap mobile-card-wrap" role="region" aria-label="Official angler standings" tabIndex={0}>
      <table className="admin-table mobile-card-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Angler</th>
            <th>Official Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr key={row.anglerId ?? row.anglerName}>
              <td data-label="Rank">{index + 1}</td>
              <td data-label="Angler">
                {row.anglerId ? (
                  <Link href={`/anglers/${row.anglerId}`}>
                    {row.anglerName}
                  </Link>
                ) : (
                  row.anglerName
                )}
              </td>
              <td data-label="Official Points">{row.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
