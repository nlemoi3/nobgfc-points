import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "../lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="panel portal-home">
      <section className="portal-hero">
        <Image
          src="/nobgfc-logo.png"
          alt="New Orleans Big Game Fishing Club"
          width={132}
          height={132}
          priority
          className="portal-hero-logo"
        />

        <div>
          <p className="portal-eyebrow">Member &amp; Competition Portal</p>
          <h1>New Orleans Big Game Fishing Club</h1>
          <p className="portal-intro">
            Follow the season, review official standings, and access club
            competition tools in one place.
          </p>

          <div className="portal-actions">
            <Link href="/dashboard" className="btn">
              View Season Dashboard
            </Link>
            <Link href="/events" className="btn btn-ghost">
              Event Schedule
            </Link>
            <Link href={user ? "/account" : "/login"} className="btn btn-ghost">
              {user ? "My Account" : "Club Member Sign In"}
            </Link>
          </div>
        </div>
      </section>

      <section className="portal-grid" aria-label="Portal sections">
        <article className="feature-card">
          <h2>Competition</h2>
          <p>Official boat, angler, youth, and tournament standings.</p>
          <Link href="/official-standings">View official standings</Link>
        </article>

        <article className="feature-card">
          <h2>Club Directory</h2>
          <p>Explore participating boats and anglers.</p>
          <Link href="/boats">Browse the directory</Link>
        </article>

        <article className="feature-card">
          <h2>History &amp; Records</h2>
          <p>Past champions, historical standings, awards, and club records.</p>
          <Link href="/champions">Explore club history</Link>
        </article>
      </section>
    </main>
  );
}
