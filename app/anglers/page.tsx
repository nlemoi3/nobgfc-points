import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function AnglersPage() {
  const { data: anglers, error } = await supabase
    .from("anglers")
    .select(`
      id,
      first_name,
      last_name,
      is_member,
      is_youth,
      photo_url
    `)
    .order("last_name");

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      angler_id,
      points_awarded,
      species(name)
    `)
    .eq("status", "approved");

  const statsByAnglerId: Record<
    number,
    {
      points: number;
      catches: number;
      blueMarlin: number;
    }
  > = {};

  catches?.forEach((c: any) => {
    if (!c.angler_id) return;

    if (!statsByAnglerId[c.angler_id]) {
      statsByAnglerId[c.angler_id] = {
        points: 0,
        catches: 0,
        blueMarlin: 0,
      };
    }

    statsByAnglerId[c.angler_id].points += Number(c.points_awarded || 0);
    statsByAnglerId[c.angler_id].catches += 1;

    if (c.species?.name === "Blue Marlin") {
      statsByAnglerId[c.angler_id].blueMarlin += 1;
    }
  });

  const sortedAnglers = [...(anglers || [])].sort((a: any, b: any) => {
    const aPoints = statsByAnglerId[a.id]?.points || 0;
    const bPoints = statsByAnglerId[b.id]?.points || 0;

    return bPoints - aPoints;
  });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Anglers</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Photo</th>
            <th>Angler</th>
            <th>Status</th>
            <th>Career Points</th>
            <th>Approved Catches</th>
            <th>Blue Marlin</th>
            <th>Profile</th>
          </tr>
        </thead>

        <tbody>
          {sortedAnglers.map((angler: any) => {
            const stats = statsByAnglerId[angler.id] || {
              points: 0,
              catches: 0,
              blueMarlin: 0,
            };

            return (
              <tr key={angler.id}>
                <td>
                  {angler.photo_url ? (
                    <img
                      src={angler.photo_url}
                      alt={`${angler.first_name} ${angler.last_name}`}
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {angler.first_name} {angler.last_name}
                </td>

                <td>
                  {angler.is_member ? "Member" : "Guest"}
                  {angler.is_youth ? " • Youth" : ""}
                </td>

                <td>{stats.points.toFixed(1)}</td>
                <td>{stats.catches}</td>
                <td>{stats.blueMarlin}</td>

                <td>
                  <Link href={`/anglers/${angler.id}`}>View Profile</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}