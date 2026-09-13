import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { isWeighedCatch } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

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
const { year, start, end } = await getActiveSeasonRange(supabase);
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    weight,
    status,
    species(name),
    anglers(id,first_name,last_name),
    boats(id,name),
    events(id,name),
    catch_datetime
  `)
  .eq("status", "approved")
  .gte("catch_datetime", start)
  .lt("catch_datetime", end);

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

    if (!species || !isWeighedCatch(c)) return;

    if (!speciesAwards[species] || c.weight > speciesAwards[species].weight) {
      speciesAwards[species] = c;
    }
  });

  return (
    <main className="panel">
      <h1>{year} Annual Awards</h1>

      <div style={{ display: "flex", gap: "40px", marginBottom: "30px", flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", flex: "1 1 260px" }}>
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

        <div style={{ border: "1px solid #ccc", padding: "15px", flex: "1 1 260px" }}>
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

      <div className="table-wrap mobile-card-wrap" role="region" aria-label={`${year} annual awards`} tabIndex={0}>
      <table className="admin-table mobile-card-table">
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
                <td data-label="Species">{species}</td>
                {catchRecord ? (
                  <>
                    <td data-label="Weight">
                      <Link href={`/catches/${catchRecord.id}`}>
                        {catchRecord.weight} lbs
                      </Link>
                    </td>
                    <td data-label="Angler">
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
                    <td data-label="Boat">
                      {catchRecord.boats?.id ? (
                        <Link href={`/boats/${catchRecord.boats.id}`}>
                          {catchRecord.boats?.name}
                        </Link>
                      ) : (
                        catchRecord.boats?.name
                      )}
                    </td>
                    <td data-label="Event">
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
                    <td data-label="Weight">—</td>
                    <td data-label="Angler">—</td>
                    <td data-label="Boat">—</td>
                    <td data-label="Event">—</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </main>
  );
}
