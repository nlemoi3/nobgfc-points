import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../lib/supabase";
import { getOfficialEligiblePoints } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

const BILLFISH_FLAG_URL =
  "https://eklitnkmhugtjjhfoaku.supabase.co/storage/v1/object/public/catch-media/TBF.png";

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
    <div className="feature-card fish-card">
      <h3>{title}</h3>

      {catchRecord ? (
        <>
          {catchRecord.photo_url && (
            <img
              src={catchRecord.photo_url}
              alt={title}
              className="fish-card-photo"
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

  const {
    year: seasonYear,
    start: seasonStart,
    end: seasonEnd,
  } = await getActiveSeasonRange(supabase);
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
      anglers(id,first_name,last_name,is_member),
      species(name)
    `)
    .eq("status", "approved")
    .gte("catch_datetime", seasonStart)
    .lt("catch_datetime", seasonEnd);

  const boatCatches = new Map<
    string,
    { id?: number; name: string; catches: any[] }
  >();
  const anglerCatches = new Map<
    string,
    { id?: number; name: string; catches: any[] }
  >();

  catches?.forEach((c: any) => {
    const boatId = c.boats?.id;
    const boatName = c.boats?.name || "Unknown Boat";
    const boatKey = boatId ? String(boatId) : `unknown:${boatName}`;
    const boatGroup = boatCatches.get(boatKey) || {
      id: boatId,
      name: boatName,
      catches: [],
    };
    boatGroup.catches.push(c);
    boatCatches.set(boatKey, boatGroup);

    if (!c.anglers?.is_member) return;

    const anglerId = c.anglers?.id;
    const anglerName =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();
    const anglerKey = anglerId ? String(anglerId) : `unknown:${anglerName}`;
    const anglerGroup = anglerCatches.get(anglerKey) || {
      id: anglerId,
      name: anglerName || "Unknown Angler",
      catches: [],
    };
    anglerGroup.catches.push(c);
    anglerCatches.set(anglerKey, anglerGroup);
  });

  const boatStandings = Array.from(boatCatches.values())
    .map(({ id, name, catches }) => ({
      id,
      name,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  const boatLeader = boatStandings[0];

  const anglerStandings = Array.from(anglerCatches.values())
    .map(({ id, name, catches }) => ({
      id,
      name,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

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

  const anglerCounts = new Map<
    string,
    { count: number; id?: number; name: string }
  >();
  const boatCounts = new Map<
    string,
    { count: number; id?: number; name: string }
  >();

  blueMarlinCatches.forEach((c: any) => {
    const anglerId = c.anglers?.id;
    const anglerName =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();
    const anglerKey = anglerId ? String(anglerId) : `unknown:${anglerName}`;
    const angler = anglerCounts.get(anglerKey) || {
      count: 0,
      id: anglerId,
      name: anglerName || "Unknown Angler",
    };
    angler.count += 1;
    anglerCounts.set(anglerKey, angler);

    const boatId = c.boats?.id;
    const boatName = c.boats?.name || "Unknown Boat";
    const boatKey = boatId ? String(boatId) : `unknown:${boatName}`;
    const boat = boatCounts.get(boatKey) || {
      count: 0,
      id: boatId,
      name: boatName,
    };
    boat.count += 1;
    boatCounts.set(boatKey, boat);
  });

  const topBlueMarlinAngler = Array.from(anglerCounts.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  )[0];

  const topBlueMarlinBoat = Array.from(boatCounts.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  )[0];

  const totalApprovedCatches = catches?.length || 0;
  const totalBlueMarlin = blueMarlinCatches.length;

  return (
    <main className="panel dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <h1>{seasonYear} NOBGFC Championship Dashboard</h1>
          <p className="hint">
            Live pulse of the season across catches, leaders, and standings.
          </p>
        </div>

        <div className="dashboard-logo-strip">
          <img
            src="/nobgfc-logo.png"
            alt="NOBGFC logo"
            className="dashboard-logo dashboard-logo-primary"
          />

          <a
            href="https://www.billfish.org/"
            target="_blank"
            rel="noreferrer"
            className="dashboard-flag-wrap"
          >
            <img
              src={BILLFISH_FLAG_URL}
              alt="The Billfish Foundation flag"
              className="dashboard-logo dashboard-logo-secondary dashboard-flag-logo"
            />
          </a>
        </div>
      </section>

      <section className="kpi-grid">
        <div className="stat-card">
          <h3>Boat Champion Leader</h3>
          {boatLeader ? (
            <div className="stat-card-value" style={{ fontSize: "1.2rem" }}>
              {boatLeader.id ? (
                <Link href={`/boats/${boatLeader.id}`}>{boatLeader.name}</Link>
              ) : (
                boatLeader.name
              )}
              <div className="hint">{boatLeader.points.toFixed(1)} pts</div>
            </div>
          ) : (
            <p>No catches</p>
          )}
        </div>

        <div className="stat-card">
          <h3>Angling Champion Leader</h3>
          {anglerLeader ? (
            <div className="stat-card-value" style={{ fontSize: "1.2rem" }}>
              {anglerLeader.id ? (
                <Link href={`/anglers/${anglerLeader.id}`}>
                  {anglerLeader.name}
                </Link>
              ) : (
                anglerLeader.name
              )}
              <div className="hint">{anglerLeader.points.toFixed(1)} pts</div>
            </div>
          ) : (
            <p>No catches</p>
          )}
        </div>

        <div className="stat-card">
          <h3>Total Approved Catches</h3>
          <div className="stat-card-value">{totalApprovedCatches}</div>
        </div>

        <div className="stat-card">
          <h3>Total Blue Marlin</h3>
          <div className="stat-card-value">{totalBlueMarlin}</div>
        </div>
      </section>

      <section>
        <h2>Largest Fish</h2>
        <div className="dashboard-cards-grid">
          <LargestFishCard title="Largest Blue Marlin" catchRecord={largestBlueMarlin} />
          <LargestFishCard title="Largest Tuna" catchRecord={largestTuna} />
          <LargestFishCard title="Largest Wahoo" catchRecord={largestWahoo} />
          <LargestFishCard title="Largest Dolphin" catchRecord={largestDolphin} />
        </div>
      </section>

      <section className="dashboard-cards-grid dashboard-tight-grid">
        <div className="feature-card">
          <h3>Most Blue Marlin Angler</h3>
          {topBlueMarlinAngler ? (
            <>
              <strong>
                {topBlueMarlinAngler.id ? (
                  <Link href={`/anglers/${topBlueMarlinAngler.id}`}>
                    {topBlueMarlinAngler.name}
                  </Link>
                ) : (
                  topBlueMarlinAngler.name
                )}
              </strong>
              <p className="hint">{topBlueMarlinAngler.count} Blue Marlin</p>
            </>
          ) : (
            <p>No Blue Marlin</p>
          )}
        </div>

        <div className="feature-card">
          <h3>Most Blue Marlin Boat</h3>
          {topBlueMarlinBoat ? (
            <>
              <strong>
                {topBlueMarlinBoat.id ? (
                  <Link href={`/boats/${topBlueMarlinBoat.id}`}>
                    {topBlueMarlinBoat.name}
                  </Link>
                ) : (
                  topBlueMarlinBoat.name
                )}
              </strong>
              <p className="hint">{topBlueMarlinBoat.count} Blue Marlin</p>
            </>
          ) : (
            <p>No Blue Marlin</p>
          )}
        </div>
      </section>

      <section>
        <h2>Recent Catches</h2>
        <div className="table-wrap">
          <table className="admin-table">
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
        </div>
      </section>

      <section>
        <h2>Boat Standings</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Boat</th>
                <th>Official Points</th>
              </tr>
            </thead>
            <tbody>
              {boatStandings.map((boat, index) => (
                <tr key={boat.id ?? boat.name}>
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
        </div>
      </section>
    </main>
  );
}
