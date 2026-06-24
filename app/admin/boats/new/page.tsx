import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import SearchableMultiSelect from "../../../components/searchable-multi-select";

async function createBoat(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const ownerAnglerIds = formData
    .getAll("owner_angler_ids")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const { data: boat, error } = await supabase
    .from("boats")
    .insert({
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
      notes: String(formData.get("notes") || ""),
    })
    .select("id")
    .single();

  if (error || !boat) {
    redirect(
      `/admin/boats/new?error=${encodeURIComponent(error?.message || "Unable to create boat")}`,
    );
  }

  if (ownerAnglerIds.length > 0) {
    const { error: ownersError } = await supabase.from("boat_owners").insert(
      ownerAnglerIds.map((anglerId) => ({
        boat_id: boat.id,
        angler_id: anglerId,
      })),
    );

    if (ownersError) {
      redirect(
        `/admin/boats/new?error=${encodeURIComponent(ownersError.message)}`,
      );
    }
  }

  redirect(`/admin/boats/${boat.id}`);
}

export default async function NewBoatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: saveError } = await searchParams;
  const supabase = await createClient();

  const { data: anglers } = await supabase
    .from("anglers")
    .select("id,first_name,last_name")
    .order("last_name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Add Boat</h1>

      {saveError && (
        <p
          style={{
            color: "red",
            background: "#fff0f0",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          Save failed: {saveError}
        </p>
      )}

      <form action={createBoat}>
        <p>
          <label>Boat Name</label>
          <br />
          <input name="name" required style={{ width: "500px" }} />
        </p>

        <p>
          <label>Make</label>
          <br />
          <input name="make" />
        </p>

        <p>
          <label>Model</label>
          <br />
          <input name="model" />
        </p>

        <p>
          <label>Year</label>
          <br />
          <input name="year" type="number" />
        </p>

        <p>
          <label>Length</label>
          <br />
          <input name="length_feet" type="number" step="0.1" />
        </p>

        <p>
          <label>Home Port</label>
          <br />
          <input name="home_port" />
        </p>

        <hr />

        <h2>Team / Owner Contact</h2>

        <p>
          <label>Captain Name</label>
          <br />
          <input name="captain_name" />
        </p>

        <p>
          <label>Captain Email</label>
          <br />
          <input name="captain_email" type="email" />
        </p>

        <p>
          <label>Owner Name</label>
          <br />
          <input name="owner_name" />
        </p>

        <p>
          <label>Owner Email</label>
          <br />
          <input name="owner_email" type="email" />
        </p>

        <SearchableMultiSelect
          label="Linked Owner Accounts (multiple)"
          name="owner_angler_ids"
          options={(anglers || []).map((angler: any) => ({
            value: String(angler.id),
            label: `${angler.last_name}, ${angler.first_name}`,
          }))}
        />

        <hr />

        <h2>Media / Links</h2>

        <p>
          <label>Photo URL</label>
          <br />
          <input name="photo_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Logo URL</label>
          <br />
          <input name="logo_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Website URL</label>
          <br />
          <input name="website_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Facebook URL</label>
          <br />
          <input name="facebook_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Instagram URL</label>
          <br />
          <input name="instagram_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>YouTube URL</label>
          <br />
          <input name="youtube_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea name="notes" rows={5} style={{ width: "500px" }} />
        </p>

        <button type="submit">Create Boat</button>
      </form>
    </main>
  );
}
