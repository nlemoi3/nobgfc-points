import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { getOfficialEligiblePoints } from "../../../../lib/scoring";

async function generateAwards(formData: FormData) {
  "use server";

  const year = Number(formData.get("year"));

  await supabase
  .from("boat_awards")
  .delete()
  .eq("award_year", year)
  .eq("award_name", "Boat Champion");

await supabase
  .from("angler_awards")
  .delete()
  .eq("award_year", year)
  .in("award_name", [
    "Angling Champion",
    "Dutch Prager Youth Champion",
  ]);

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      id,
      catch_datetime,
      points_awarded,
      released,
      tagged,
      weight,
      boats(id,name),
      anglers(id,first_name,last_name,is_member,is_youth),
      species(name)
    `)
    .eq("status", "approved");

  const yearCatches =
    catches?.filter((c: any) => {
      const catchYear = new Date(
        c.catch_datetime
      ).getFullYear();

      return catchYear === year;
    }) || [];

  const boatGroups: Record<string, any[]> = {};
  const anglerGroups: Record<string, any[]> = {};
  const youthGroups: Record<string, any[]> = {};

  yearCatches.forEach((c: any) => {
    const boatName = c.boats?.name;

    if (boatName) {
      if (!boatGroups[boatName]) {
        boatGroups[boatName] = [];
      }

      boatGroups[boatName].push(c);
    }

    if (c.anglers?.is_member) {
      const anglerKey = String(c.anglers.id);

      if (!anglerGroups[anglerKey]) {
        anglerGroups[anglerKey] = [];
      }

      anglerGroups[anglerKey].push(c);
    }

    if (c.anglers?.is_youth) {
      const anglerKey = String(c.anglers.id);

      if (!youthGroups[anglerKey]) {
        youthGroups[anglerKey] = [];
      }

      youthGroups[anglerKey].push(c);
    }
  });

  const boatChampion = Object.values(boatGroups)
    .map((group: any[]) => ({
      boatId: group[0].boats.id,
      points: getOfficialEligiblePoints(group),
    }))
    .sort((a, b) => b.points - a.points)[0];

  const anglerChampion = Object.values(anglerGroups)
    .map((group: any[]) => ({
      anglerId: group[0].anglers.id,
      points: getOfficialEligiblePoints(group),
    }))
    .sort((a, b) => b.points - a.points)[0];

  const youthChampion = Object.values(youthGroups)
    .map((group: any[]) => ({
      anglerId: group[0].anglers.id,
      points: getOfficialEligiblePoints(group),
    }))
    .sort((a, b) => b.points - a.points)[0];

  if (boatChampion) {
    await supabase.from("boat_awards").insert({
      boat_id: boatChampion.boatId,
      award_name: "Boat Champion",
      award_year: year,
    });
  }

  if (anglerChampion) {
    await supabase.from("angler_awards").insert({
      angler_id: anglerChampion.anglerId,
      award_name: "Angling Champion",
      award_year: year,
    });
  }

  if (youthChampion) {
    await supabase.from("angler_awards").insert({
      angler_id: youthChampion.anglerId,
      award_name: "Dutch Prager Youth Champion",
      award_year: year,
    });
  }

  redirect("/admin/season-champions");
}

export default function GenerateSeasonAwardsPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Generate Season Awards</h1>

      <form action={generateAwards}>
        <p>
          <label>Year</label>
          <br />
          <input
            name="year"
            type="number"
            defaultValue={new Date().getFullYear()}
            required
          />
        </p>

        <button type="submit">
          Generate Champions
        </button>
      </form>
    </main>
  );
}