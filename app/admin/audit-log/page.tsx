import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

export default async function CatchAuditLogPage() {
  noStore();
  await requireRole("weighmaster");

  const supabase = await createClient();
  const { data: auditRows, error } = await supabase
    .from("catch_audit_log")
    .select(
      "id,catch_id,action,actor_email,actor_role,changed_fields,occurred_at",
    )
    .order("occurred_at", { ascending: false })
    .limit(500);

  const catchIds = Array.from(
    new Set((auditRows || []).map((row: any) => Number(row.catch_id))),
  );
  const { data: catches } = catchIds.length
    ? await supabase
        .from("catches")
        .select("id,boats(name),anglers(first_name,last_name),species(name)")
        .in("id", catchIds)
    : { data: [] };
  const catchById = new Map(
    (catches || []).map((catchRecord: any) => [catchRecord.id, catchRecord]),
  );

  return (
    <main className="panel">
      <p>
        <Link href="/admin">← Back to Admin</Link>
      </p>
      <p className="eyebrow">Accountability</p>
      <h1>Catch Audit History</h1>
      <p className="portal-intro">
        An append-only record of submissions, edits, review decisions,
        recalculations, and deletions. The newest activity appears first.
      </p>

      <p className="alert alert-warning">
        Deleted catches are removed from standings immediately, but their last
        complete record remains here. An administrator can use that snapshot
        to reconstruct a catch if one was deleted by mistake.
      </p>

      {error ? (
        <p className="alert alert-danger">
          Audit history could not be loaded: {error.message}
        </p>
      ) : null}

      <div className="table-wrap mobile-card-wrap" style={{ marginTop: "24px" }}>
        <table className="admin-table mobile-card-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Catch</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Changed fields</th>
            </tr>
          </thead>
          <tbody>
            {(auditRows || []).map((row: any) => {
              const catchRecord = catchById.get(Number(row.catch_id)) as any;
              const catchLabel = catchRecord
                ? [
                    catchRecord.species?.name,
                    catchRecord.anglers
                      ? `${catchRecord.anglers.first_name} ${catchRecord.anglers.last_name}`
                      : null,
                    catchRecord.boats?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : `Deleted catch #${row.catch_id}`;

              return (
                <tr key={row.id}>
                  <td data-label="When">{formatAuditDate(row.occurred_at)}</td>
                  <td data-label="Action">
                    <span className={`status-chip status-${row.action}`}>
                      {row.action}
                    </span>
                  </td>
                  <td data-label="Catch">
                    {catchRecord ? (
                      <Link href={`/admin/catches/${row.catch_id}`}>
                        {catchLabel}
                      </Link>
                    ) : (
                      catchLabel
                    )}
                  </td>
                  <td data-label="Actor">{row.actor_email || "System baseline"}</td>
                  <td data-label="Role">{row.actor_role || "—"}</td>
                  <td data-label="Changed Fields">{(row.changed_fields || []).join(", ") || "—"}</td>
                </tr>
              );
            })}
            {!error && (auditRows || []).length === 0 ? (
              <tr>
                <td colSpan={6}>No catch activity has been recorded yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {(auditRows || []).length === 500 ? (
        <p className="help-text">
          Showing the 500 most recent entries. CSV catch exports remain
          available for independent season reconciliation.
        </p>
      ) : null}
    </main>
  );
}
