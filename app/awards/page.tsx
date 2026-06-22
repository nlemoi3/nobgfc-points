import Link from "next/link";
import { supabase } from "../../lib/supabase";

const AWARD_SPECIES = [
  "Blue Marlin",
  "White Marlin",
  "Sailfish",
  "Spearfish",
  "Swordfish",
  "Yellowfin Tuna",
  "Bigeye Tuna",
  "Dolphin",
  "Wahoo",
];

export default async function AwardsPage() {
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    weight,
    status,
    species(name),
    anglers(id,first_name,last_name),
    boats(id,name),
    events(id,name)
  `)
  .eq("status", "approved");

  const blueMarlinCatches =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin") || [];

  const anglerCounts: Record<string, { count: number; id?: number }> = {};
  const boatCounts: Record<string, { count: number; id?: number }> = {};

  blueMarlinCatches.forEach((c: any) => {
    const angler = `${c.anglers?.first_name || ""} ${
      c.anglers?.last_name || ""
    }`.trim();

    const boat = c.boats?.name || "Unknown Boat";

    if (!anglerCounts[angler]) {
      anglerCounts[angler] = { count: 0, id: c.anglers?.id };
    }
    if (!boatCounts[boat]) {
      boatCounts[boat] = { count: 0, id: c.boats?.id };
    }
    anglerCounts[angler].count += 1;
    boatCounts[boat].count += 1;
  });

  const topAngler = Object.entries(anglerCounts).sort(
    (a, b) => b[1].count - a[1].count,
  )[0];
  const topBoat = Object.entries(boatCounts).sort(
    (a, b) => b[1].count - a[1].count,
  )[0];

  const speciesAwards: Record<string, any> = {};

  catches?.forEach((c: any) => {
    const species = c.species?.name;

    if (!species || !c.weight) return;

    if (!speciesAwards[species] || c.weight > speciesAwards[species].weight) {
      speciesAwards[species] = c;
    }
  });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Annual Awards</h1>

      <div style={{ display: "flex", gap: "40px", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "300px" }}>
          <h2>Most Blue Marlin - Angler</h2>
          {topAngler ? (
            <>
              <p>
                <strong>
                  {topAngler[1].id ? (
                    <Link href={`/anglers/${topAngler[1].id}`}>
                      {topAngler[0]}
                    </Link>
                  ) : (
                    topAngler[0]
                  )}
                </strong>
              </p>
              <p>{topAngler[1].count} Blue Marlin</p>
            </>
          ) : (
            <p>No Blue Marlin entered</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "300px" }}>
          <h2>Most Blue Marlin - Boat</h2>
          {topBoat ? (
            <>
              <p>
                <strong>
                  {topBoat[1].id ? (
                    <Link href={`/boats/${topBoat[1].id}`}>{topBoat[0]}</Link>
                  ) : (
                    topBoat[0]
                  )}
                </strong>
              </p>
              <p>{topBoat[1].count} Blue Marlin</p>
            </>
          ) : (
            <p>No Blue Marlin entered</p>
          )}
        </div>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Species</th>
            <th>Weight</th>
            <th>Angler</th>
            <th>Boat</th>
            <th>Event</th>
          </tr>
        </thead>

        <tbody>
          {AWARD_SPECIES.map((species) => {
            const catchRecord = speciesAwards[species];

            return (
              <tr key={species}>
                <td>{species}</td>
                {catchRecord ? (
                  <>
                    <td>
                      <Link href={`/catches/${catchRecord.id}`}>
                        {catchRecord.weight} lbs
                      </Link>
                    </td>
                    <td>
                      {catchRecord.anglers?.id ? (
                        <Link href={`/anglers/${catchRecord.anglers.id}`}>
                          {catchRecord.anglers?.first_name}{" "}
                          {catchRecord.anglers?.last_name}
                        </Link>
                      ) : (
                        <>
                          {catchRecord.anglers?.first_name}{" "}
                          {catchRecord.anglers?.last_name}
                        </>
                      )}
                    </td>
                    <td>
                      {catchRecord.boats?.id ? (
                        <Link href={`/boats/${catchRecord.boats.id}`}>
                          {catchRecord.boats?.name}
                        </Link>
                      ) : (
                        catchRecord.boats?.name
                      )}
                    </td>
                    <td>
                      {catchRecord.events?.id ? (
                        <Link href={`/tournaments/${catchRecord.events.id}`}>
                          {catchRecord.events?.name}
                        </Link>
                      ) : (
                        catchRecord.events?.name
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
