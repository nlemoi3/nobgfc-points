import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateBoatAward(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("boat_awards")
    .update({
      boat_id: Number(formData.get("boat_id")),
      award_name: String(formData.get("award_name") || ""),
      award_year: Number(formData.get("award_year")),
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/boat-awards");
}

async function deleteBoatAward(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("boat_awards")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/boat-awards");
}

export default async function EditBoatAwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: award } = await supabase
    .from("boat_awards")
    .select("*")
    .eq("id", Number(id))
    .single();

  const { data: boats } = await supabase
    .from("boats")
    .select("id,name")
    .order("name");

  if (!award) {
    return (
      <main style={{ padding: "40px" }}>
        Boat award not found.
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Boat Award</h1>

      <form action={updateBoatAward}>
        <input type="hidden" name="id" value={award.id} />

        <p>
          <label>Boat</label>
          <br />
          <select
            name="boat_id"
            defaultValue={award.boat_id}
            required
          >
            {boats?.map((boat: any) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Award Name</label>
          <br />
          <input
            name="award_name"
            defaultValue={award.award_name}
            required
          />
        </p>

        <p>
          <label>Award Year</label>
          <br />
          <input
            name="award_year"
            type="number"
            defaultValue={award.award_year}
            required
          />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea
            name="notes"
            defaultValue={award.notes || ""}
            rows={4}
            cols={50}
          />
        </p>

        <button type="submit">
          Save Boat Award
        </button>
      </form>

      <hr style={{ margin: "30px 0" }} />

      <form action={deleteBoatAward}>
        <input type="hidden" name="id" value={award.id} />

        <button
          type="submit"
          style={{ color: "red" }}
        >
          Delete Boat Award
        </button>
      </form>
    </main>
  );
}