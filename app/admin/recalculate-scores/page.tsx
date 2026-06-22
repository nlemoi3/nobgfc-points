import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

function calculateExpectedPoints(c: any) {
  const speciesName = c.species?.name || "";
  const weight = c.weight !== null ? Number(c.weight) : null;
  const lineClass = Number(c.line_class || 130);

  const lineMultipliers: Record<number, number> = {
    130: 1.0,
    80: 1.3,
    50: 1.5,
    30: 2.0,
    20: 3.0,
    16: 3.5,
    12: 4.0,
    8: 4.5,
    4: 5.0,
    2: 6.0,
  };

  const multiplier = lineMultipliers[lineClass] || 1;

  let basePoints = 0;
  let tagBonus = 0;

  if (c.released && speciesName === "Blue Marlin") basePoints = 500;
  else if (
    c.released &&
    ["White Marlin", "Sailfish", "Spearfish", "Swordfish"].includes(speciesName)
  ) {
    basePoints = 150;
  } else if (
    c.released &&
    ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName)
  ) {
    basePoints = 100;
  } else if (weight !== null) {
    basePoints = Math.floor(weight);
  }

  if (c.tagged && speciesName === "Blue Marlin") tagBonus = 50;
  else if (
    c.tagged &&
    ["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)
  ) {
    tagBonus = 25;
  }

  if (["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName) && c.released) {
    return basePoints;
  }

  return basePoints * multiplier + tagBonus;
}

async function recalculateScores() {
  "use server";

  const supabase = await createClient();
const { data: catches, error } = await supabase
  .from("catches")
  .select(`
    id,
    weight,
    line_class,
    released,
    tagged,
    species(name),
    events(status)
  `);

  if (error) throw new Error(error.message);

  for (const catchRecord of catches || []) {
const eventStatus = (catchRecord as any).events?.status;

if (eventStatus === "locked") {
  continue;
}
    const points = calculateExpectedPoints(catchRecord);

    const { error: updateError } = await supabase
      .from("catches")
      .update({
        points_awarded: points,
      })
      .eq("id", catchRecord.id);

    if (updateError) throw new Error(updateError.message);
  }

  redirect("/admin/scoring-audit");
}

export default function RecalculateScoresPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Recalculate Scores</h1>

      <p>
        This will recalculate every catch using the current scoring rules and
        overwrite stored points.
      </p>

      <p>
        Use this after rule updates, bug fixes, or manual database corrections.
      </p>

      <form action={recalculateScores}>
        <button type="submit" style={{ padding: "10px 20px" }}>
          Recalculate All Scores
        </button>
      </form>
    </main>
  );
}
