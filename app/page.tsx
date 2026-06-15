import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "40px" }}>
      <h1>NOBGFC Standings</h1>

      <ul>
        <li>
          <Link href="/boats">Boats</Link>
        </li>
      </ul>
    </main>
  );
}