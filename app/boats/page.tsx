import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

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

  const totalBoats = boats?.length || 0;
  const topPoints = rankedBoats[0] ? (boatPoints[rankedBoats[0].id] || 0) : 0;

  return (
    <main className="panel boats-list-page">
      <div className="toolbar">
        <h1>Boats</h1>
        <p className="hint">
          {totalBoats} boats, top career total {topPoints.toFixed(1)} points
        </p>
      </div>

      {error && (
        <p className="alert alert-danger">
          Error loading boats: {error.message}
        </p>
      )}

      {rankedBoats.length === 0 ? (
        <p>No boats found.</p>
      ) : (
        <div className="boats-grid">
          {rankedBoats.map((boat: any) => (
            <Link key={boat.id} href={`/boats/${boat.id}`} className="boat-list-card">
              <div
                className="boat-list-media"
                style={
                  boat.photo_url
                    ? { backgroundImage: `url('${boat.photo_url}')` }
                    : undefined
                }
              >
                {boat.logo_url && (
                  <img
                    src={boat.logo_url}
                    alt={boat.name}
                    className="boat-list-logo"
                  />
                )}
                <span className="boat-rank-chip">#{rankByBoatId[boat.id] || "-"}</span>
              </div>

              <div className="boat-list-body">
                <h3>{boat.name}</h3>

                <p className="boat-list-meta">
                  {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") || "Details coming soon"}
                  {boat.length_feet ? ` - ${boat.length_feet} ft` : ""}
                </p>

                {boat.home_port && (
                  <p className="boat-list-port">{boat.home_port}</p>
                )}

                <div className="boat-list-stats">
                  <span>
                    <strong>{(boatPoints[boat.id] || 0).toFixed(1)}</strong> career points
                  </span>
                  <span>View profile</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
