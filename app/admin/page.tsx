import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../lib/auth";
import {
  calculateCatchPoints,
  isCatchWithinEventDates,
} from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";
import { createClient } from "../../lib/supabase/server";

function isUnresolvedRequest(status: string | null) {
  return !["approved", "rejected", "closed"].includes(
    (status || "new").toLowerCase(),
  );
}

export default async function AdminPage() {
  noStore();

  const { role } = await requireRole("weighmaster");
  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <main className="panel">
        <h1>NOBGFC Weighmaster</h1>

        <h2>Weighmaster Tools</h2>
        <ul>
          <li><Link href="/admin/catch-entry">Enter Catch</Link></li>
          <li><Link href="/admin/catches">Manage Catches</Link></li>
        </ul>
      </main>
    );
  }

  const supabase = await createClient();
  const { year, start: seasonStart, end: seasonEnd } =
    await getActiveSeasonRange(supabase);
  const seasonStartDate = `${year}-01-01`;
  const seasonEndDate = `${year}-12-31`;

  const [catchesResult, eventsResult, requestsResult] = await Promise.all([
    supabase
      .from("catches")
      .select(`
        id,
        weight,
        line_class,
        released,
        tagged,
        status,
        points_awarded,
        catch_datetime,
        species(name),
        events(start_date,end_date)
      `)
      .gte("catch_datetime", seasonStart)
      .lt("catch_datetime", seasonEnd),
    supabase
      .from("events")
      .select("id,name,start_date,end_date,status,is_tournament")
      .lte("start_date", seasonEndDate)
      .gte("end_date", seasonStartDate)
      .order("start_date"),
    supabase.rpc("admin_get_boat_profile_requests", { p_id: null }),
  ]);

  const catches = catchesResult.data || [];
  const events = eventsResult.data || [];
  const requests = requestsResult.data || [];
  const pendingCatches = catches.filter(
    (catchRecord: any) => (catchRecord.status || "approved") === "pending",
  ).length;
  const scoringExceptions = catches.filter((catchRecord: any) => {
    const expected = calculateCatchPoints({
      speciesName: catchRecord.species?.name || "",
      weight:
        catchRecord.weight === null ? null : Number(catchRecord.weight),
      lineClass: Number(catchRecord.line_class || 130),
      released: Boolean(catchRecord.released),
      tagged: Boolean(catchRecord.tagged),
    });
    const scoreMatches =
      Math.abs(Number(catchRecord.points_awarded || 0) - expected) < 0.01;
    const eventDateMatches = isCatchWithinEventDates(
      catchRecord.catch_datetime,
      catchRecord.events?.start_date,
      catchRecord.events?.end_date,
    );

    return !scoreMatches || !eventDateMatches;
  }).length;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
  const upcomingEvents = events.filter(
    (event: any) =>
      event.end_date >= today &&
      (event.status || "scheduled").toLowerCase() !== "cancelled",
  ).length;
  const pastOpenEvents = events.filter((event: any) => {
    const status = (event.status || "scheduled").toLowerCase();
    return (
      event.end_date < today &&
      !["cancelled", "completed", "locked"].includes(status)
    );
  }).length;
  const pendingRequests = requests.filter((request: any) =>
    isUnresolvedRequest(request.status),
  ).length;
  const hasQueryError = Boolean(
    catchesResult.error || eventsResult.error || requestsResult.error,
  );
  const attentionChecks =
    pendingCatches + scoringExceptions + pastOpenEvents + pendingRequests;
  const readinessLabel = hasQueryError
    ? "Data check needed"
    : attentionChecks === 0
      ? "Ready for review"
      : `${attentionChecks} operational check${attentionChecks === 1 ? "" : "s"} need attention`;

  return (
    <main className="panel dashboard-page">
      <p className="eyebrow">{year} season operations</p>
      <h1>Admin Command Center</h1>
      <p className="portal-intro">
        Review current work, resolve exceptions, and keep published results
        reliable from one place.
      </p>

      {hasQueryError ? (
        <p className="alert alert-danger">
          Some dashboard totals could not be loaded. Open the related tool
          below before relying on the readiness summary.
        </p>
      ) : null}

      <div className="kpi-grid" style={{ marginTop: "24px" }}>
        <Link className="stat-card" href="/admin/catches">
          <h3>Pending catches</h3>
          <div className="stat-card-value">{pendingCatches}</div>
        </Link>
        <Link className="stat-card" href="/admin/scoring-audit">
          <h3>Scoring exceptions</h3>
          <div className="stat-card-value">{scoringExceptions}</div>
        </Link>
        <Link className="stat-card" href="/admin/events">
          <h3>Upcoming events</h3>
          <div className="stat-card-value">{upcomingEvents}</div>
        </Link>
        <Link className="stat-card" href="/admin/boat-profile-requests">
          <h3>Profile requests</h3>
          <div className="stat-card-value">{pendingRequests}</div>
        </Link>
      </div>

      <section className="feature-card" style={{ marginTop: "18px" }}>
        <h2>Season readiness</h2>
        <p><strong>{readinessLabel}</strong></p>
        <ul>
          {pendingCatches > 0 ? (
            <li><Link href="/admin/catches">Review {pendingCatches} pending catch{pendingCatches === 1 ? "" : "es"}</Link></li>
          ) : null}
          {scoringExceptions > 0 ? (
            <li><Link href="/admin/scoring-audit">Resolve {scoringExceptions} scoring or event-date exception{scoringExceptions === 1 ? "" : "s"}</Link></li>
          ) : null}
          {pastOpenEvents > 0 ? (
            <li><Link href="/admin/events">Update {pastOpenEvents} past event status{pastOpenEvents === 1 ? "" : "es"}</Link></li>
          ) : null}
          {pendingRequests > 0 ? (
            <li><Link href="/admin/boat-profile-requests">Review {pendingRequests} boat profile request{pendingRequests === 1 ? "" : "s"}</Link></li>
          ) : null}
          {!hasQueryError && attentionChecks === 0 ? (
            <li>No unresolved operational items were found.</li>
          ) : null}
        </ul>
      </section>

      <div className="portal-actions admin-quick-actions">
        <Link href="/admin/catch-entry" className="btn">+ Add Catch</Link>
        <Link href="/admin/catches" className="btn btn-ghost">Review Catches</Link>
        <Link href="/admin/events" className="btn btn-ghost">Manage Schedule</Link>
        <Link href="/admin/scoring-audit" className="btn btn-ghost">Run Audit</Link>
      </div>

      <h2>Project Review</h2>
      <p>
        <Link href="/admin/review-guide">Open the club evaluation walkthrough</Link>
      </p>

      <h2>Catches, Events, and Directory</h2>
      <ul>
        <li><Link href="/admin/catch-entry">Add Catch</Link></li>
        <li><Link href="/admin/catches">Manage Catches</Link></li>
        <li><Link href="/admin/boats">Manage Boats</Link></li>
        <li><Link href="/admin/anglers">Manage Anglers</Link></li>
        <li><Link href="/admin/events">Manage Events</Link></li>
      </ul>

      <h2>Scoring and Season Closeout</h2>
      <ul>
        <li><Link href="/admin/scoring-audit">Scoring Audit</Link></li>
        <li><Link href="/admin/recalculate-scores">Recalculate Scores</Link></li>
        <li><Link href="/admin/season-champions">Season Champions</Link></li>
        <li>
          <Link href="/admin/season-champions/generate">
            Generate Season Awards
          </Link>
        </li>
      </ul>

      <h2>Awards and Historical Data</h2>
      <ul>
        <li><Link href="/admin/awards">Manage Angler Awards</Link></li>
        <li><Link href="/admin/boat-awards">Manage Boat Awards</Link></li>
        <li>
          <Link href="/admin/historical-standings">
            Manage Historical Standings
          </Link>
        </li>
      </ul>

      <h2>Membership and Requests</h2>
      <ul>
        <li>
          <Link href="/admin/boat-profile-requests">
            Boat Profile Requests
          </Link>
        </li>
        <li><Link href="/admin/invites">Invite Members</Link></li>
        <li><Link href="/admin/members">Manage Members</Link></li>
      </ul>
    </main>
  );
}
