export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "../../lib/supabase";

function normalizeBoatName(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rowStyle(rank: number) {
  if (rank === 1) {
    return { backgroundColor: "#fff3b0", fontWeight: "bold" };
  }

  if (rank === 2) {
    return { backgroundColor: "#e5e5e5", fontWeight: "bold" };
  }

  if (rank === 3) {
    return { backgroundColor: "#f1d1a1", fontWeight: "bold" };
  }

  return {};
}

export default async function HistoricalStandingsPage() {
  const { data: rows, error } = await supabase
    .from("historical_boat_standings")
    .select("*")
    .order("season_year", { ascending: false })
    .order("rank", { ascending: true });

  const { data: boats } = await supabase
    .from("boats")
    .select("id,name");

  const boatByNormalizedName: Record<string, any> = {};

  boats?.forEach((boat: any) => {
    boatByNormalizedName[normalizeBoatName(boat.name)] = boat;
  });

  const years = Array.from(
    new Set((rows || []).map((row: any) => row.season_year))
  ).sort((a: any, b: any) => b - a);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Historical Boat Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {years.length > 0 && (
        <p>
          Jump to:{" "}
          {years.map((year: any) => (
            <span key={year} style={{ marginRight: "12px" }}>
              <a href={`#year-${year}`}>{year}</a>
            </span>
          ))}
        </p>
      )}

      <p>
        <strong>Legend:</strong>{" "}
        <span style={{ backgroundColor: "#fff3b0", padding: "3px 8px" }}>
          Champion
        </span>{" "}
        <span style={{ backgroundColor: "#e5e5e5", padding: "3px 8px" }}>
          2nd
        </span>{" "}
        <span style={{ backgroundColor: "#f1d1a1", padding: "3px 8px" }}>
          3rd
        </span>
      </p>

      {years.length === 0 ? (
        <p>No historical standings entered yet.</p>
      ) : (
        years.map((year: any) => {
          const yearRows = (rows || []).filter(
            (row: any) => row.season_year === year
          );

          return (
            <section
              id={`year-${year}`}
              key={year}
              style={{ marginBottom: "40px" }}
            >
              <h2>{year}</h2>

              <table
                border={1}
                cellPadding={8}
                style={{ borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Boat</th>
                    <th>Points</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {yearRows.map((row: any) => {
                    const matchedBoat =
                      boatByNormalizedName[normalizeBoatName(row.boat_name)];

                    return (
                      <tr key={row.id} style={rowStyle(Number(row.rank))}>
                        <td>{row.rank}</td>
                        <td>
                          {matchedBoat ? (
                            <Link href={`/boats/${matchedBoat.id}`}>
                              {row.boat_name}
                            </Link>
                          ) : (
                            row.boat_name
                          )}
                        </td>
                        <td>{Number(row.points).toFixed(0)}</td>
                        <td>{row.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </main>
  );
}