import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminHistoricalStandingsPage() {
  const { data: rows, error } = await supabase
    .from("historical_boat_standings")
    .select("*")
    .order("season_year", { ascending: false })
    .order("rank", { ascending: true });

  return (
    <main className="panel">
      <h1>Manage Historical Standings</h1>
      <p>
  <Link href="/admin/historical-standings/new">
    Add Historical Standing
  </Link>
</p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Rank</th>
            <th>Boat</th>
            <th>Points</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows?.map((row: any) => (
            <tr key={row.id}>
              <td>{row.season_year}</td>
              <td>{row.rank}</td>
              <td>{row.boat_name}</td>
              <td>{Number(row.points).toFixed(0)}</td>
              <td>{row.notes || "-"}</td>
              <td>
                <Link href={`/admin/historical-standings/${row.id}`}>
                  Edit / Delete
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}