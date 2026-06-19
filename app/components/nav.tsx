import type { ReactNode } from "react";
import Link from "next/link";

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details style={{ display: "inline-block", marginRight: "18px" }}>
      <summary
        style={{
          cursor: "pointer",
          fontWeight: "bold",
          display: "inline",
        }}
      >
        {title}
      </summary>

      <div
        style={{
          position: "absolute",
          background: "white",
          border: "1px solid #ccc",
          padding: "10px",
          zIndex: 1000,
          minWidth: "220px",
          lineHeight: "1.8",
        }}
      >
        {children}
      </div>
    </details>
  );
}

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

      <Link href="/dashboard" style={{ marginRight: "20px" }}>
        Dashboard
      </Link>

      <NavGroup title="Competition">
        <div><Link href="/standings">Raw Standings</Link></div>
        <div><Link href="/official-standings">Official Boats</Link></div>
        <div><Link href="/official-angler-standings">Official Anglers</Link></div>
        <div><Link href="/official-youth-standings">Youth Standings</Link></div>
        <div><Link href="/tournament-standings">Tournaments</Link></div>
      </NavGroup>

      <NavGroup title="Directory">
        <div><Link href="/boats">Boats</Link></div>
        <div><Link href="/anglers">Anglers</Link></div>
      </NavGroup>

      <NavGroup title="History">
        <div><Link href="/hall-of-fame">Hall of Fame</Link></div>
        <div><Link href="/champions">Hall of Champions</Link></div>
        <div><Link href="/historical-standings">Historical Standings</Link></div>
        <div><Link href="/awards">Awards</Link></div>
      </NavGroup>

      <NavGroup title="Records">
        <div><Link href="/records">Club Records</Link></div>
        <div><Link href="/record-progressions">Record Progressions</Link></div>
        <div><Link href="/stats">Club Statistics</Link></div>
      </NavGroup>

      <NavGroup title="Media">
        <div><Link href="/gallery">Photo Gallery</Link></div>
      </NavGroup>

      <NavGroup title="Admin">
        <div><Link href="/admin/catch-entry">Enter Catch</Link></div>
        <div><Link href="/admin/boats">Manage Boats</Link></div>
        <div><Link href="/admin/anglers">Manage Anglers</Link></div>
        <div><Link href="/admin/events">Manage Events</Link></div>
        <div><Link href="/admin/catches">Manage Catches</Link></div>
        <div><Link href="/admin/scoring-audit">Scoring Audit</Link></div>
        <div><Link href="/admin/recalculate-scores">Recalculate Scores</Link></div>
        <div><Link href="/admin/records-review">Records Review</Link></div>
        <div><Link href="/admin/historical-standings">Historical Standings Admin</Link></div>
        <div><Link href="/admin/season-champions">Season Champions</Link></div>
      </NavGroup>
    </nav>
  );
}