import Link from "next/link";

export default function Nav() {
  return (
    <nav
      style={{
        padding: "15px 40px",
        borderBottom: "1px solid #ddd",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <strong style={{ marginRight: "25px" }}>NOBGFC</strong>

      <Link href="/dashboard" style={{ marginRight: "15px" }}>Dashboard</Link>
      <Link href="/catches" style={{ marginRight: "15px" }}>Catches</Link>
      <Link href="/standings" style={{ marginRight: "15px" }}>Raw Standings</Link>
      <Link href="/official-standings" style={{ marginRight: "15px" }}>Official Boats</Link>
      <Link href="/official-angler-standings" style={{ marginRight: "15px" }}>Official Anglers</Link>
      <Link href="/tournament-standings" style={{ marginRight: "15px" }}>Tournaments</Link>
      <Link href="/awards" style={{ marginRight: "15px" }}>Awards</Link>

      <span style={{ marginLeft: "25px", marginRight: "10px" }}>| Admin:</span>
      <Link href="/admin/catch-entry" style={{ marginRight: "15px" }}>Enter Catch</Link>
      <Link href="/boats" style={{ marginRight: "15px" }}>Boats</Link>
      <Link href="/anglers" style={{ marginRight: "15px" }}>Anglers</Link>
      <Link href="/admin/events" style={{ marginRight: "15px" }}>Events</Link>
      <Link href="/admin/catches" style={{ marginRight: "15px" }}>Manage Catches</Link>
    </nav>
  );
}