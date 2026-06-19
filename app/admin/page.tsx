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
    </main>
  );
}