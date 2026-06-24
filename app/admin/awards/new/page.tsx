import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function createAward(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase
    .from("angler_awards")
    .insert({
      angler_id: Number(formData.get("angler_id")),
      award_name: String(formData.get("award_name") || ""),
      award_year: Number(formData.get("award_year")),
      notes: String(formData.get("notes") || ""),
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/awards");
}

export default async function NewAwardPage() {
  const supabase = await createClient();
  const { data: anglers } = await supabase
    .from("anglers")
    .select("id,first_name,last_name")
    .order("last_name");

  return (
    <main className="panel">
      <h1>Add Award</h1>

      <form action={createAward}>
        <p>
          <label>Angler</label>
          <br />
          <select name="angler_id" required>
            <option value="">Select Angler</option>

            {anglers?.map((angler: any) => (
              <option key={angler.id} value={angler.id}>
                {angler.first_name} {angler.last_name}
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
          <textarea
            name="notes"
            rows={4}
            cols={50}
          />
        </p>

        <button type="submit">
          Save Award
        </button>
      </form>
    </main>
  );
}
