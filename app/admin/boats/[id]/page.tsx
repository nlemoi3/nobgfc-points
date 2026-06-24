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
        <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
          <h1>Edit Boat</h1>
          <p style={{ color: "red" }}>Error loading boat: {boatError.message}</p>
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
        <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
          <h1>Edit Boat</h1>
          <p>Boat not found.</p>
        </main>
      );
    }

    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Boat</h1>

        {saveError && (
          <p style={{ color: "red", background: "#fff0f0", padding: "10px", borderRadius: "4px" }}>
            Save failed: {saveError}
          </p>
        )}

        {anglersError && (
          <p style={{ color: "red", background: "#fff0f0", padding: "10px", borderRadius: "4px" }}>
            Warning: could not load angler list ({anglersError.message})
          </p>
        )}

        {ownerLinksError && (
          <p style={{ color: "red", background: "#fff0f0", padding: "10px", borderRadius: "4px" }}>
            Warning: owner links unavailable ({ownerLinksError.message})
          </p>
        )}

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

          <SearchableMultiSelect
            label="Linked Owner Accounts (multiple)"
            name="owner_angler_ids"
            options={(anglers || []).map((angler: any) => ({
              value: String(angler.id),
              label: `${angler.last_name}, ${angler.first_name}`,
            }))}
            defaultSelectedValues={Array.from(currentOwnerIds).map((value) => String(value))}
          />

        <hr />

        <h2>Media / Links</h2>

        {boat.photo_url && (
          <p>
            <strong>Current Boat Photo:</strong>
            <br />
            <img src={boat.photo_url} alt={boat.name} style={{ maxWidth: "300px" }} />
          </p>
        )}

        <p>
          <label>Upload New Boat Photo</label>
          <br />
          <input name="photo_file" type="file" accept="image/*" />
        </p>

        <p>
          <label>Photo URL</label>
          <br />
          <input name="photo_url" defaultValue={boat.photo_url || ""} style={{ width: "500px" }} />
        </p>

        {boat.logo_url && (
          <p>
            <strong>Current Logo:</strong>
            <br />
            <img src={boat.logo_url} alt={`${boat.name} logo`} style={{ maxWidth: "200px" }} />
          </p>
        )}

        <p>
          <label>Upload New Logo</label>
          <br />
          <input name="logo_file" type="file" accept="image/*" />
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Boat</h1>
        <p style={{ color: "red" }}>Error loading boat page: {message}</p>
      </main>
    );
  }
}
