import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import SearchableMultiSelect from "../../../components/searchable-multi-select";

async function uploadBoatMedia(file: File | null, boatId: number, type: "photo" | "logo") {
  if (!file || file.size === 0) return null;

  const supabase = await createClient();
  const extension = file.name.split(".").pop();
  const filePath = `boats/${boatId}/${type}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("boat-media")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("boat-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function updateBoat(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));

  try {
    const supabase = await createClient();
    const ownerAnglerIds = formData
      .getAll("owner_angler_ids")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);

    const photoFile = formData.get("photo_file") as File | null;
    const logoFile = formData.get("logo_file") as File | null;

    const uploadedPhotoUrl = await uploadBoatMedia(photoFile, id, "photo");
    const uploadedLogoUrl = await uploadBoatMedia(logoFile, id, "logo");

    const currentPhotoUrl = String(formData.get("photo_url") || "");
    const currentLogoUrl = String(formData.get("logo_url") || "");

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
        photo_url: uploadedPhotoUrl || currentPhotoUrl,
        logo_url: uploadedLogoUrl || currentLogoUrl,
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
      .eq("id", id);

    if (error) {
      redirect(`/admin/boats/${id}?error=${encodeURIComponent(error.message)}`);
    }

    // Replace owner links in one save to keep boat owners in sync with the form.
    const { error: deleteOwnersError } = await supabase
      .from("boat_owners")
      .delete()
      .eq("boat_id", id);

    if (deleteOwnersError) {
      redirect(
        `/admin/boats/${id}?error=${encodeURIComponent(deleteOwnersError.message)}`,
      );
    }

    if (ownerAnglerIds.length > 0) {
      const { error: insertOwnersError } = await supabase.from("boat_owners").insert(
        ownerAnglerIds.map((anglerId) => ({
          boat_id: id,
          angler_id: anglerId,
        })),
      );

      if (insertOwnersError) {
        redirect(
          `/admin/boats/${id}?error=${encodeURIComponent(insertOwnersError.message)}`,
        );
      }
    }

    redirect(`/boats/${id}`);
  } catch (error) {
    // Next.js redirect() throws an internal redirect error; do not treat it as a save failure.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    redirect(`/admin/boats/${id}?error=${encodeURIComponent(message)}`);
  }
}

export default async function EditBoatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: saveError } = await searchParams;

  try {
    const supabase = await createClient();

    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (boatError) {
      return (
        <main className="panel">
          <h1>Edit Boat</h1>
          <p className="alert alert-danger">Error loading boat: {boatError.message}</p>
        </main>
      );
    }

    const { data: anglers, error: anglersError } = await supabase
      .from("anglers")
      .select("id,first_name,last_name")
      .order("last_name");

    const { data: ownerLinks, error: ownerLinksError } = await supabase
      .from("boat_owners")
      .select("angler_id")
      .eq("boat_id", Number(id));

    const currentOwnerIds = new Set((ownerLinks || []).map((row: any) => row.angler_id));

    if (!boat) {
      return (
        <main className="panel">
          <h1>Edit Boat</h1>
          <p>Boat not found.</p>
        </main>
      );
    }

    return (
      <main className="panel">
        <h1>Edit Boat</h1>

        {saveError && (
          <p className="alert alert-danger">
            Save failed: {saveError}
          </p>
        )}

        {anglersError && (
          <p className="alert alert-danger">
            Warning: could not load angler list ({anglersError.message})
          </p>
        )}

        {ownerLinksError && (
          <p className="alert alert-danger">
            Warning: owner links unavailable ({ownerLinksError.message})
          </p>
        )}

        <form action={updateBoat}>
        <input type="hidden" name="id" value={boat.id} />

        <div className="form-grid">

        <p className="field field-full">
          <label>Boat Name</label>
          <input name="name" defaultValue={boat.name} required />
        </p>

        <p className="field">
          <label>Make</label>
          <input name="make" defaultValue={boat.make || ""} />
        </p>

        <p className="field">
          <label>Model</label>
          <input name="model" defaultValue={boat.model || ""} />
        </p>

        <p className="field">
          <label>Year</label>
          <input name="year" type="number" defaultValue={boat.year || ""} />
        </p>

        <p className="field">
          <label>Length</label>
          <input name="length_feet" type="number" step="0.1" defaultValue={boat.length_feet || ""} />
        </p>

        <p className="field">
          <label>Home Port</label>
          <input name="home_port" defaultValue={boat.home_port || ""} />
        </p>

        <hr className="field-full" />

        <h2 className="field-full">Team / Owner Contact</h2>

        <p className="field">
          <label>Captain Name</label>
          <input name="captain_name" defaultValue={boat.captain_name || ""} />
        </p>

        <p className="field">
          <label>Captain Email</label>
          <input name="captain_email" type="email" defaultValue={boat.captain_email || ""} />
        </p>

        <p className="field">
          <label>Owner Name</label>
          <input name="owner_name" defaultValue={boat.owner_name || ""} />
        </p>

        <p className="field">
          <label>Owner Email</label>
          <input name="owner_email" type="email" defaultValue={boat.owner_email || ""} />
        </p>

          <div className="field field-full">
            <SearchableMultiSelect
              label="Linked Owner Accounts (multiple)"
              name="owner_angler_ids"
              options={(anglers || []).map((angler: any) => ({
                value: String(angler.id),
                label: `${angler.last_name}, ${angler.first_name}`,
              }))}
              defaultSelectedValues={Array.from(currentOwnerIds).map((value) => String(value))}
            />
          </div>

        <hr className="field-full" />

        <h2 className="field-full">Media / Links</h2>

        {boat.photo_url && (
          <p className="field field-full">
            <strong>Current Boat Photo:</strong>
            <br />
            <img src={boat.photo_url} alt={boat.name} className="media-preview" style={{ maxWidth: "300px" }} />
          </p>
        )}

        <p className="field field-full">
          <label>Upload New Boat Photo</label>
          <input name="photo_file" type="file" accept="image/*" />
        </p>

        <p className="field field-full">
          <label>Photo URL</label>
          <input name="photo_url" defaultValue={boat.photo_url || ""} />
        </p>

        {boat.logo_url && (
          <p className="field field-full">
            <strong>Current Logo:</strong>
            <br />
            <img src={boat.logo_url} alt={`${boat.name} logo`} className="media-preview" style={{ maxWidth: "200px" }} />
          </p>
        )}

        <p className="field field-full">
          <label>Upload New Logo</label>
          <input name="logo_file" type="file" accept="image/*" />
        </p>

        <p className="field field-full">
          <label>Logo URL</label>
          <input name="logo_url" defaultValue={boat.logo_url || ""} />
        </p>

        <p className="field field-full">
          <label>Website URL</label>
          <input name="website_url" defaultValue={boat.website_url || ""} />
        </p>

        <p className="field field-full">
          <label>Facebook URL</label>
          <input name="facebook_url" defaultValue={boat.facebook_url || ""} />
        </p>

        <p className="field field-full">
          <label>Instagram URL</label>
          <input name="instagram_url" defaultValue={boat.instagram_url || ""} />
        </p>

        <p className="field field-full">
          <label>YouTube URL</label>
          <input name="youtube_url" defaultValue={boat.youtube_url || ""} />
        </p>

        <p className="field field-full">
          <label>Notes</label>
          <textarea name="notes" defaultValue={boat.notes || ""} rows={5} />
        </p>

          <p className="field-full">
            <button type="submit" className="btn">Save Boat</button>
          </p>
          </div>
        </form>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return (
      <main className="panel">
        <h1>Edit Boat</h1>
        <p className="alert alert-danger">Error loading boat page: {message}</p>
      </main>
    );
  }
}
