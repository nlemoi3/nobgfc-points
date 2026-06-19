import Link from "next/link";
import { supabase } from "../../lib/supabase";

function normalizeBoatName(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function ChampionsPage() {
  const { data: boatAwards } = await supabase
    .from("boat_awards")
    .select("*")
    .eq("award_name", "Boat Champion")
    .order("award_year", { ascending: false });

  const { data: anglerAwards } = await supabase
    .from("angler_awards")
    .select("*")
    .in("award_name", ["Angling Champion", "Dutch Prager Youth Champion"])
    .order("award_year", { ascending: false });

  const { data: historicalStandings } = await supabase
    .from("historical_boat_standings")
    .select("*")
    .eq("rank", 1)
    .order("season_year", { ascending: false });

  const { data: boats } = await supabase
    .from("boats")
    .select("id,name,photo_url,logo_url");

  const { data: anglers } = await supabase
    .from("anglers")
    .select("id,first_name,last_name");

  const boatNameById: Record<number, string> = {};
  const anglerNameById: Record<number, string> = {};
  const boatByNormalizedName: Record<string, any> = {};

  boats?.forEach((boat: any) => {
    boatNameById[boat.id] = boat.name;
    boatByNormalizedName[normalizeBoatName(boat.name)] = boat;
  });

  anglers?.forEach((angler: any) => {
    anglerNameById[angler.id] =
      `${angler.first_name || ""} ${angler.last_name || ""}`.trim();
  });

  const years = Array.from(
    new Set([
      ...(historicalStandings || []).map((row: any) => row.season_year),
      ...(boatAwards || []).map((award: any) => award.award_year),
      ...(anglerAwards || []).map((award: any) => award.award_year),
    ])
  ).sort((a: any, b: any) => b - a);

  function boatChampionForYear(year: number) {
    return boatAwards?.find((award: any) => award.award_year === year);
  }

  function historicalBoatChampionForYear(year: number) {
    return historicalStandings?.find((row: any) => row.season_year === year);
  }

  function anglerChampionForYear(year: number) {
    return anglerAwards?.find(
      (award: any) =>
        award.award_year === year && award.award_name === "Angling Champion"
    );
  }

  function youthChampionForYear(year: number) {
    return anglerAwards?.find(
      (award: any) =>
        award.award_year === year &&
        award.award_name === "Dutch Prager Youth Champion"
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Hall of Champions</h1>

      {years.length === 0 ? (
        <p>No season champions have been recorded yet.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Boat Champion</th>
              <th>Angling Champion</th>
              <th>Dutch Prager Youth Champion</th>
            </tr>
          </thead>

          <tbody>
            {years.map((year: number) => {
              const boatChampion = boatChampionForYear(year);
              const historicalBoatChampion =
                historicalBoatChampionForYear(year);
              const anglerChampion = anglerChampionForYear(year);
              const youthChampion = youthChampionForYear(year);

              const boatName = boatChampion
                ? boatNameById[boatChampion.boat_id]
                : historicalBoatChampion?.boat_name;

              const matchedBoat = boatName
                ? boatByNormalizedName[normalizeBoatName(boatName)]
                : null;

              const boatImage =
                matchedBoat?.logo_url || matchedBoat?.photo_url || null;

              return (
                <tr key={year}>
                  <td>{year}</td>

                  <td>
                    {boatName ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {boatImage && (
                          <img
                            src={boatImage}
                            alt={boatName}
                            style={{
                              width: "70px",
                              height: "70px",
                              objectFit: "contain",
                              border: "1px solid #ccc",
                              backgroundColor: "white",
                            }}
                          />
                        )}

                        {matchedBoat ? (
                          <Link href={`/boats/${matchedBoat.id}`}>{boatName}</Link>
                        ) : (
                          boatName
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    {anglerChampion ? (
                      <Link href={`/anglers/${anglerChampion.angler_id}`}>
                        {anglerNameById[anglerChampion.angler_id] ||
                          "Unknown Angler"}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    {youthChampion ? (
                      <Link href={`/anglers/${youthChampion.angler_id}`}>
                        {anglerNameById[youthChampion.angler_id] ||
                          "Unknown Angler"}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}