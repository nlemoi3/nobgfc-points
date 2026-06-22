import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function createBoatAward(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase
    .from("boat_awards")
    .insert({
      boat_id: Number(formData.get("boat_id")),
      award_name: String(formData.get("award_name") || ""),
      award_year: Number(formData.get("award_year")),
      notes: String(formData.get("notes") || ""),
    });

  if (error) throw new Error(error.message);

  redirect("/admin/boat-awards");
}

export default async function NewBoatAwardPage() {
  const supabase = await createClient();
  const { data: boats } = await supabase
    .from("boats")
    .select("id,name")
    .order("name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Add Boat Award</h1>

      <form action={createBoatAward}>
        <p>
          <label>Boat</label>
          <br />
          <select name="boat_id" required>
            <option value="">Select Boat</option>

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
          <input name="award_name" required />
        </p>

        <p>
          <label>Award Year</label>
          <br />
          <input
            name="award_year"
            type="number"
            defaultValue={new Date().getFullYear()}
            required
          />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea name="notes" rows={4} cols={50} />
        </p>

        <button type="submit">
          Save Award
        </button>
      </form>
    </main>
  );
}
