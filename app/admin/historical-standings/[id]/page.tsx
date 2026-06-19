import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateHistoricalStanding(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("historical_boat_standings")
    .update({
      season_year: Number(formData.get("season_year")),
      rank: Number(formData.get("rank")),
      boat_name: String(formData.get("boat_name") || ""),
      points: Number(formData.get("points")),
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/historical-standings");
}

async function deleteHistoricalStanding(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("historical_boat_standings")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/historical-standings");
}

export default async function EditHistoricalStandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: row } = await supabase
    .from("historical_boat_standings")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (!row) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Historical Standing</h1>
        <p>Historical standing not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Historical Standing</h1>

      <form action={updateHistoricalStanding}>
        <input type="hidden" name="id" value={row.id} />

        <p>
          <label>Season Year</label>
          <br />
          <input
            name="season_year"
            type="number"
            defaultValue={row.season_year}
            required
          />
        </p>

        <p>
          <label>Rank</label>
          <br />
          <input
            name="rank"
            type="number"
            defaultValue={row.rank}
            required
          />
        </p>

        <p>
          <label>Boat Name</label>
          <br />
          <input
            name="boat_name"
            defaultValue={row.boat_name}
            style={{ width: "400px" }}
            required
          />
        </p>

        <p>
          <label>Points</label>
          <br />
          <input
            name="points"
            type="number"
            step="0.1"
            defaultValue={row.points}
            required
          />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <input
            name="notes"
            defaultValue={row.notes || ""}
            style={{ width: "400px" }}
          />
        </p>

        <button type="submit">Save Historical Standing</button>
      </form>

      <hr style={{ margin: "30px 0" }} />

      <form action={deleteHistoricalStanding}>
        <input type="hidden" name="id" value={row.id} />
        <button type="submit" style={{ color: "red" }}>
          Delete Historical Standing
        </button>
      </form>
    </main>
  );
}