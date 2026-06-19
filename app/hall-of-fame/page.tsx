import Link from "next/link";
import { supabase } from "../../lib/supabase";

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

function LeaderCard({
  title,
  name,
  value,
  suffix,
  boatId,
}: {
  title: string;
  name: string | undefined;
  value: number | undefined;
  suffix: string;
  boatId?: number;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "260px" }}>
      <h3>{title}</h3>

      {name && value !== undefined ? (
        <>
          <p>
            <strong>
              {boatId ? <Link href={`/boats/${boatId}`}>{name}</Link> : name}
            </strong>
          </p>
          <p>
            {value.toFixed(1)} {suffix}
          </p>
        </>
      ) : (
        <p>No record</p>
      )}
    </div>
  );
}

export default async function HallOfFamePage() {
const { data: catches } = await supabase
  .from("catches")
  .select(`
    id,
    weight,
    points_awarded,
    released,
    tagged,
    status,
    catch_datetime,
    boats(id,name),
    anglers(first_name,last_name),
    species(name),
    events(name)
  `)
  .eq("status", "approved");

  const largestBySpecies = (speciesNames: string[]) =>
    catches
      ?.filter((c: any) => speciesNames.includes(c.species?.name) && c.weight)
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  const blueMarlinCatches =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin") || [];

  const anglerBlueMarlinCounts: Record<string, number> = {};
  const boatBlueMarlinCounts: Record<string, { count: number; id?: number }> = {};

  const boatPoints: Record<string, { points: number; id?: number }> = {};
  const anglerPoints: Record<string, number> = {};

  const boatReleaseCounts: Record<string, { count: number; id?: number }> = {};
  const boatTaggedCounts: Record<string, { count: number; id?: number }> = {};

  catches?.forEach((c: any) => {
    const boatName = c.boats?.name || "Unknown Boat";
    const boatId = c.boats?.id;

    const anglerName =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim() ||
      "Unknown Angler";

    const points = Number(c.points_awarded || 0);

    if (!boatPoints[boatName]) boatPoints[boatName] = { points: 0, id: boatId };
    boatPoints[boatName].points += points;

    anglerPoints[anglerName] = (anglerPoints[anglerName] || 0) + points;

    if (c.released) {
      if (!boatReleaseCounts[boatName]) boatReleaseCounts[boatName] = { count: 0, id: boatId };
      boatReleaseCounts[boatName].count += 1;
    }

    if (c.tagged) {
      if (!boatTaggedCounts[boatName]) boatTaggedCounts[boatName] = { count: 0, id: boatId };
      boatTaggedCounts[boatName].count += 1;
    }
  });

  blueMarlinCatches.forEach((c: any) => {
    const anglerName =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim() ||
      "Unknown Angler";

    const boatName = c.boats?.name || "Unknown Boat";
    const boatId = c.boats?.id;

    anglerBlueMarlinCounts[anglerName] =
      (anglerBlueMarlinCounts[anglerName] || 0) + 1;

    if (!boatBlueMarlinCounts[boatName]) {
      boatBlueMarlinCounts[boatName] = { count: 0, id: boatId };
    }

    boatBlueMarlinCounts[boatName].count += 1;
  });

  const topBlueMarlinAngler = Object.entries(anglerBlueMarlinCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const topBlueMarlinBoat = Object.entries(boatBlueMarlinCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  const topBoatPoints = Object.entries(boatPoints).sort(
    (a, b) => b[1].points - a[1].points
  )[0];

  const topAnglerPoints = Object.entries(anglerPoints).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const topReleaseBoat = Object.entries(boatReleaseCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  const topTaggedBoat = Object.entries(boatTaggedCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Hall of Fame</h1>

      <p>
  <Link href="/records">View Club Records</Link>
</p>

      <h2>Largest Fish Records</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <RecordCard title="Largest Blue Marlin" catchRecord={largestBySpecies(["Blue Marlin"])} />
        <RecordCard title="Largest White Marlin" catchRecord={largestBySpecies(["White Marlin"])} />
        <RecordCard title="Largest Sailfish" catchRecord={largestBySpecies(["Sailfish"])} />
        <RecordCard title="Largest Spearfish" catchRecord={largestBySpecies(["Spearfish"])} />
        <RecordCard title="Largest Swordfish" catchRecord={largestBySpecies(["Swordfish"])} />
        <RecordCard title="Largest Tuna" catchRecord={largestBySpecies(["Yellowfin Tuna", "Bigeye Tuna"])} />
        <RecordCard title="Largest Dolphin" catchRecord={largestBySpecies(["Dolphin"])} />
        <RecordCard title="Largest Wahoo" catchRecord={largestBySpecies(["Wahoo"])} />
      </div>

      <h2>Club Records</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <LeaderCard
          title="Most Blue Marlin Angler"
          name={topBlueMarlinAngler?.[0]}
          value={topBlueMarlinAngler?.[1]}
          suffix="Blue Marlin"
        />

        <LeaderCard
          title="Most Blue Marlin Boat"
          name={topBlueMarlinBoat?.[0]}
          value={topBlueMarlinBoat?.[1].count}
          suffix="Blue Marlin"
          boatId={topBlueMarlinBoat?.[1].id}
        />

        <LeaderCard
          title="Most Points by Boat"
          name={topBoatPoints?.[0]}
          value={topBoatPoints?.[1].points}
          suffix="points"
          boatId={topBoatPoints?.[1].id}
        />

        <LeaderCard
          title="Most Points by Angler"
          name={topAnglerPoints?.[0]}
          value={topAnglerPoints?.[1]}
          suffix="points"
        />

        <LeaderCard
          title="Most Releases by Boat"
          name={topReleaseBoat?.[0]}
          value={topReleaseBoat?.[1].count}
          suffix="releases"
          boatId={topReleaseBoat?.[1].id}
        />

        <LeaderCard
          title="Most Tagged Fish by Boat"
          name={topTaggedBoat?.[0]}
          value={topTaggedBoat?.[1].count}
          suffix="tagged fish"
          boatId={topTaggedBoat?.[1].id}
        />
      </div>
    </main>
  );
}