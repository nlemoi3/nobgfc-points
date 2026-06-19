import Link from "next/link";

export default function AdminPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
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
</ul>
<p>
  <Link href="/admin/season-champions/generate">
    Generate Season Awards
  </Link>
</p>

<p>
  <Link href="/admin/awards">
    Manage Angler Awards
  </Link>
</p>

<p>
  <Link href="/admin/boat-awards">
    Manage Boat Awards
  </Link>
</p>

<p>
  <Link href="/admin/season-champions/generate">
    Generate Season Awards
  </Link>
</p>
    </main>
  );
}