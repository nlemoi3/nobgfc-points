import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserAngler } from "../../lib/auth";
import { getActiveSeasonRange } from "../../lib/season";
import {
  formatCatchWeight,
  getExcludedCatches,
  getOfficialEligiblePoints,
  compareOfficialStandings,
  getOfficialStandingScore,
  isBillfishSpecies,
} from "../../lib/scoring";
import { createClient } from "../../lib/supabase/server";

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function relationName(value: any) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}

export default async function MySeasonPage() {
  noStore();

  const [user, angler] = await Promise.all([
    getCurrentUser(),
    getCurrentUserAngler(),
  ]);

  if (!user) {
    redirect("/login?next=/my-season");
  }

  if (!angler) {
    return (
      <main className="panel my-season-page">
        <p className="eyebrow">Member competition portal</p>
        <h1>Connect Your Angler Profile</h1>
        <p className="portal-intro">
          Your sign-in is working, but it is not linked to a club angler record
          yet.
        </p>

        <div className="member-onboarding-card">
          <span className="member-onboarding-number">1</span>
          <div>
            <h2>Confirm your account email</h2>
            <p>
              The email in Account Settings must match the email on your club
              angler profile. If it already matches, ask an administrator to
              connect the records.
            </p>
          </div>
        </div>

        <div className="portal-actions">
          <Link className="btn" href="/account">Check Account Settings</Link>
          <Link className="btn btn-ghost" href="/anglers">Find My Angler Profile</Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { year, start: seasonStart, end: seasonEnd } =
    await getActiveSeasonRange(supabase);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
  const seasonEndDate = `${year}-12-31`;

  const [catchesResult, eventsResult] = await Promise.all([
    supabase
      .from("catches")
      .select(`
        id,
        angler_id,
        weight,
        line_class,
        points_awarded,
        released,
        tagged,
        catch_datetime,
        photo_url,
        boats(id,name),
        anglers(id,first_name,last_name,is_member),
        species(name),
        events(id,name)
      `)
      .eq("status", "approved")
      .gte("catch_datetime", seasonStart)
      .lt("catch_datetime", seasonEnd)
      .order("catch_datetime", { ascending: false }),
    supabase
      .from("events")
      .select("id,name,start_date,end_date,status,is_tournament")
      .eq("is_tournament", true)
      .gte("end_date", today)
      .lte("start_date", seasonEndDate)
      .neq("status", "cancelled")
      .order("start_date")
      .limit(1),
  ]);

  const catches: any[] = catchesResult.data || [];
  const myCatches = catches.filter(
    (catchRecord: any) => Number(catchRecord.angler_id) === Number(angler.id),
  );
  const excludedIds = new Set(
    getExcludedCatches(myCatches).map((catchRecord) => catchRecord.id),
  );
  const countingCatches = myCatches.length - excludedIds.size;
  const officialPoints = getOfficialEligiblePoints(myCatches);
  const billfishCount = myCatches.filter((catchRecord: any) =>
    isBillfishSpecies(relationName(catchRecord.species)),
  ).length;

  const anglerGroups = new Map<string, { name: string; catches: any[] }>();
  catches.forEach((catchRecord: any) => {
    if (!catchRecord.anglers?.is_member || !catchRecord.anglers?.id) return;

    const key = String(catchRecord.anglers.id);
    const group = anglerGroups.get(key) || {
      name: `${catchRecord.anglers.first_name || ""} ${catchRecord.anglers.last_name || ""}`.trim(),
      catches: [],
    };
    group.catches.push(catchRecord);
    anglerGroups.set(key, group);
  });

  const standings = Array.from(anglerGroups.entries())
    .map(([id, group]) => ({
      id,
      name: group.name,
      ...getOfficialStandingScore(group.catches),
    }))
    .sort((left, right) =>
      compareOfficialStandings(left, right) || left.name.localeCompare(right.name),
    );
  const rankIndex = standings.findIndex(
    (standing) => Number(standing.id) === Number(angler.id),
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;
  const nextEvent = eventsResult.data?.[0] || null;
  const hasLoadError = Boolean(catchesResult.error || eventsResult.error);
  const fullName = `${angler.first_name || ""} ${angler.last_name || ""}`.trim();

  return (
    <main className="panel my-season-page">
      <section className="my-season-hero">
        <div>
          <p className="eyebrow">{year} member competition portal</p>
          <h1>{fullName || "My Season"}</h1>
          <p className="portal-intro">
            Your approved catches and official championship position in one
            place.
          </p>
        </div>
        <span className="member-status-chip">Profile connected</span>
      </section>

      {hasLoadError ? (
        <p className="alert alert-danger">
          Some season information could not be loaded. Check the public
          standings before relying on these totals.
        </p>
      ) : null}

      <section className="kpi-grid member-kpi-grid" aria-label="My season summary">
        <div className="stat-card stat-card-info">
          <h3>Official points</h3>
          <div className="stat-card-value">{officialPoints.toFixed(1)}</div>
          <span>{countingCatches} counting catch{countingCatches === 1 ? "" : "es"}</span>
        </div>
        <div className="stat-card stat-card-info">
          <h3>Current rank</h3>
          <div className="stat-card-value">{rank ? `#${rank}` : "—"}</div>
          <span>{rank ? `of ${standings.length} ranked members` : "Not ranked yet"}</span>
        </div>
        <div className="stat-card">
          <h3>Approved catches</h3>
          <div className="stat-card-value">{myCatches.length}</div>
          <span>{excludedIds.size > 0 ? `${excludedIds.size} outside annual limits` : "All currently count"}</span>
        </div>
        <div className="stat-card">
          <h3>Billfish</h3>
          <div className="stat-card-value">{billfishCount}</div>
          <span>Approved this season</span>
        </div>
      </section>

      {excludedIds.size > 0 ? (
        <p className="alert alert-warning">
          {excludedIds.size} approved catch{excludedIds.size === 1 ? " is" : "es are"}
          {" "}shown in your history but excluded from your official total by
          annual species limits.
        </p>
      ) : null}

      <div className="member-season-grid">
        <section className="feature-card next-event-card">
          <p className="eyebrow">Next tournament</p>
          {nextEvent ? (
            <>
              <h2>{nextEvent.name}</h2>
              <p>{formatDate(nextEvent.start_date)}{nextEvent.end_date !== nextEvent.start_date ? ` – ${formatDate(nextEvent.end_date)}` : ""}</p>
              <Link href={`/tournaments/${nextEvent.id}`}>View tournament details →</Link>
            </>
          ) : (
            <div className="empty-state">
              <strong>No upcoming tournament is scheduled.</strong>
              <span>New dates will appear here after the club publishes them.</span>
            </div>
          )}
        </section>

        <section className="feature-card member-help-card">
          <p className="eyebrow">Something look wrong?</p>
          <h2>Catch corrections are reviewed</h2>
          <p>
            A weighmaster or administrator must review corrections before they
            change official standings.
          </p>
          <Link href="/catches">Compare all approved catches →</Link>
        </section>
      </div>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h2>My Approved Catches</h2>
          </div>
          <Link href={`/anglers/${angler.id}`}>View full profile</Link>
        </div>

        {myCatches.length > 0 ? (
          <div className="member-catch-list">
            {myCatches.slice(0, 6).map((catchRecord: any) => (
              <Link className="member-catch-row" href={`/catches/${catchRecord.id}`} key={catchRecord.id}>
                <span className="member-catch-species">
                  <strong>{relationName(catchRecord.species) || "Catch"}</strong>
                  <small>{formatDate(catchRecord.catch_datetime)} · {relationName(catchRecord.boats) || "Boat unavailable"}</small>
                </span>
                <span>{formatCatchWeight(catchRecord)}</span>
                <span className="member-catch-points">
                  {Number(catchRecord.points_awarded || 0).toFixed(1)} pts
                  {excludedIds.has(catchRecord.id) ? <small>Not counting</small> : null}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No approved catches are recorded for you in {year}.</strong>
            <span>Your results will appear here after a catch is reviewed and approved.</span>
          </div>
        )}
      </section>

      <div className="portal-actions member-quick-actions">
        <Link className="btn" href="/official-angler-standings">Full Standings</Link>
        <Link className="btn btn-ghost" href="/events">Event Schedule</Link>
        <Link className="btn btn-ghost" href="/account">Account Settings</Link>
      </div>
    </main>
  );
}
