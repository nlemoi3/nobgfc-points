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
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Add Angler</h1>

      {saveError && (
        <p style={{ color: "red", background: "#fff0f0", padding: "10px", borderRadius: "4px" }}>
          Save failed: {saveError}
        </p>
      )}

      <form action={createAngler}>
        <p>
          <label>First Name</label>
          <br />
          <input name="first_name" required />
        </p>

        <p>
          <label>Last Name</label>
          <br />
          <input name="last_name" required />
        </p>

        <p>
          <label>Date of Birth</label>
          <br />
          <input name="date_of_birth" type="date" />
        </p>

        <p>
          <label>
            <input name="is_member" type="checkbox" /> Member
          </label>
        </p>

        <p>
          <label>
            <input name="is_youth" type="checkbox" /> Youth
          </label>
        </p>

        <hr />

        <h2>Contact &amp; Account</h2>

        <p>
          <label>Email</label>
          <br />
          <input
            name="email"
            type="email"
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
            placeholder="angler phone number"
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label>User ID</label>
          <br />
          <input
            name="user_id"
            placeholder="auth.users UUID (optional)"
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label>Permission Level</label>
          <br />
          <select name="role" style={{ padding: "8px", minWidth: "200px" }}>
            <option value="">None (read-only)</option>
            <option value="member">Member</option>
            <option value="boat">Boat</option>
            <option value="weighmaster">Weighmaster</option>
            <option value="admin">Admin</option>
          </select>
          <span style={{ marginLeft: "8px", color: "#888", fontSize: "0.85em" }}>
            Requires a User ID to take effect
          </span>
        </p>

        <hr />

        <h2>Profile</h2>

        <p>
          <label>Biography</label>
          <br />
          <textarea
            name="biography"
            rows={5}
            style={{ width: "500px" }}
          />
        </p>

        <button type="submit">Add Angler</button>
      </form>
    </main>
  );
}
