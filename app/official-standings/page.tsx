import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { compareOfficialStandings, getOfficialStandingScore } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

export default async function OfficialStandingsPage() {
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
    boats(id,name),
    species(name)
  `)
  .eq("status", "approved")
  .gte("catch_datetime", seasonStart)
  .lt("catch_datetime", seasonEnd);

  const boatCatches = new Map<
    string,
    { boatId?: number; boatName: string; catches: any[] }
  >();

  data?.forEach((catchRecord: any) => {
    const boatId = catchRecord.boats?.id;
    const boatName = catchRecord.boats?.name || "Unknown Boat";
    const key = boatId ? String(boatId) : `unknown:${boatName}`;
    const group = boatCatches.get(key) || { boatId, boatName, catches: [] };

    group.catches.push(catchRecord);
    boatCatches.set(key, group);
  });

  const standings = Array.from(boatCatches.values())
    .map(({ boatId, boatName, catches }) => ({
      boatId,
      boatName,
      ...getOfficialStandingScore(catches),
    }))
    .sort(
      (a, b) =>
        compareOfficialStandings(a, b) || a.boatName.localeCompare(b.boatName)
    );

  return (
    <main className="panel">
      <h1>Official Boat Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div className="table-wrap mobile-card-wrap" role="region" aria-label="Official boat standings" tabIndex={0}>
      <table className="admin-table mobile-card-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Official Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row, index) => (
            <tr key={row.boatId ?? row.boatName}>
              <td data-label="Rank">{index + 1}</td>
              <td data-label="Boat">
                {row.boatId ? (
                  <Link href={`/boats/${row.boatId}`}>{row.boatName}</Link>
                ) : (
                  row.boatName
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
