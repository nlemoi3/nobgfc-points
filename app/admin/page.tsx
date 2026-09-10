import Link from "next/link";
import { requireRole } from "../../lib/auth";

export default async function AdminPage() {
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

  return (
    <main className="panel">
      <h1>NOBGFC Admin</h1>

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
