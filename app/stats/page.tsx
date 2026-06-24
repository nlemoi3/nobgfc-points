import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      released,
      tagged,
      catch_datetime,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(name)
    `)
    .eq("status", "approved");

  const totalCatches = catches?.length || 0;

  const totalPoints =
    catches?.reduce(
      (sum: number, c: any) => sum + Number(c.points_awarded || 0),
      0
    ) || 0;

  const releasedCount = catches?.filter((c: any) => c.released).length || 0;
  const taggedCount = catches?.filter((c: any) => c.tagged).length || 0;

  const uniqueBoats = new Set(
    (catches || []).map((c: any) => c.boats?.id).filter(Boolean)
  );

  const uniqueAnglers = new Set(
    (catches || []).map((c: any) => c.anglers?.id).filter(Boolean)
  );

  const speciesCounts: Record<string, number> = {};

  catches?.forEach((c: any) => {
    const speciesName = c.species?.name || "Unknown";
    speciesCounts[speciesName] = (speciesCounts[speciesName] || 0) + 1;
  });

  const speciesRows = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);

  const yearCounts: Record<string, number> = {};

  catches?.forEach((c: any) => {
    if (!c.catch_datetime) return;
    const year = new Date(c.catch_datetime).getFullYear().toString();
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  const yearRows = Object.entries(yearCounts).sort((a, b) =>
    Number(b[0]) - Number(a[0])
  );

  return (
    <main className="panel">
      <h1>Club Statistics</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Approved Catches</h3>
          <p><strong>{totalCatches}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Total Points</h3>
          <p><strong>{totalPoints.toFixed(1)}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Boats</h3>
          <p><strong>{uniqueBoats.size}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Anglers</h3>
          <p><strong>{uniqueAnglers.size}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Releases</h3>
          <p><strong>{releasedCount}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Tagged Fish</h3>
          <p><strong>{taggedCount}</strong></p>
        </div>
      </div>

      <h2>Species Breakdown</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr>
            <th>Species</th>
            <th>Catches</th>
          </tr>
        </thead>
        <tbody>
          {speciesRows.map(([species, count]) => (
            <tr key={species}>
              <td>{species}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Catches by Year</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Catches</th>
          </tr>
        </thead>
        <tbody>
          {yearRows.map(([year, count]) => (
            <tr key={year}>
              <td>{year}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}