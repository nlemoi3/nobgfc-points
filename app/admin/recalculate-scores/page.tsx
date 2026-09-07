import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { calculateCatchPoints } from "../../../lib/scoring";

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
    const points = calculateCatchPoints({
      speciesName: (catchRecord as any).species?.name || "",
      weight:
        catchRecord.weight === null ? null : Number(catchRecord.weight),
      lineClass: Number(catchRecord.line_class || 130),
      released: Boolean(catchRecord.released),
      tagged: Boolean(catchRecord.tagged),
    });

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
    <main className="panel">
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
