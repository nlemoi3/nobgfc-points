import Link from "next/link";
import { requireRole } from "../../../lib/auth";

const REVIEW_STEPS = [
  {
    title: "1. Review the season schedule",
    description:
      "Confirm that tournaments and other club events are clearly separated, dated, and easy to maintain.",
    href: "/admin/events",
    link: "Manage events",
  },
  {
    title: "2. Walk through catch entry",
    description:
      "Enter a catch using its actual catch date. The system selects eligible tournaments and applies rule validation before saving.",
    href: "/admin/catch-entry",
    link: "Enter a catch",
  },
  {
    title: "3. Review and approve catches",
    description:
      "Inspect pending records, correct details, and approve or reject them without relying on a photo as proof.",
    href: "/admin/catches",
    link: "Manage catches",
  },
  {
    title: "4. Validate scoring",
    description:
      "Use the audit to find rule violations, event-date mismatches, and records needing human review before results are published.",
    href: "/admin/scoring-audit",
    link: "Run the scoring audit",
  },
  {
    title: "5. Check published results",
    description:
      "Compare the public boat, angler, youth, and tournament views with the approved source records.",
    href: "/official-standings",
    link: "View boat standings",
  },
  {
    title: "6. Close the season",
    description:
      "Recalculate after approved corrections, lock completed events, and generate season awards only after reconciliation.",
    href: "/admin/season-champions",
    link: "Review season champions",
  },
];

export default async function ReviewGuidePage() {
  await requireRole("admin");

  return (
    <main className="panel">
      <p><Link href="/admin">← Back to Admin</Link></p>
      <p className="eyebrow">Club evaluation</p>
      <h1>NOBGFC Competition Portal Review Guide</h1>
      <p className="portal-intro">
        This working proposal demonstrates a possible member competition portal.
        It is not an official club system until NOBGFC leadership reviews and
        approves it.
      </p>

      <div className="portal-grid">
        {REVIEW_STEPS.map((step) => (
          <section className="feature-card" key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
            <Link href={step.href}>{step.link} →</Link>
          </section>
        ))}
      </div>

      <section style={{ marginTop: "28px" }}>
        <h2>What leadership is being asked to evaluate</h2>
        <ul>
          <li>Whether the rule implementation matches current club policy.</li>
          <li>Whether member, weighmaster, and administrator roles are appropriate.</li>
          <li>Whether catch review and correction provide enough oversight.</li>
          <li>Whether standings and tournament results are clear on a phone.</li>
          <li>Whether the portal should be incorporated into the club website.</li>
        </ul>
      </section>

      <section style={{ marginTop: "28px" }}>
        <h2>Deliberately outside this proposal</h2>
        <ul>
          <li>Membership applications, dues, and payment processing.</li>
          <li>Replacing the club&apos;s public website or controlling its domain.</li>
          <li>Declaring historical or current results official without reconciliation.</li>
        </ul>
      </section>
    </main>
  );
}
