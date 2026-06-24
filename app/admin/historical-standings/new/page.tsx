import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function createHistoricalStanding(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase
    .from("historical_boat_standings")
    .insert({
      season_year: Number(formData.get("season_year")),
      rank: Number(formData.get("rank")),
      boat_name: String(formData.get("boat_name") || ""),
      points: Number(formData.get("points")),
      notes: String(formData.get("notes") || ""),
    });

  if (error) throw new Error(error.message);

  redirect("/admin/historical-standings");
}

export default function NewHistoricalStandingPage() {
  return (
    <main className="panel">
      <h1>Add Historical Standing</h1>

      <form action={createHistoricalStanding}>
        <p>
          <label>Season Year</label>
          <br />
          <input
            name="season_year"
            type="number"
            defaultValue={new Date().getFullYear()}
            required
          />
        </p>

        <p>
          <label>Rank</label>
          <br />
          <input name="rank" type="number" required />
        </p>

        <p>
          <label>Boat Name</label>
          <br />
          <input name="boat_name" style={{ width: "400px" }} required />
        </p>

        <p>
          <label>Points</label>
          <br />
          <input name="points" type="number" step="0.1" required />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <input name="notes" style={{ width: "400px" }} />
        </p>

        <button type="submit">Add Historical Standing</button>
      </form>
    </main>
  );
}
