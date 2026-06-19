import { supabase } from "../../lib/supabase";

export default async function HistoricalStandingsPage() {
  const { data: rows, error } = await supabase
    .from("historical_boat_standings")
    .select("*")
    .order("season_year", { ascending: false })
    .order("rank", { ascending: true });

  const years = Array.from(
    new Set((rows || []).map((row: any) => row.season_year))
  ).sort((a: any, b: any) => b - a);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Historical Boat Standings</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {years.length === 0 ? (
        <p>No historical standings entered yet.</p>
      ) : (
        years.map((year: any) => {
          const yearRows = (rows || []).filter(
            (row: any) => row.season_year === year
          );

          return (
            <section key={year} style={{ marginBottom: "40px" }}>
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
                  {yearRows.map((row: any) => (
                    <tr
                      key={row.id}
                      style={{
                        fontWeight: row.rank === 1 ? "bold" : "normal",
                      }}
                    >
                      <td>{row.rank}</td>
                      <td>{row.boat_name}</td>
                      <td>{Number(row.points).toFixed(0)}</td>
                      <td>{row.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </main>
  );
}