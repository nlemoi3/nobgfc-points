import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function updateAngler(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = Number(formData.get("id"));

  const userId = String(formData.get("user_id") || "").trim() || null;

  const { error } = await supabase
    .from("anglers")
    .update({
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      is_member: formData.get("is_member") === "on",
      is_youth: formData.get("is_youth") === "on",
      photo_url: String(formData.get("photo_url") || ""),
      date_of_birth: formData.get("date_of_birth") || null,
      biography: String(formData.get("biography") || ""),
      user_id: userId,
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
  const supabase = await createClient();

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
          <label>Date of Birth</label>
          <br />
          <input
            name="date_of_birth"
            type="date"
            defaultValue={angler.date_of_birth || ""}
          />
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

        <hr />

        <h2>Profile</h2>

        {angler.photo_url && (
          <p>
            <strong>Current Photo:</strong>
            <br />
            <img
              src={angler.photo_url}
              alt={`${angler.first_name} ${angler.last_name}`}
              style={{ maxWidth: "250px" }}
            />
          </p>
        )}

        <p>
          <label>Photo URL</label>
          <br />
          <input
            name="photo_url"
            defaultValue={angler.photo_url || ""}
            style={{ width: "500px" }}
          />
        </p>

        <p>
          <label>User ID</label>
          <br />
          <input
            name="user_id"
            defaultValue={angler.user_id || ""}
            placeholder="auth.users UUID"
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label>Biography</label>
          <br />
          <textarea
            name="biography"
            defaultValue={angler.biography || ""}
            rows={5}
            style={{ width: "500px" }}
          />
        </p>

        <button type="submit">Save Angler</button>
      </form>
    </main>
  );
}
