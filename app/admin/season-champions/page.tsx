import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getOfficialEligiblePoints } from "../../../lib/scoring";

export default async function SeasonChampionsPage() {
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    released,
    tagged,
    status,
    weight,
    boats(id,name),
    anglers(id,first_name,last_name,is_member,is_youth),
    species(name)
  `)
  .eq("status", "approved");

  const boatCatches: Record<string, any[]> = {};
  const anglerCatches: Record<string, any[]> = {};
  const youthCatches: Record<string, any[]> = {};

  catches?.forEach((catchRecord: any) => {
    const boatName = catchRecord.boats?.name || "Unknown Boat";

    if (!boatCatches[boatName]) {
      boatCatches[boatName] = [];
    }

    boatCatches[boatName].push(catchRecord);

    const anglerName =
      `${catchRecord.anglers?.first_name || ""} ${catchRecord.anglers?.last_name || ""}`.trim();

    if (catchRecord.anglers?.is_member) {
      if (!anglerCatches[anglerName]) {
        anglerCatches[anglerName] = [];
      }

      anglerCatches[anglerName].push(catchRecord);
    }

    if (catchRecord.anglers?.is_youth) {
      if (!youthCatches[anglerName]) {
        youthCatches[anglerName] = [];
      }

      youthCatches[anglerName].push(catchRecord);
    }
  });

  const boatStandings = Object.entries(boatCatches)
    .map(([boatName, catches]) => ({
      boatName,
      boatId: catches[0]?.boats?.id,
      points: getOfficialEligiblePoints(catches),
      catches,
    }))
    .sort((a, b) => b.points - a.points);

  const anglerStandings = Object.entries(anglerCatches)
    .map(([anglerName, catches]) => ({
      anglerName,
      anglerId: catches[0]?.anglers?.id,
      points: getOfficialEligiblePoints(catches),
      catches,
    }))
    .sort((a, b) => b.points - a.points);

  const youthStandings = Object.entries(youthCatches)
    .map(([anglerName, catches]) => ({
      anglerName,
      anglerId: catches[0]?.anglers?.id,
      points: getOfficialEligiblePoints(catches),
      catches,
    }))
    .sort((a, b) => b.points - a.points);

  const boatChampion = boatStandings[0];
  const anglingChampion = anglerStandings[0];
  const youthChampion = youthStandings[0];

  return (
    <main className="panel">
      <h1>Season Champions</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            minWidth: "280px",
          }}
        >
          <h2>Boat Champion</h2>

          {boatChampion ? (
            <>
              <p>
                <strong>
                  {boatChampion.boatId ? (
                    <Link href={`/boats/${boatChampion.boatId}`}>
                      {boatChampion.boatName}
                    </Link>
                  ) : (
                    boatChampion.boatName
                  )}
                </strong>
              </p>

              <p>
                {boatChampion.points.toFixed(1)} points
              </p>
            </>
          ) : (
            <p>No qualifying catches.</p>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            minWidth: "280px",
          }}
        >
          <h2>Angling Champion</h2>

          {anglingChampion ? (
            <>
              <p>
                <strong>
                  {anglingChampion.anglerId ? (
                    <Link href={`/anglers/${anglingChampion.anglerId}`}>
                      {anglingChampion.anglerName}
                    </Link>
                  ) : (
                    anglingChampion.anglerName
                  )}
                </strong>
              </p>

              <p>
                {anglingChampion.points.toFixed(1)} points
              </p>
            </>
          ) : (
            <p>No qualifying catches.</p>
          )}
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            minWidth: "280px",
          }}
        >
          <h2>Dutch Prager Youth Champion</h2>

          {youthChampion ? (
            <>
              <p>
                <strong>
                  {youthChampion.anglerId ? (
                    <Link href={`/anglers/${youthChampion.anglerId}`}>
                      {youthChampion.anglerName}
                    </Link>
                  ) : (
                    youthChampion.anglerName
                  )}
                </strong>
              </p>

              <p>
                {youthChampion.points.toFixed(1)} points
              </p>
            </>
          ) : (
            <p>No qualifying catches.</p>
          )}
        </div>
      </div>

      <p style={{ marginTop: "30px" }}>
        <Link href="/official-standings">
          View Official Boat Standings
        </Link>
      </p>

      <p>
        <Link href="/official-angler-standings">
          View Official Angler Standings
        </Link>
      </p>
    </main>
  );
}
