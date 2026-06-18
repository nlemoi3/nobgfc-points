import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateAngler(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("anglers")
    .update({
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      is_member: formData.get("is_member") === "on",
      is_youth: formData.get("is_youth") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/anglers");
}

export default async function EditAnglerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: angler } = await supabase
    .from("anglers")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (!angler) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Angler</h1>
        <p>Angler not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Angler</h1>

      <form action={updateAngler}>
        <input type="hidden" name="id" value={angler.id} />

        <p>
          <label>First Name</label>
          <br />
          <input name="first_name" defaultValue={angler.first_name} required />
        </p>

        <p>
          <label>Last Name</label>
          <br />
          <input name="last_name" defaultValue={angler.last_name} required />
        </p>

        <p>
          <label>
            <input
              name="is_member"
              type="checkbox"
              defaultChecked={angler.is_member}
            />{" "}
            Member
          </label>
        </p>

        <p>
          <label>
            <input
              name="is_youth"
              type="checkbox"
              defaultChecked={angler.is_youth}
            />{" "}
            Youth
          </label>
        </p>

        <button type="submit">Save Angler</button>
      </form>
    </main>
  );
}