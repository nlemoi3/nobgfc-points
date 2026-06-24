import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function normalizeBoatName(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function BoatsPage() {
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      boat_id,
      points_awarded,
      boats(id,name)
    `)
    .eq("status", "approved");

  const boatPoints: Record<number, number> = {};

  catches?.forEach((c: any) => {
    const boatId = c.boats?.id;

    if (!boatId) return;

    boatPoints[boatId] =
      (boatPoints[boatId] || 0) + Number(c.points_awarded || 0);
  });

  const rankedBoats = [...(boats || [])].sort(
    (a: any, b: any) =>
      (boatPoints[b.id] || 0) - (boatPoints[a.id] || 0)
  );

  const rankByBoatId: Record<number, number> = {};

  rankedBoats.forEach((boat: any, index: number) => {
    rankByBoatId[boat.id] = index + 1;
  });

  return (
    <main className="panel">
      <h1>Boats</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error loading boats: {error.message}
        </p>
      )}

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Logo</th>
            <th>Boat</th>
            <th>Rank</th>
            <th>Career Points</th>
            <th>Profile</th>
          </tr>
        </thead>

        <tbody>
          {boats?.map((boat: any) => (
            <tr key={boat.id}>
              <td>
                {boat.logo_url ? (
                  <img
                    src={boat.logo_url}
                    alt={boat.name}
                    style={{
                      width: "70px",
                      height: "70px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  "-"
                )}
              </td>

              <td>
                <Link href={`/boats/${boat.id}`}>{boat.name}</Link>
              </td>

              <td>
                {rankByBoatId[boat.id]
                  ? `#${rankByBoatId[boat.id]}`
                  : "-"}
              </td>

              <td>
                {(boatPoints[boat.id] || 0).toFixed(1)}
              </td>

              <td>
                <Link href={`/boats/${boat.id}`}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
