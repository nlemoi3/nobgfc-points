import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function createAngler(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const userId = String(formData.get("user_id") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phoneNumber = String(formData.get("phone_number") || "").trim() || null;
  const role = String(formData.get("role") || "").trim();

  const { data: newAngler, error } = await supabase.from("anglers").insert({
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    is_member: formData.get("is_member") === "on",
    is_youth: formData.get("is_youth") === "on",
    date_of_birth: formData.get("date_of_birth") || null,
    biography: String(formData.get("biography") || ""),
    email: email,
    phone_number: phoneNumber,
    user_id: userId,
  }).select().single();

  if (error) {
    redirect(`/admin/anglers/new?error=${encodeURIComponent(error.message)}`);
  }

  // Assign role if user_id and role provided
  if (userId && role) {
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });
  }

  redirect("/admin/anglers");
}

export default async function NewAnglerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: saveError } = await searchParams;

  return (
    <main className="panel">
      <h1>Add Angler</h1>

      {saveError && (
        <p className="alert alert-danger">
          Save failed: {saveError}
        </p>
      )}

      <form action={createAngler}>
        <div className="form-grid">
        <p className="field">
          <label>First Name</label>
          <input name="first_name" required />
        </p>

        <p className="field">
          <label>Last Name</label>
          <input name="last_name" required />
        </p>

        <p className="field">
          <label>Date of Birth</label>
          <input name="date_of_birth" type="date" />
        </p>

        <p className="checkbox-row field-full">
          <label className="checkbox-item">
            <input name="is_member" type="checkbox" /> Member
          </label>

          <label className="checkbox-item">
            <input name="is_youth" type="checkbox" /> Youth
          </label>
        </p>

        <hr className="field-full" />

        <h2 className="field-full">Contact &amp; Account</h2>

        <p className="field field-full">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="angler email (used to link accounts)"
          />
        </p>

        <p className="field field-full">
          <label>Phone Number</label>
          <input
            name="phone_number"
            type="tel"
            placeholder="angler phone number"
          />
        </p>

        <p className="field field-full">
          <label>User ID</label>
          <input
            name="user_id"
            placeholder="auth.users UUID (optional)"
          />
        </p>

        <p className="field field-full">
          <label>Permission Level</label>
          <select name="role">
            <option value="">None (read-only)</option>
            <option value="member">Member</option>
            <option value="boat">Boat</option>
            <option value="weighmaster">Weighmaster</option>
            <option value="admin">Admin</option>
          </select>
          <span className="hint" style={{ marginLeft: "8px" }}>
            Requires a User ID to take effect
          </span>
        </p>

        <hr className="field-full" />

        <h2 className="field-full">Profile</h2>

        <p className="field field-full">
          <label>Biography</label>
          <textarea name="biography" rows={5} />
        </p>

        <p className="field-full">
          <button type="submit" className="btn">Add Angler</button>
        </p>
        </div>
      </form>
    </main>
  );
}
