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
    <main className="panel">
      <h1>Add Boat</h1>

      {saveError && (
        <p className="alert alert-danger">
          Save failed: {saveError}
        </p>
      )}

      <form action={createBoat}>
        <div className="form-grid">
        <p className="field field-full">
          <label>Boat Name</label>
          <input name="name" required />
        </p>

        <p className="field">
          <label>Make</label>
          <input name="make" />
        </p>

        <p className="field">
          <label>Model</label>
          <input name="model" />
        </p>

        <p className="field">
          <label>Year</label>
          <input name="year" type="number" />
        </p>

        <p className="field">
          <label>Length</label>
          <input name="length_feet" type="number" step="0.1" />
        </p>

        <p className="field">
          <label>Home Port</label>
          <input name="home_port" />
        </p>

        <hr className="field-full" />

        <h2 className="field-full">Team / Owner Contact</h2>

        <p className="field">
          <label>Captain Name</label>
          <input name="captain_name" />
        </p>

        <p className="field">
          <label>Captain Email</label>
          <input name="captain_email" type="email" />
        </p>

        <p className="field">
          <label>Owner Name</label>
          <input name="owner_name" />
        </p>

        <p className="field">
          <label>Owner Email</label>
          <input name="owner_email" type="email" />
        </p>

        <div className="field field-full">
        <SearchableMultiSelect
          label="Linked Owner Accounts (multiple)"
          name="owner_angler_ids"
          options={(anglers || []).map((angler: any) => ({
            value: String(angler.id),
            label: `${angler.last_name}, ${angler.first_name}`,
          }))}
        />
        </div>

        <hr className="field-full" />

        <h2 className="field-full">Media / Links</h2>

        <p className="field field-full">
          <label>Photo URL</label>
          <input name="photo_url" />
        </p>

        <p className="field field-full">
          <label>Logo URL</label>
          <input name="logo_url" />
        </p>

        <p className="field field-full">
          <label>Website URL</label>
          <input name="website_url" />
        </p>

        <p className="field field-full">
          <label>Facebook URL</label>
          <input name="facebook_url" />
        </p>

        <p className="field field-full">
          <label>Instagram URL</label>
          <input name="instagram_url" />
        </p>

        <p className="field field-full">
          <label>YouTube URL</label>
          <input name="youtube_url" />
        </p>

        <p className="field field-full">
          <label>Notes</label>
          <textarea name="notes" rows={5} />
        </p>

        <p className="field-full">
          <button type="submit" className="btn">Create Boat</button>
        </p>
        </div>
      </form>
    </main>
  );
}
