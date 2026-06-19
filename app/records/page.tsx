import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function RecordCard({
  title,
  catchRecord,
}: {
  title: string;
  catchRecord: any;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "260px" }}>
      <h3>{title}</h3>

      {catchRecord ? (
        <>
          {catchRecord.photo_url && (
            <img
              src={catchRecord.photo_url}
              alt={title}
              style={{ maxWidth: "220px", display: "block", marginBottom: "10px" }}
            />
          )}

          <p><strong>{catchRecord.weight} lbs</strong></p>

          <p>{catchRecord.anglers?.first_name} {catchRecord.anglers?.last_name}</p>

          <p>
            {catchRecord.boats?.id ? (
              <Link href={`/boats/${catchRecord.boats.id}`}>
                {catchRecord.boats?.name}
              </Link>
            ) : (
              catchRecord.boats?.name
            )}
          </p>

          <p>{catchRecord.events?.name}</p>
          <p>{formatDate(catchRecord.catch_datetime)}</p>
        </>
      ) : (
        <p>No record</p>
      )}
    </div>
  );
}

function CountCard({
  title,
  name,
  count,
}: {
  title: string;
  name?: string;
  count?: number;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "260px" }}>
      <h3>{title}</h3>

      {name && count !== undefined ? (
        <>
          <p><strong>{name}</strong></p>
          <p>{count}</p>
        </>
      ) : (
        <p>No record</p>
      )}
    </div>
  );
}

export default async function RecordsPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      released,
      tagged,
      catch_datetime,
      photo_url,
      boats(id,name),
      anglers(first_name,last_name),
      species(name),
      events(name)
    `)
    .eq("status", "approved");

  const largestBySpecies = (speciesNames: string[]) =>
    catches
      ?.filter((c: any) => speciesNames.includes(c.species?.name) && c.weight)
      .sort((a: any, b: any) => Number(b.weight) - Number(a.weight))[0];

  const highestPointCatch = [...(catches || [])]
    .sort(
      (a: any, b: any) =>
        Number(b.points_awarded || 0) - Number(a.points_awarded || 0)
    )[0];

  const blueMarlinReleaseCounts: Record<string, number> = {};
  const whiteMarlinReleaseCounts: Record<string, number> = {};
  const sailfishReleaseCounts: Record<string, number> = {};

  catches?.forEach((c: any) => {
    const boatName = c.boats?.name || "Unknown Boat";
    const speciesName = c.species?.name;

    if (!c.released) return;

    if (speciesName === "Blue Marlin") {
      blueMarlinReleaseCounts[boatName] =
        (blueMarlinReleaseCounts[boatName] || 0) + 1;
    }

    if (speciesName === "White Marlin") {
      whiteMarlinReleaseCounts[boatName] =
        (whiteMarlinReleaseCounts[boatName] || 0) + 1;
    }

    if (speciesName === "Sailfish") {
      sailfishReleaseCounts[boatName] =
        (sailfishReleaseCounts[boatName] || 0) + 1;
    }
  });

  const topBlueRelease = Object.entries(blueMarlinReleaseCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const topWhiteRelease = Object.entries(whiteMarlinReleaseCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const topSailfishRelease = Object.entries(sailfishReleaseCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Club Records</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <h2>Largest Fish</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <RecordCard title="Largest Blue Marlin" catchRecord={largestBySpecies(["Blue Marlin"])} />
        <RecordCard title="Largest White Marlin" catchRecord={largestBySpecies(["White Marlin"])} />
        <RecordCard title="Largest Swordfish" catchRecord={largestBySpecies(["Swordfish"])} />
        <RecordCard title="Largest Tuna" catchRecord={largestBySpecies(["Yellowfin Tuna", "Bigeye Tuna"])} />
        <RecordCard title="Largest Wahoo" catchRecord={largestBySpecies(["Wahoo"])} />
        <RecordCard title="Largest Dolphin" catchRecord={largestBySpecies(["Dolphin"])} />
      </div>

      <h2>Point Records</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <RecordCard title="Highest Point Catch" catchRecord={highestPointCatch} />
      </div>

      <h2>Release Records by Boat</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <CountCard
          title="Most Blue Marlin Releases"
          name={topBlueRelease?.[0]}
          count={topBlueRelease?.[1]}
        />

        <CountCard
          title="Most White Marlin Releases"
          name={topWhiteRelease?.[0]}
          count={topWhiteRelease?.[1]}
        />

        <CountCard
          title="Most Sailfish Releases"
          name={topSailfishRelease?.[0]}
          count={topSailfishRelease?.[1]}
        />
      </div>
    </main>
  );
}