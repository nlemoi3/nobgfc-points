import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function updateAngler(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const id = Number(formData.get("id"));

  const userId = String(formData.get("user_id") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phoneNumber = String(formData.get("phone_number") || "").trim() || null;

  const role = String(formData.get("role") || "").trim();

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
      email: email,
      phone_number: phoneNumber,
      user_id: userId,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/anglers/${id}?error=${encodeURIComponent(error.message)}`);
  }

  // Sync role in user_roles table
  if (userId) {
    if (role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });
      if (roleError) {
        redirect(`/admin/anglers/${id}?error=${encodeURIComponent(roleError.message)}`);
      }
    } else {
      await supabase.from("user_roles").delete().eq("user_id", userId);
    }
  }

  redirect("/admin/anglers");
}

export default async function EditAnglerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: saveError } = await searchParams;
  const supabase = await createClient();

  const { data: angler, error } = await supabase
    .from("anglers")
    .select("*")
    .eq("id", Number(id))
    .single();

  const currentRole = angler?.user_id
    ? (await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", angler.user_id)
        .maybeSingle()
      ).data?.role ?? ""
    : "";

  if (error) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Angler</h1>
        <p style={{ color: "red" }}>Error loading angler: {error.message}</p>
      </main>
    );
  }

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

      {saveError && (
        <p style={{ color: "red", background: "#fff0f0", padding: "10px", borderRadius: "4px" }}>
          Save failed: {saveError}
        </p>
      )}

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
          <label>Email</label>
          <br />
          <input
            name="email"
            type="email"
            defaultValue={angler.email || ""}
            placeholder="angler email (used to link accounts)"
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label>Phone Number</label>
          <br />
          <input
            name="phone_number"
            type="tel"
            defaultValue={angler.phone_number || ""}
            placeholder="angler phone number"
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label>Permission Level</label>
          <br />
          <select
            name="role"
            defaultValue={currentRole}
            style={{ padding: "8px", minWidth: "200px" }}
          >
            <option value="">None (read-only)</option>
            <option value="member">Member</option>
            <option value="boat">Boat</option>
            <option value="weighmaster">Weighmaster</option>
            <option value="admin">Admin</option>
          </select>
          {!angler.user_id && (
            <span style={{ marginLeft: "8px", color: "#888", fontSize: "0.85em" }}>
              Requires a User ID to take effect
            </span>
          )}
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
