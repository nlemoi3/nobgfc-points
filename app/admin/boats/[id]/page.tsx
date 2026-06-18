import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateBoat(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("boats")
    .update({
      name: String(formData.get("name") || ""),
      make: String(formData.get("make") || ""),
      model: String(formData.get("model") || ""),
      year: formData.get("year") ? Number(formData.get("year")) : null,
      length_feet: formData.get("length_feet")
        ? Number(formData.get("length_feet"))
        : null,
      home_port: String(formData.get("home_port") || ""),
      photo_url: String(formData.get("photo_url") || ""),
      logo_url: String(formData.get("logo_url") || ""),
      website_url: String(formData.get("website_url") || ""),
      facebook_url: String(formData.get("facebook_url") || ""),
      instagram_url: String(formData.get("instagram_url") || ""),
      youtube_url: String(formData.get("youtube_url") || ""),
      captain_name: String(formData.get("captain_name") || ""),
      captain_email: String(formData.get("captain_email") || ""),
      owner_name: String(formData.get("owner_name") || ""),
      owner_email: String(formData.get("owner_email") || ""),
      profile_status: String(formData.get("profile_status") || "draft"),
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/boats");
}

export default async function EditBoatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (!boat) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Boat</h1>
        <p>Boat not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Boat</h1>

      <form action={updateBoat}>
        <input type="hidden" name="id" value={boat.id} />

        <p>
          <label>Boat Name</label>
          <br />
          <input name="name" defaultValue={boat.name} required style={{ width: "500px" }} />
        </p>

        <p>
          <label>Make</label>
          <br />
          <input name="make" defaultValue={boat.make || ""} />
        </p>

        <p>
          <label>Model</label>
          <br />
          <input name="model" defaultValue={boat.model || ""} />
        </p>

        <p>
          <label>Year</label>
          <br />
          <input name="year" type="number" defaultValue={boat.year || ""} />
        </p>

        <p>
          <label>Length</label>
          <br />
          <input name="length_feet" type="number" step="0.1" defaultValue={boat.length_feet || ""} />
        </p>

        <p>
          <label>Home Port</label>
          <br />
          <input name="home_port" defaultValue={boat.home_port || ""} />
        </p>

        <hr />

        <h2>Team / Owner Contact</h2>

        <p>
          <label>Captain Name</label>
          <br />
          <input name="captain_name" defaultValue={boat.captain_name || ""} />
        </p>

        <p>
          <label>Captain Email</label>
          <br />
          <input name="captain_email" type="email" defaultValue={boat.captain_email || ""} />
        </p>

        <p>
          <label>Owner Name</label>
          <br />
          <input name="owner_name" defaultValue={boat.owner_name || ""} />
        </p>

        <p>
          <label>Owner Email</label>
          <br />
          <input name="owner_email" type="email" defaultValue={boat.owner_email || ""} />
        </p>

        <p>
          <label>Profile Status</label>
          <br />
          <select name="profile_status" defaultValue={boat.profile_status || "draft"}>
            <option value="draft">draft</option>
            <option value="submitted">submitted</option>
            <option value="approved">approved</option>
          </select>
        </p>

        <hr />

        <h2>Media / Links</h2>

        <p>
          <label>Photo URL</label>
          <br />
          <input name="photo_url" defaultValue={boat.photo_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>Logo URL</label>
          <br />
          <input name="logo_url" defaultValue={boat.logo_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>Website URL</label>
          <br />
          <input name="website_url" defaultValue={boat.website_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>Facebook URL</label>
          <br />
          <input name="facebook_url" defaultValue={boat.facebook_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>Instagram URL</label>
          <br />
          <input name="instagram_url" defaultValue={boat.instagram_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>YouTube URL</label>
          <br />
          <input name="youtube_url" defaultValue={boat.youtube_url || ""} style={{ width: "500px" }} />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea name="notes" defaultValue={boat.notes || ""} rows={5} style={{ width: "500px" }} />
        </p>

        <button type="submit">Save Boat</button>
      </form>
    </main>
  );
}