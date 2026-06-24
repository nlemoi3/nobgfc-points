import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function updateAward(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("angler_awards")
    .update({
      angler_id: Number(formData.get("angler_id")),
      award_name: String(formData.get("award_name") || ""),
      award_year: Number(formData.get("award_year")),
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/awards");
}

async function deleteAward(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("angler_awards")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/awards");
}

export default async function EditAwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: award } = await supabase
    .from("angler_awards")
    .select("*")
    .eq("id", Number(id))
    .single();

  const { data: anglers } = await supabase
    .from("anglers")
    .select("id,first_name,last_name")
    .order("last_name");

  if (!award) {
    return <main className="panel">Award not found.</main>;
  }

  return (
    <main className="panel">
      <h1>Edit Angler Award</h1>

      <form action={updateAward}>
        <input type="hidden" name="id" value={award.id} />

        <p>
          <label>Angler</label>
          <br />
          <select name="angler_id" defaultValue={award.angler_id} required>
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
          <input name="award_name" defaultValue={award.award_name} required />
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

        <button type="submit">Save Award</button>
      </form>

      <hr style={{ margin: "30px 0" }} />

      <form action={deleteAward}>
        <input type="hidden" name="id" value={award.id} />
        <button type="submit" style={{ color: "red" }}>
          Delete Award
        </button>
      </form>
    </main>
  );
}
