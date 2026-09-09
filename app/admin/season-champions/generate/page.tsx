import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { getOfficialEligiblePoints } from "../../../../lib/scoring";
import { requireRole } from "../../../../lib/auth";

async function generateAwards(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();
  const year = Number(formData.get("year"));

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    redirect(
      "/admin/season-champions/generate?error=Enter%20a%20valid%20season%20year",
    );
  }

  const { data: catches, error: catchesError } = await supabase
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
    .eq("status", "approved")
    .gte("catch_datetime", `${year}-01-01T00:00:00.000Z`)
    .lt("catch_datetime", `${year + 1}-01-01T00:00:00.000Z`);

  if (catchesError) {
    redirect(
      `/admin/season-champions/generate?error=${encodeURIComponent(catchesError.message)}`,
    );
  }

  const yearCatches = catches || [];

  const boatGroups: Record<string, any[]> = {};
  const anglerGroups: Record<string, any[]> = {};
  const youthGroups: Record<string, any[]> = {};

  yearCatches.forEach((c: any) => {
    const boatId = c.boats?.id;

    if (boatId) {
      const boatKey = String(boatId);

      if (!boatGroups[boatKey]) {
        boatGroups[boatKey] = [];
      }

      boatGroups[boatKey].push(c);
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

  const { error: replaceError } = await supabase.rpc(
    "replace_season_champions",
    {
      p_year: year,
      p_boat_id: boatChampion?.boatId ?? null,
      p_angler_id: anglerChampion?.anglerId ?? null,
      p_youth_id: youthChampion?.anglerId ?? null,
    },
  );

  if (replaceError) {
    redirect(
      `/admin/season-champions/generate?error=${encodeURIComponent(replaceError.message)}`,
    );
  }

  redirect("/admin/season-champions");
}

export default async function GenerateSeasonAwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("admin");
  const { error } = await searchParams;

  return (
    <main className="panel">
      <h1>Generate Season Awards</h1>

      <p>
        This recalculates the selected year and replaces its three champion
        awards together, so a failed update cannot leave a partial result.
      </p>

      {error && <p className="alert alert-danger">Unable to generate: {error}</p>}

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
