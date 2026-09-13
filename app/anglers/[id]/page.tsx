// Angler profile type fix
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";
import {
  formatCatchWeight,
  getExcludedCatches,
  getOfficialEligiblePoints,
  isWeighedCatch,
} from "../../../lib/scoring";
import { getActiveSeasonRange } from "../../../lib/season";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function relationName(value: any) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}

export default async function AnglerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const anglerId = Number(id);
  const { year: seasonYear, start: seasonStart, end: seasonEnd } =
    await getActiveSeasonRange(supabase);

  const { data: angler } = await supabase
    .from("anglers")
    .select("id,first_name,last_name,is_member,is_youth,active,photo_url,biography")
    .eq("id", anglerId)
    .single();

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      line_class,
      points_awarded,
      released,
      tagged,
      catch_datetime,
      photo_url,
      boats(id,name),
      species(name),
      events(id,name)
    `)
    .eq("angler_id", anglerId)
    .eq("status", "approved")
    .gte("catch_datetime", seasonStart)
    .lt("catch_datetime", seasonEnd)
    .order("catch_datetime", { ascending: false });

  if (!angler) {
    return <main className="panel">Angler not found.</main>;
  }

  const { data: awards } = await supabase
  .from("angler_awards")
  .select("*")
  .eq("angler_id", anglerId)
  .order("award_year", { ascending: false });
  
  const seasonCatches: any[] = catches || [];
  const officialPoints = getOfficialEligiblePoints(seasonCatches);
  const excludedCatchIds = new Set(
    getExcludedCatches(seasonCatches).map((catchRecord: any) => catchRecord.id),
  );

  const blueMarlinCount =
    seasonCatches.filter((c: any) => relationName(c.species) === "Blue Marlin")
      .length || 0;

  const largestFish = [...seasonCatches]
    .filter((c: any) => isWeighedCatch(c))
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const boatsFished = Array.from(
    new Map(
      seasonCatches
        .filter((c: any) => relationName(c.boats))
        .map((c: any) => [
          c.boats?.id || relationName(c.boats),
          { id: c.boats?.id, name: relationName(c.boats) },
        ]),
    ).values(),
  );

  return (
    <main className="panel">
      <p>
        <Link href="/anglers">← Back to Anglers</Link>
      </p>

      <h1>
        {angler.first_name} {angler.last_name}
      </h1>

      {angler.photo_url && (
        <img
          src={angler.photo_url}
          alt={`${angler.first_name} ${angler.last_name}`}
          style={{
            maxWidth: "300px",
            display: "block",
            marginBottom: "20px",
          }}
        />
      )}

      <p>
        {angler.is_member ? "Member" : "Guest"}
        {angler.is_youth ? " • Youth Angler" : ""}
      </p>

      {angler.biography && <p>{angler.biography}</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>
            {seasonYear} {angler.is_member ? "Official" : "Eligible"} Points
          </h3>
          <p><strong>{officialPoints.toFixed(1)}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>{seasonYear} Approved Catches</h3>
          <p><strong>{seasonCatches.length}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>{seasonYear} Blue Marlin</h3>
          <p><strong>{blueMarlinCount}</strong></p>
        </div>
      </div>

      <h2>{seasonYear} Largest Fish</h2>

      {largestFish ? (
        <div style={{ border: "1px solid #ccc", padding: "15px", maxWidth: "320px" }}>
          {largestFish.photo_url && (
            <img
              src={largestFish.photo_url}
              alt="Largest fish"
              style={{ maxWidth: "280px", display: "block", marginBottom: "10px" }}
            />
          )}

          <p>
            <strong>
              <Link href={`/catches/${largestFish.id}`}>
                {relationName(largestFish.species)}
              </Link>
            </strong>
            <br />
            {largestFish.weight} lbs
            <br />
            {formatDateTime(largestFish.catch_datetime)}
          </p>
        </div>
      ) : (
        <p>No weighed fish yet.</p>
      )}

      <h2>Awards</h2>

{awards && awards.length > 0 ? (
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
      {awards.map((award: any) => (
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
  <p>No awards recorded.</p>
)}

<h2>Boats Fished in {seasonYear}</h2>

      {boatsFished.length > 0 ? (
        <ul>
          {boatsFished.map((boat: any) => (
            <li key={boat.id || boat.name}>
              {boat.id ? (
                <Link href={`/boats/${boat.id}`}>{boat.name}</Link>
              ) : (
                boat.name
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No boats recorded yet.</p>
      )}

      <h2>{seasonYear} Approved Catches</h2>

      {seasonCatches.length === 0 ? (
        <p>No approved catches recorded for {seasonYear}.</p>
      ) : (
        <div className="table-wrap" role="region" aria-label={`${seasonYear} approved catches`} tabIndex={0}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Date</th>
              <th>Event</th>
              <th>Boat</th>
              <th>Species</th>
              <th>Weight</th>
              <th>Released</th>
              <th>Tagged</th>
              <th>Points</th>
            </tr>
          </thead>

          <tbody>
            {seasonCatches.map((c: any) => (
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
      {relationName(c.events)}
    </Link>
  ) : (
    relationName(c.events)
  )}
</td>
                <td>
                  {c.boats?.id ? (
                    <Link href={`/boats/${c.boats.id}`}>{relationName(c.boats)}</Link>
                  ) : (
                    relationName(c.boats)
                  )}
                </td>
                <td>
  <Link href={`/catches/${c.id}`}>
    {relationName(c.species)}
  </Link>
</td>
                <td>{formatCatchWeight(c)}</td>
                <td>{c.released ? "Yes" : "No"}</td>
                <td>{c.tagged ? "Yes" : "No"}</td>
                <td>
                  {c.points_awarded}
                  {excludedCatchIds.has(c.id) && (
                    <small style={{ display: "block", color: "#5a7387" }}>
                      Not counting toward official total
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
