import Link from "next/link";
import { requireRole } from "../../../lib/auth";

const EXPORTS = [
  {
    title: "Approved catches",
    description:
      "Every approved catch in the active season, including submission deadlines and late-warning status.",
    href: "/admin/exports/catches",
  },
  {
    title: "Official boat standings",
    description:
      "Ranked active-season boat totals after the club's annual scoring limits are applied.",
    href: "/admin/exports/standings",
  },
  {
    title: "Scoring exceptions",
    description:
      "Score mismatches, event-date mismatches, and late tag/release submissions requiring review.",
    href: "/admin/exports/exceptions",
  },
];

export default async function ReconciliationExportsPage() {
  await requireRole("weighmaster");

  return (
    <main className="panel">
      <p><Link href="/admin">← Back to Admin</Link></p>
      <p className="eyebrow">Independent reconciliation</p>
      <h1>Competition Data Exports</h1>
      <p className="portal-intro">
        Download season-scoped CSV files for spreadsheet review. Exports are
        generated from the current database each time you download them.
      </p>

      <div className="portal-grid">
        {EXPORTS.map((exportItem) => (
          <section className="feature-card" key={exportItem.href}>
            <h2>{exportItem.title}</h2>
            <p>{exportItem.description}</p>
            <a className="btn btn-ghost" href={exportItem.href} download>
              Download CSV
            </a>
          </section>
        ))}
      </div>
    </main>
  );
}
