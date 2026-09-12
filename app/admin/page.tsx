import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../lib/auth";
import { getCatchChecks } from "../../lib/reconciliation";
import { getActiveSeasonRange } from "../../lib/season";
import { createClient } from "../../lib/supabase/server";

function isUnresolvedRequest(status: string | null) {
  return !["approved", "rejected", "closed"].includes(
    (status || "new").toLowerCase(),
  );
}

function formatAdminDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(value));
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
        created_at,
        boats(name),
        anglers(first_name,last_name),
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
  const scoringExceptions = catches.filter(
    (catchRecord: any) => getCatchChecks(catchRecord).hasException,
  ).length;
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

  const readinessItems = [
    {
      count: scoringExceptions,
      href: "/admin/scoring-audit",
      label: `${scoringExceptions} scoring or event-date exception${scoringExceptions === 1 ? "" : "s"}`,
      action: "Resolve",
      tone: "danger",
    },
    {
      count: pendingCatches,
      href: "/admin/catches",
      label: `${pendingCatches} pending catch${pendingCatches === 1 ? "" : "es"}`,
      action: "Review",
      tone: "warning",
    },
    {
      count: pastOpenEvents,
      href: "/admin/events",
      label: `${pastOpenEvents} past event status${pastOpenEvents === 1 ? "" : "es"}`,
      action: "Update",
      tone: "warning",
    },
    {
      count: pendingRequests,
      href: "/admin/boat-profile-requests",
      label: `${pendingRequests} boat profile request${pendingRequests === 1 ? "" : "s"}`,
      action: "Review",
      tone: "info",
    },
  ].filter((item) => item.count > 0);

  const recentOutcomes = catches
    .filter((catchRecord: any) =>
      ["approved", "rejected"].includes(
        (catchRecord.status || "").toLowerCase(),
      ),
    )
    .sort(
      (left: any, right: any) =>
        new Date(right.created_at || 0).getTime() -
        new Date(left.created_at || 0).getTime(),
    )
    .slice(0, 5);

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

      <div className="kpi-grid admin-kpi-grid">
        <Link className={`stat-card ${pendingCatches > 0 ? "stat-card-warning" : "stat-card-clear"}`} href="/admin/catches">
          <h3>Pending catches</h3>
          <div className="stat-card-value">{pendingCatches}</div>
          <span>{pendingCatches > 0 ? "Needs review" : "Queue is clear"}</span>
        </Link>
        <Link className={`stat-card ${scoringExceptions > 0 ? "stat-card-danger" : "stat-card-clear"}`} href="/admin/scoring-audit">
          <h3>Scoring exceptions</h3>
          <div className="stat-card-value">{scoringExceptions}</div>
          <span>{scoringExceptions > 0 ? "Resolve first" : "No exceptions"}</span>
        </Link>
        <Link className="stat-card stat-card-info" href="/admin/events">
          <h3>Upcoming events</h3>
          <div className="stat-card-value">{upcomingEvents}</div>
          <span>{upcomingEvents > 0 ? "On the schedule" : "No future dates yet"}</span>
        </Link>
        <Link className={`stat-card ${pendingRequests > 0 ? "stat-card-info" : "stat-card-clear"}`} href="/admin/boat-profile-requests">
          <h3>Profile requests</h3>
          <div className="stat-card-value">{pendingRequests}</div>
          <span>{pendingRequests > 0 ? "Awaiting action" : "Queue is clear"}</span>
        </Link>
      </div>

      <section className="feature-card readiness-card">
        <h2>Season readiness</h2>
        <p><strong>{readinessLabel}</strong></p>
        {readinessItems.length > 0 ? (
          <div className="readiness-list">
            {readinessItems.map((item) => (
              <Link className={`readiness-item readiness-${item.tone}`} href={item.href} key={item.href}>
                <span><strong>{item.action}</strong> {item.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">No unresolved operational items were found.</p>
        )}
      </section>

      <div className="portal-actions admin-quick-actions">
        <Link href="/admin/catch-entry" className="btn">+ Add Catch</Link>
        <Link href="/admin/catches" className="btn btn-ghost">Review Catches</Link>
        <Link href="/admin/events" className="btn btn-ghost">Manage Schedule</Link>
        <Link href="/admin/scoring-audit" className="btn btn-ghost">Run Audit</Link>
      </div>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Completed work</p>
            <h2>Recent review outcomes</h2>
          </div>
          <Link href="/admin/catches">View all catches</Link>
        </div>
        {recentOutcomes.length > 0 ? (
          <div className="outcome-list">
            {recentOutcomes.map((catchRecord: any) => (
              <Link href={`/admin/catches/${catchRecord.id}`} className="outcome-row" key={catchRecord.id}>
                <span>
                  <strong>{catchRecord.species?.name || "Catch"}</strong>
                  <small>
                    {catchRecord.anglers
                      ? `${catchRecord.anglers.first_name} ${catchRecord.anglers.last_name}`
                      : "Angler unavailable"}
                    {catchRecord.boats?.name ? ` · ${catchRecord.boats.name}` : ""}
                  </small>
                </span>
                <span className={`status-chip status-${catchRecord.status}`}>
                  {catchRecord.status}
                </span>
                <small>Submitted {formatAdminDate(catchRecord.created_at)}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No completed catch reviews yet.</strong>
            <span>Approved and rejected submissions will appear here.</span>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Everything in one place</p>
            <h2>Admin tools</h2>
          </div>
        </div>
        <div className="admin-tool-grid">
          <article className="admin-tool-card">
            <h3>Season operations</h3>
            <p>Prepare the next season, manage dates, and review the project.</p>
            <Link href="/admin/season-setup">Next-season setup</Link>
            <Link href="/admin/events">Schedule and events</Link>
            <Link href="/admin/review-guide">Club evaluation walkthrough</Link>
          </article>
          <article className="admin-tool-card">
            <h3>People and boats</h3>
            <p>Maintain the club directory, access, and profile requests.</p>
            <Link href="/admin/boats">Boats</Link>
            <Link href="/admin/anglers">Anglers</Link>
            <Link href="/admin/members">Members and roles</Link>
            <Link href="/admin/invites">Invitations</Link>
            <Link href="/admin/boat-profile-requests">Profile requests</Link>
          </article>
          <article className="admin-tool-card">
            <h3>Scoring and closeout</h3>
            <p>Validate results before publishing champions and awards.</p>
            <Link href="/admin/scoring-audit">Scoring audit</Link>
            <Link href="/admin/exports">Reconciliation exports</Link>
            <Link href="/admin/workflow-check">Role workflow check</Link>
            <Link href="/admin/audit-log">Catch audit history</Link>
            <Link href="/admin/recalculate-scores">Recalculate scores</Link>
            <Link href="/admin/season-champions">Season champions</Link>
            <Link href="/admin/season-champions/generate">Generate awards</Link>
          </article>
          <article className="admin-tool-card">
            <h3>Records and history</h3>
            <p>Preserve prior standings, awards, and club records.</p>
            <Link href="/admin/awards">Angler awards</Link>
            <Link href="/admin/boat-awards">Boat awards</Link>
            <Link href="/admin/historical-standings">Historical standings</Link>
            <Link href="/admin/records-review">Records review</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
