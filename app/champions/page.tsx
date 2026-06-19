import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function ChampionsPage() {
  const { data: boatAwards } = await supabase
    .from("boat_awards")
    .select("*")
    .eq("award_name", "Boat Champion")
    .order("award_year", { ascending: false });

  const { data: anglerAwards } = await supabase
    .from("angler_awards")
    .select("*")
    .in("award_name", [
      "Angling Champion",
      "Dutch Prager Youth Champion",
    ])
    .order("award_year", { ascending: false });

  const { data: boats } = await supabase
    .from("boats")
    .select("id,name");

  const { data: anglers } = await supabase
    .from("anglers")
    .select("id,first_name,last_name");

  const boatNameById: Record<number, string> = {};
  const anglerNameById: Record<number, string> = {};

  boats?.forEach((boat: any) => {
    boatNameById[boat.id] = boat.name;
  });

  anglers?.forEach((angler: any) => {
    anglerNameById[angler.id] =
      `${angler.first_name || ""} ${angler.last_name || ""}`.trim();
  });

  const years = Array.from(
    new Set([
      ...(boatAwards || []).map((award: any) => award.award_year),
      ...(anglerAwards || []).map((award: any) => award.award_year),
    ])
  ).sort((a: any, b: any) => b - a);

  function boatChampionForYear(year: number) {
    return boatAwards?.find((award: any) => award.award_year === year);
  }

  function anglerChampionForYear(year: number) {
    return anglerAwards?.find(
      (award: any) =>
        award.award_year === year &&
        award.award_name === "Angling Champion"
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
              const anglerChampion = anglerChampionForYear(year);
              const youthChampion = youthChampionForYear(year);

              return (
                <tr key={year}>
                  <td>{year}</td>

                  <td>
                    {boatChampion ? (
                      <Link href={`/boats/${boatChampion.boat_id}`}>
                        {boatNameById[boatChampion.boat_id] || "Unknown Boat"}
                      </Link>
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