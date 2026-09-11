import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { createSeasonWorkspace } from "./actions";

type SetupStep = {
  title: string;
  detail: string;
  complete: boolean;
  href: string;
  action: string;
};

export default async function SeasonSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireRole("admin");
  noStore();

  const { created, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const [seasonsResult, boatsResult, anglersResult] = await Promise.all([
    supabase.rpc("admin_get_seasons"),
    supabase.rpc("admin_get_boats", { p_id: null }),
    supabase.rpc("admin_get_anglers", { p_id: null }),
  ]);

  const seasons = Array.isArray(seasonsResult.data) ? seasonsResult.data : [];
  const activeSeason = seasons.find((season: any) => season.active);
  const activeYear = Number(activeSeason?.year || new Date().getUTCFullYear());
  const setupYear = activeYear + 1;
  const seasonExists = seasons.some(
    (season: any) => Number(season.year) === setupYear,
  );
  const startDate = `${setupYear}-01-01`;
  const endDate = `${setupYear}-12-31`;
  const eventsResult = await supabase
    .from("events")
    .select("id,name,start_date,end_date,status")
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .order("start_date");

  const events = eventsResult.data || [];
  const boats = Array.isArray(boatsResult.data) ? boatsResult.data : [];
  const anglers = Array.isArray(anglersResult.data) ? anglersResult.data : [];
  const activeBoats = boats.filter((boat: any) => boat.active !== false).length;
  const activeAnglers = anglers.filter(
    (angler: any) => angler.active !== false,
  ).length;
  const hasLoadError = Boolean(
    seasonsResult.error ||
      boatsResult.error ||
      anglersResult.error ||
      eventsResult.error,
  );

  const steps: SetupStep[] = [
    {
      title: "Create the season workspace",
      detail: seasonExists
        ? `${setupYear} exists and can be prepared without making it the active public season.`
        : `Create an inactive ${setupYear} record. The current season remains live.`,
      complete: seasonExists,
      href: "#create-season",
      action: "Create workspace",
    },
    {
      title: "Enter the club schedule",
      detail:
        events.length > 0
          ? `${events.length} event${events.length === 1 ? " is" : "s are"} entered for ${setupYear}.`
          : "Dates are not available yet. This step can safely remain open.",
      complete: events.length > 0,
      href: "/admin/events/new",
      action: "Add an event",
    },
    {
      title: "Confirm boats and anglers",
      detail: `${activeBoats} active boat${activeBoats === 1 ? "" : "s"} and ${activeAnglers} active angler${activeAnglers === 1 ? "" : "s"} are available to carry forward.`,
      complete: activeBoats > 0 && activeAnglers > 0,
      href: "/admin/boats",
      action: "Review directory",
    },
    {
      title: "Validate scoring rules",
      detail:
        "Run the rules audit after representative test catches are entered and before standings are published.",
      complete: false,
      href: "/admin/scoring-audit",
      action: "Open scoring audit",
    },
    {
      title: "Complete the operational walkthrough",
      detail:
        "Test member entry, weighmaster review, approval, correction, event locking, and published standings.",
      complete: false,
      href: "/admin/review-guide",
      action: "Open walkthrough",
    },
  ];
  const completedSteps = steps.filter((step) => step.complete).length;

  return (
    <main className="panel season-setup-page">
      <p className="eyebrow">Plan ahead without publishing early</p>
      <h1>{setupYear} Season Setup</h1>
      <p className="portal-intro">
        Prepare the next season in stages. Schedule dates can remain pending
        until the club confirms them.
      </p>

      {created ? (
        <p className="alert alert-success">
          The {setupYear} workspace is ready. The active season was not changed.
        </p>
      ) : null}
      {errorCode ? (
        <p className="alert alert-danger">
          The season workspace could not be created. Please try again or review
          the database connection.
        </p>
      ) : null}
      {hasLoadError ? (
        <p className="alert alert-danger">
          Some setup information could not be loaded. Do not treat this
          checklist as complete until the counts return.
        </p>
      ) : null}

      <section className="setup-progress" aria-label="Season setup progress">
        <div>
          <strong>{completedSteps} of {steps.length} steps ready</strong>
          <span>The active {activeYear} season remains unchanged.</span>
        </div>
        <progress max={steps.length} value={completedSteps}>
          {completedSteps} of {steps.length}
        </progress>
      </section>

      <div className="setup-step-list">
        {steps.map((step, index) => (
          <article className={`setup-step ${step.complete ? "setup-step-complete" : ""}`} key={step.title}>
            <span className="setup-step-number" aria-hidden="true">
              {step.complete ? "✓" : index + 1}
            </span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.detail}</p>
              {index === 0 && !seasonExists ? (
                <form action={createSeasonWorkspace} id="create-season">
                  <input type="hidden" name="year" value={setupYear} />
                  <button className="btn" type="submit">Create {setupYear} workspace</button>
                </form>
              ) : index === 0 ? null : (
                <Link className="text-action" href={step.href}>{step.action} →</Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="portal-actions">
        <Link className="btn btn-ghost" href="/admin">Back to Admin</Link>
        <Link className="btn btn-ghost" href="/events">View public schedule</Link>
      </div>
    </main>
  );
}
