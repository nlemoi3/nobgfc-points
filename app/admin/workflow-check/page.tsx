import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminUsers } from "../../../lib/admin-users";
import { requireRole } from "../../../lib/auth";
import { getCatchChecks } from "../../../lib/reconciliation";
import { ROLE_CAPABILITIES } from "../../../lib/role-access";
import { getActiveSeasonRange } from "../../../lib/season";
import { createClient } from "../../../lib/supabase/server";

const ROLES = ["member", "boat", "weighmaster", "admin"] as const;

export default async function WorkflowCheckPage() {
  noStore();
  await requireRole("admin");

  const supabase = await createClient();
  const { year, start, end } = await getActiveSeasonRange(supabase);
  const [{ users, error: usersError }, catchesResult, eventsResult, auditResult] =
    await Promise.all([
      getAdminUsers(),
      supabase
        .from("catches")
        .select(
          "id,status,weight,line_class,released,tagged,points_awarded,catch_datetime,created_at,species(name),events(start_date,end_date,status)",
        )
        .gte("catch_datetime", start)
        .lt("catch_datetime", end),
      supabase
        .from("events")
        .select("id,status")
        .gte("end_date", `${year}-01-01`)
        .lte("start_date", `${year}-12-31`),
      supabase
        .from("catch_audit_log")
        .select("id", { count: "exact", head: true }),
    ]);

  const catches = catchesResult.data || [];
  const events = eventsResult.data || [];
  const pending = catches.filter(
    (catchRecord: any) => (catchRecord.status || "approved") === "pending",
  ).length;
  const approved = catches.filter(
    (catchRecord: any) => (catchRecord.status || "approved") === "approved",
  ).length;
  const reviewed = catches.filter((catchRecord: any) =>
    ["approved", "rejected"].includes(catchRecord.status || "approved"),
  ).length;
  const exceptions = catches.filter(
    (catchRecord: any) => getCatchChecks(catchRecord).hasException,
  ).length;
  const lateWarnings = catches.filter(
    (catchRecord: any) => getCatchChecks(catchRecord).submissionTiming.isLate,
  ).length;
  const lockedEvents = events.filter(
    (event: any) => event.status === "locked",
  ).length;
  const roleCounts = Object.fromEntries(
    ROLES.map((role) => [
      role,
      users.filter((user) => user.role === role).length,
    ]),
  );
  const hasError = Boolean(
    usersError || catchesResult.error || eventsResult.error || auditResult.error,
  );

  return (
    <main className="panel">
      <p>
        <Link href="/admin">← Back to Admin</Link>
      </p>
      <p className="eyebrow">{year} operating model</p>
      <h1>Role Workflow Check</h1>
      <p className="portal-intro">
        A read-only verification of access assignments and live workflow
        evidence. No catch, account, or event data is changed here.
      </p>

      {hasError ? (
        <p className="alert alert-danger">
          One or more verification queries failed. Review the live tools before
          treating this checklist as complete.
        </p>
      ) : null}

      <h2>Access matrix</h2>
      <p>
        During the pilot, member and boat accounts are read-only. Weighmasters
        and administrators can enter and review competition data; only
        administrators can change configuration and access assignments.
      </p>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Capability</th>
              {ROLES.map((role) => (
                <th key={role}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_CAPABILITIES.map((row) => (
              <tr key={row.capability}>
                <td>{row.capability}</td>
                {ROLES.map((role) => (
                  <td key={role}>{row[role] ? "Allowed" : "No access"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Configured accounts</h2>
      <div className="kpi-grid">
        {ROLES.map((role) => (
          <section className="stat-card" key={role}>
            <h3>{role} accounts</h3>
            <div className="stat-card-value">{roleCounts[role]}</div>
          </section>
        ))}
      </div>

      <h2>Live workflow evidence</h2>
      <div className="kpi-grid">
        <section className="stat-card">
          <h3>Pending catches</h3>
          <div className="stat-card-value">{pending}</div>
        </section>
        <section className="stat-card">
          <h3>Reviewed catches</h3>
          <div className="stat-card-value">{reviewed}</div>
        </section>
        <section className="stat-card">
          <h3>Approved catches</h3>
          <div className="stat-card-value">{approved}</div>
        </section>
        <section className="stat-card">
          <h3>Scoring exceptions</h3>
          <div className="stat-card-value">{exceptions}</div>
        </section>
        <section className="stat-card">
          <h3>Late-entry warnings</h3>
          <div className="stat-card-value">{lateWarnings}</div>
        </section>
        <section className="stat-card">
          <h3>Locked events</h3>
          <div className="stat-card-value">{lockedEvents}</div>
        </section>
        <section className="stat-card">
          <h3>Audit entries</h3>
          <div className="stat-card-value">{auditResult.count || 0}</div>
        </section>
      </div>

      <div className="portal-actions">
        <Link href="/admin/catches" className="btn btn-ghost">
          Review Catches
        </Link>
        <Link href="/admin/audit-log" className="btn btn-ghost">
          View Audit History
        </Link>
        <Link href="/admin/exports" className="btn btn-ghost">
          Download Exports
        </Link>
      </div>
    </main>
  );
}
