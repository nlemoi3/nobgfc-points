import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";

function formatDateTime(value: string | null) {
  if (!value) return "No date entered";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LargestFishCard({
  title,
  catchRecord,
}: {
  title: string;
  catchRecord: any;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "240px" }}>
      <h3>{title}</h3>

      {catchRecord ? (
        <>
          {catchRecord.photo_url && (
            <img
              src={catchRecord.photo_url}
              alt={title}
              style={{ maxWidth: "220px", display: "block", marginBottom: "10px" }}
            />
          )}

          <p>
            <strong>
              <Link href={`/catches/${catchRecord.id}`}>
                {catchRecord.weight} lbs
              </Link>
            </strong>
          </p>

          <p>
            {catchRecord.anglers?.id ? (
              <Link href={`/anglers/${catchRecord.anglers.id}`}>
                {catchRecord.anglers?.first_name}{" "}
                {catchRecord.anglers?.last_name}
              </Link>
            ) : (
              <>
                {catchRecord.anglers?.first_name}{" "}
                {catchRecord.anglers?.last_name}
              </>
            )}
          </p>

          <p>
            {catchRecord.boats?.id ? (
              <Link href={`/boats/${catchRecord.boats.id}`}>
                {catchRecord.boats?.name}
              </Link>
            ) : (
              catchRecord.boats?.name
            )}
          </p>

          <p>{formatDateTime(catchRecord.catch_datetime)}</p>
        </>
      ) : (
        <p>No catches</p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  noStore();

const { data: catches } = await supabase
  .from("catches")
  .select(`
    id,
    points_awarded,
    weight,
    released,
    tagged,
    status,
    catch_datetime,
    created_at,
    photo_url,
    boats(id,name),
    anglers(id,first_name,last_name),
    species(name)
  `)
  .eq("status", "approved");

  const boatCatches: Record<string, any[]> = {};
  const anglerCatches: Record<string, any[]> = {};

  catches?.forEach((c: any) => {
    const boat = c.boats?.name || "Unknown Boat";
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    if (!boatCatches[boat]) boatCatches[boat] = [];
    if (!anglerCatches[angler]) anglerCatches[angler] = [];

    boatCatches[boat].push(c);
    anglerCatches[angler].push(c);
  });

  const boatStandings = Object.entries(boatCatches)
    .map(([name, catches]) => ({
      name,
      id: catches[0]?.boats?.id,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  const boatLeader = boatStandings[0];

  const anglerStandings = Object.entries(anglerCatches)
    .map(([name, catches]) => ({
      name,
      id: catches[0]?.anglers?.id,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  const anglerLeader = anglerStandings[0];

  const recentCatches = [...(catches || [])]
    .sort((a: any, b: any) => {
      const aTime = a.catch_datetime
        ? new Date(a.catch_datetime).getTime()
        : a.id || 0;
      const bTime = b.catch_datetime
        ? new Date(b.catch_datetime).getTime()
        : b.id || 0;

      return bTime - aTime;
    })
    .slice(0, 10);

  const largestBlueMarlin = catches
    ?.filter((c: any) => c.species?.name === "Blue Marlin" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestTuna = catches
    ?.filter(
      (c: any) =>
        ["Yellowfin Tuna", "Bigeye Tuna"].includes(c.species?.name) &&
        c.weight
    )
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestWahoo = catches
    ?.filter((c: any) => c.species?.name === "Wahoo" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestDolphin = catches
    ?.filter((c: any) => c.species?.name === "Dolphin" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const blueMarlinCatches =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin") || [];

  const anglerCounts: Record<string, { count: number; id?: number }> = {};
  const boatCounts: Record<string, { count: number; id?: number }> = {};

  blueMarlinCatches.forEach((c: any) => {
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    const boat = c.boats?.name || "Unknown Boat";

    if (!anglerCounts[angler]) {
      anglerCounts[angler] = { count: 0, id: c.anglers?.id };
    }
    if (!boatCounts[boat]) {
      boatCounts[boat] = { count: 0, id: c.boats?.id };
    }

    anglerCounts[angler].count += 1;
    boatCounts[boat].count += 1;
  });

  const topBlueMarlinAngler = Object.entries(anglerCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  const topBlueMarlinBoat = Object.entries(boatCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  return (
    <main className="panel">
      <h1>NOBGFC Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h2>Boat Champion Leader</h2>
          {boatLeader ? (
            <>
              <strong>
                {boatLeader.id ? (
                  <Link href={`/boats/${boatLeader.id}`}>{boatLeader.name}</Link>
                ) : (
                  boatLeader.name
                )}
              </strong>
              <br />
              {boatLeader.points.toFixed(1)} pts
            </>
          ) : (
            <p>No catches</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h2>Angling Champion Leader</h2>
          {anglerLeader ? (
            <>
              <strong>
                {anglerLeader.id ? (
                  <Link href={`/anglers/${anglerLeader.id}`}>
                    {anglerLeader.name}
                  </Link>
                ) : (
                  anglerLeader.name
                )}
              </strong>
              <br />
              {anglerLeader.points.toFixed(1)} pts
            </>
          ) : (
            <p>No catches</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <LargestFishCard title="Largest Blue Marlin" catchRecord={largestBlueMarlin} />
        <LargestFishCard title="Largest Tuna" catchRecord={largestTuna} />
        <LargestFishCard title="Largest Wahoo" catchRecord={largestWahoo} />
        <LargestFishCard title="Largest Dolphin" catchRecord={largestDolphin} />
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>Most Blue Marlin Angler</h3>
          {topBlueMarlinAngler ? (
            <>
              <strong>
                {topBlueMarlinAngler[1].id ? (
                  <Link href={`/anglers/${topBlueMarlinAngler[1].id}`}>
                    {topBlueMarlinAngler[0]}
                  </Link>
                ) : (
                  topBlueMarlinAngler[0]
                )}
              </strong>
              <br />
              {topBlueMarlinAngler[1].count} Blue Marlin
            </>
          ) : (
            <p>No Blue Marlin</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "250px" }}>
          <h3>Most Blue Marlin Boat</h3>
          {topBlueMarlinBoat ? (
            <>
              <strong>
                {topBlueMarlinBoat[1].id ? (
                  <Link href={`/boats/${topBlueMarlinBoat[1].id}`}>
                    {topBlueMarlinBoat[0]}
                  </Link>
                ) : (
                  topBlueMarlinBoat[0]
                )}
              </strong>
              <br />
              {topBlueMarlinBoat[1].count} Blue Marlin
            </>
          ) : (
            <p>No Blue Marlin</p>
          )}
        </div>
      </div>

      <h2>Recent Catches</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {recentCatches.map((c: any) => (
            <tr key={c.id}>
              <td>
                <Link href={`/catches/${c.id}`}>
                  {formatDateTime(c.catch_datetime)}
                </Link>
              </td>
              <td>
                {c.boats?.id ? (
                  <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                ) : (
                  c.boats?.name
                )}
              </td>
              <td>
                {c.anglers?.id ? (
                  <Link href={`/anglers/${c.anglers.id}`}>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </Link>
                ) : (
                  <>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </>
                )}
              </td>
              <td>
                <Link href={`/catches/${c.id}`}>{c.species?.name}</Link>
              </td>
              <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>Boat Standings</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Boat</th>
            <th>Official Points</th>
          </tr>
        </thead>
        <tbody>
          {boatStandings.map((boat, index) => (
            <tr key={boat.name}>
              <td>{index + 1}</td>
              <td>
                {boat.id ? (
                  <Link href={`/boats/${boat.id}`}>{boat.name}</Link>
                ) : (
                  boat.name
                )}
              </td>
              <td>{boat.points.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
