import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>NOBGFC Standings</h1>
      <p>Tournament scoring and standings system.</p>

      <h2>Pages</h2>
      <ul>
        <li><Link href="/boats">Boats</Link></li>
        <li>Anglers - coming next</li>
        <li>Events - coming next</li>
        <li>Historical Rankings - coming next</li>
        <li>Standings - coming next</li>
        <li><Link href="/rosters">Rosters</Link></li>
        <li><Link href="/catches">Catches</Link></li>
      </ul>
    </main>
  );
}