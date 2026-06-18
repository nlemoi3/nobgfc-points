import Link from "next/link";
import { supabase } from "../../lib/supabase";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
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
          <p>{formatDateTime(catchRecord.catch_datetime)}</p>
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
      released,
      tagged,
      catch_datetime,
      boats(id,name),
      anglers(first_name,last_name),
      species(name),
      events(name)
    `);

  const largestBySpecies = (speciesNames: string[]) =>
    catches
      ?.filter(
        (c: any) =>
          speciesNames.includes(c.species?.name) &&
          c.weight
      )
      .sort((a: any, b: any) => b.weight - a.weight)[0];

  const blueMarlinCatches =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin") || [];

  const anglerCounts: Record<string, number> = {};
  const boatCounts: Record<string, number> = {};

  blueMarlinCatches.forEach((c: any) => {
    const angler =
      `${c.anglers?.first_name || ""} ${c.anglers?.last_name || ""}`.trim();

    const boat = c.boats?.name || "Unknown Boat";

    anglerCounts[angler] = (anglerCounts[angler] || 0) + 1;
    boatCounts[boat] = (boatCounts[boat] || 0) + 1;
  });

  const topBlueMarlinAngler = Object.entries(anglerCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const topBlueMarlinBoat = Object.entries(boatCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Hall of Fame</h1>

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

      <h2>Blue Marlin Records</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "260px" }}>
          <h3>Most Blue Marlin Angler</h3>
          {topBlueMarlinAngler ? (
            <>
              <p><strong>{topBlueMarlinAngler[0]}</strong></p>
              <p>{topBlueMarlinAngler[1]} Blue Marlin</p>
            </>
          ) : (
            <p>No record</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "260px" }}>
          <h3>Most Blue Marlin Boat</h3>
          {topBlueMarlinBoat ? (
            <>
              <p><strong>{topBlueMarlinBoat[0]}</strong></p>
              <p>{topBlueMarlinBoat[1]} Blue Marlin</p>
            </>
          ) : (
            <p>No record</p>
          )}
        </div>
      </div>
    </main>
  );
}