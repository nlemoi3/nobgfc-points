import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getOfficialEligiblePoints } from "../../../lib/scoring";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SocialLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;

  return (
    <a href={href} target="_blank" style={{ marginRight: "12px" }}>
      {label}
    </a>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

function LargestFishCard({
  title,
  catchRecord,
}: {
  title: string;
  catchRecord: any;
}) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>

      {catchRecord ? (
        <>
          {catchRecord.photo_url && (
            <img
              src={catchRecord.photo_url}
              alt={title}
              style={{
                maxWidth: "100%",
                display: "block",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            />
          )}

          <p style={{ margin: "8px 0" }}>
            <strong>
              <Link href={`/catches/${catchRecord.id}`}>
                {catchRecord.weight} lbs
              </Link>
            </strong>
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
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
          <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#5a7387" }}>
            {formatDateTime(catchRecord.catch_datetime)}
          </p>
        </>
      ) : (
        <p style={{ margin: "8px 0", color: "#5a7387" }}>No catch</p>
      )}
    </div>
  );
}

export default async function BoatProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boatId = Number(id);

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", boatId)
    .single();

  const { data: ownerLinks } = await supabase
    .from("boat_owners")
    .select("angler_id, anglers(id, first_name, last_name)")
    .eq("boat_id", boatId);

  const { data: allCatches } = await supabase
  .from("catches")
  .select(`
    id,
    boat_id,
    weight,
    points_awarded,
    released,
    tagged,
    status,
    catch_datetime,
    photo_url,
    boats(id,name),
    species(name),
    anglers(id,first_name,last_name),
    events(id,name)
  `)
  .eq("status", "approved");

  if (!boat) {
    return <main className="panel">Boat not found.</main>;
  }
const { data: boatAwards } = await supabase
  .from("boat_awards")
  .select("*")
  .eq("boat_id", boatId)
  .order("award_year", { ascending: false });

  const { data: historicalRows } = await supabase
  .from("historical_boat_standings")
  .select("*")
  .order("season_year", { ascending: false });

  const boatCatches = (allCatches || []).filter((c: any) => c.boat_id === boatId);

  function normalizeBoatName(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const historicalResults =
  historicalRows?.filter(
    (row: any) =>
      normalizeBoatName(row.boat_name) ===
      normalizeBoatName(boat.name)
  ) || [];

  const groupedByBoat: Record<string, any[]> = {};

  allCatches?.forEach((c: any) => {
    const boatName = c.boats?.name || "Unknown Boat";

    if (!groupedByBoat[boatName]) {
      groupedByBoat[boatName] = [];
    }

    groupedByBoat[boatName].push(c);
  });

  const boatStandings = Object.entries(groupedByBoat)
    .map(([name, catches]) => ({
      name,
      id: catches[0]?.boats?.id,
      points: getOfficialEligiblePoints(catches),
    }))
    .sort((a, b) => b.points - a.points);

  const rankIndex = boatStandings.findIndex((b) => b.id === boatId);
  const currentRank = rankIndex >= 0 ? rankIndex + 1 : null;
  const officialPoints = currentRank ? boatStandings[rankIndex].points : 0;

  const blueMarlinCount = boatCatches.filter(
    (c: any) => c.species?.name === "Blue Marlin"
  ).length;
const totalApprovedCatches = boatCatches.length;

const careerPoints = boatCatches.reduce(
  (total: number, c: any) => total + Number(c.points_awarded || 0),
  0
);


  const largestBlueMarlin = boatCatches
    .filter((c: any) => c.species?.name === "Blue Marlin" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestTuna = boatCatches
    .filter(
      (c: any) =>
        ["Yellowfin Tuna", "Bigeye Tuna"].includes(c.species?.name) && c.weight
    )
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestWahoo = boatCatches
    .filter((c: any) => c.species?.name === "Wahoo" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const largestDolphin = boatCatches
    .filter((c: any) => c.species?.name === "Dolphin" && c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const tournamentScores: Record<string, { eventId: number; points: number }> = {};

  boatCatches.forEach((c: any) => {
    const eventName = c.events?.name || "Unknown Event";
    const eventId = c.events?.id;

    if (!tournamentScores[eventName]) {
      tournamentScores[eventName] = { eventId, points: 0 };
    }

    tournamentScores[eventName].points += Number(c.points_awarded || 0);
  });

  const tournamentHistory = Object.entries(tournamentScores).sort(
    (a, b) => b[1].points - a[1].points
  );

  const tournamentAppearances = tournamentHistory.filter(
    ([, result]) => result.points > 0
  ).length;

  return (
    <>
      <p style={{ marginBottom: "16px" }}>
        <Link href="/boats">← Back to Boats</Link>
      </p>
      <main className="panel">
        {boat.photo_url && (
          <div
            className="boat-hero"
            style={{
              backgroundImage: `url('${boat.photo_url}')`,
            }}
          >
            <div className="boat-hero-content">
              <div className="boat-hero-text">
                <h1 style={{ margin: "0 0 2px" }}>{boat.name}</h1>
                {boat.home_port && (
                  <p style={{ margin: "-2px 0 2px", color: "#e0e8f0", fontSize: "1rem", fontWeight: 600, textAlign: "center" }}>
                    {boat.home_port}
                  </p>
                )}
                {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") && (
                  <p style={{ margin: "0", color: "#d0dce8", fontSize: "0.85rem", textAlign: "center" }}>
                    {[boat.year, boat.make, boat.model].filter(Boolean).join(" ")}
                    {boat.length_feet ? ` — ${boat.length_feet} ft` : ""}
                  </p>
                )}
              </div>
              {boat.logo_url && (
                <div className="boat-hero-logo">
                  <img src={boat.logo_url} alt={`${boat.name} logo`} />
                </div>
              )}
            </div>
          </div>
        )}

        {!boat.photo_url && (
          <>
            <h1 style={{ margin: "0 0 2px" }}>{boat.name}</h1>
            {boat.home_port && (
              <p style={{ margin: "-2px 0 2px", fontSize: "1rem", fontWeight: 600, color: "#5a7387", textAlign: "center" }}>
                {boat.home_port}
              </p>
            )}
            {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") && (
              <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#7a8fa3", textAlign: "center" }}>
                {[boat.year, boat.make, boat.model].filter(Boolean).join(" ")}
                {boat.length_feet ? ` — ${boat.length_feet} ft` : ""}
              </p>
            )}
            {boat.logo_url && (
              <img
                src={boat.logo_url}
                alt={`${boat.name} logo`}
                style={{ maxWidth: "160px", display: "block", margin: "0 auto 16px" }}
            />
          )}
        </>
      )}

      <div className="stats-grid">
        <StatCard title="Current Rank" value={currentRank ? `#${currentRank}` : "Unranked"} />
        <StatCard title="Official Points" value={officialPoints.toFixed(1)} />
        <StatCard title="Blue Marlin Count" value={blueMarlinCount} />
        <StatCard title="Tournament Appearances" value={tournamentAppearances} />
        <StatCard title="Career Points" value={careerPoints.toFixed(1)} />
        <StatCard title="Approved Catches" value={totalApprovedCatches} />
      </div>

      <h2>Boat Details</h2>

      {boat.captain_name && (
        <p>
          <strong>Captain:</strong> {boat.captain_name}
        </p>
      )}

      {boat.owner_name && (
        <p>
          <strong>Owner:</strong> {boat.owner_name}
        </p>
      )}

      {ownerLinks && ownerLinks.length > 0 && (
        <p>
          <strong>Owner Accounts:</strong>{" "}
          {ownerLinks
            .map((link: any) => link.anglers)
            .filter(Boolean)
            .map((owner: any, index: number) => (
              <span key={owner.id}>
                {index > 0 ? ", " : ""}
                <Link href={`/anglers/${owner.id}`}>
                  {owner.first_name} {owner.last_name}
                </Link>
              </span>
            ))}
        </p>
      )}

      <p>
        <SocialLink href={boat.website_url} label="Website" />
        <SocialLink href={boat.facebook_url} label="Facebook" />
        <SocialLink href={boat.instagram_url} label="Instagram" />
        <SocialLink href={boat.youtube_url} label="YouTube" />
      </p>

      {boat.notes && <p>{boat.notes}</p>}

      <h2>Largest Fish</h2>

      <div className="stats-grid">
        <LargestFishCard title="Largest Blue Marlin" catchRecord={largestBlueMarlin} />
        <LargestFishCard title="Largest Tuna" catchRecord={largestTuna} />
        <LargestFishCard title="Largest Wahoo" catchRecord={largestWahoo} />
        <LargestFishCard title="Largest Dolphin" catchRecord={largestDolphin} />
      </div>

      <h2>Boat Awards</h2>

      {boatAwards && boatAwards.length > 0 ? (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Award</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {boatAwards.map((award: any) => (
                <tr key={award.id}>
                  <td>{award.award_year}</td>
                  <td>{award.award_name}</td>
                  <td>{award.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No boat awards recorded.</p>
      )}

      <h2>Historical Season Results</h2>

      {historicalResults.length > 0 ? (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Rank</th>
                <th>Points</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {historicalResults.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.season_year}</td>
                  <td>{row.rank}</td>
                  <td>{Number(row.points).toFixed(0)}</td>
                  <td>{row.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No historical season results found.</p>
      )}

      <h2>Tournament History</h2>

      {tournamentHistory.length === 0 ? (
        <p>No tournament points yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {tournamentHistory.map(([eventName, result]) => (
                <tr key={eventName}>
                  <td>
                    {result.eventId ? (
                      <Link href={`/tournaments/${result.eventId}`}>{eventName}</Link>
                    ) : (
                      eventName
                    )}
                  </td>
                  <td>{result.points.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: "30px" }}>Catch History</h2>

      {boatCatches.length === 0 ? (
        <p>No catches entered for this boat.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Date/Time</th>
              <th>Event</th>
              <th>Angler</th>
              <th>Species</th>
              <th>Weight</th>
              <th>Released</th>
              <th>Tagged</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {boatCatches
              .sort((a: any, b: any) => {
                const aTime = a.catch_datetime
                  ? new Date(a.catch_datetime).getTime()
                  : a.id || 0;
                const bTime = b.catch_datetime
                  ? new Date(b.catch_datetime).getTime()
                  : b.id || 0;

                return bTime - aTime;
              })
              .map((c: any) => (
                <tr key={c.id}>
                  <td>
                    {c.photo_url ? (
                      <a href={c.photo_url} target="_blank">
                        <img
                          src={c.photo_url}
                          alt="Catch"
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                          }}
                        />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{formatDateTime(c.catch_datetime)}</td>
                  <td>
  {c.events?.id ? (
    <Link href={`/tournaments/${c.events.id}`}>
      {c.events?.name}
    </Link>
  ) : (
    c.events?.name
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
  <Link href={`/catches/${c.id}`}>
    {c.species?.name}
  </Link>
</td>
                  <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
                  <td>{c.released ? "Yes" : "No"}</td>
                  <td>{c.tagged ? "Yes" : "No"}</td>
                  <td>{c.points_awarded}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      </main>
    </>
  );
}
