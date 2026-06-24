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

      <h2>Catch Management</h2>
      <ul>
        <li><Link href="/admin/catches">Manage Catches</Link></li>
        <li><Link href="/admin/boats">Manage Boats</Link></li>
        <li><Link href="/admin/anglers">Manage Anglers</Link></li>
        <li><Link href="/admin/events">Manage Events</Link></li>
      </ul>

      <h2>Awards</h2>
      <ul>
        <li><Link href="/admin/awards">Angler Awards</Link></li>
        <li><Link href="/admin/boat-awards">Boat Awards</Link></li>
      </ul>

      <h2>Requests</h2>
      <ul>
        <li>
          <Link href="/admin/boat-profile-requests">
            Boat Profile Requests
          </Link>
        </li>
        <li><Link href="/admin/invites">Invite Members</Link></li>
        <li><Link href="/admin/members">Manage Members</Link></li>
      </ul>
      <h2>Scoring Tools</h2>
<ul>
  <li><Link href="/admin/scoring-audit">Scoring Audit</Link></li>
  <li><Link href="/admin/recalculate-scores">Recalculate Scores</Link></li>
  <li>
  <Link href="/admin/season-champions">
    Season Champions
  </Link>
</li>
<li>
  <Link href="/admin/season-champions/generate">
    Generate Season Awards
  </Link>
</li>
</ul>
<h2>History</h2>
<ul>
  <li><Link href="/admin/historical-standings">Historical Standings</Link></li>
  <li><Link href="/admin/season-champions">Season Champions</Link></li>
  <li><Link href="/admin/season-champions/generate">Generate Season Awards</Link></li>
  <li><Link href="/champions">Hall of Champions</Link></li>
  <li><Link href="/historical-standings">Historical Boat Standings</Link></li>
  <li><Link href="/admin/boat-awards">Boat Awards</Link></li>
  <li><Link href="/admin/awards">Angler Awards</Link></li>
</ul>
    </main>
  );
}