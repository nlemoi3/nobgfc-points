import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function applyToExistingBoat(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const boatId = Number(formData.get("boat_id"));
  const status = String(formData.get("status") || "applied");

  if (!boatId) {
    throw new Error("Please select a boat.");
  }

  const { data: request } = await supabase
    .from("boat_profile_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) {
    throw new Error("Request not found.");
  }

  const { error: boatError } = await supabase
    .from("boats")
    .update({
      make: request.make,
      model: request.model,
      year: request.year,
      length_feet: request.length_feet,
      home_port: request.home_port,
      website_url: request.website_url,
      facebook_url: request.facebook_url,
      instagram_url: request.instagram_url,
      youtube_url: request.youtube_url,
      notes: request.notes,
      profile_status: "approved",
    })
    .eq("id", boatId);

  if (boatError) throw new Error(boatError.message);

  const { error: requestError } = await supabase
    .from("boat_profile_requests")
    .update({ status })
    .eq("id", requestId);

  if (requestError) throw new Error(requestError.message);

  redirect(`/boats/${boatId}`);
}

async function createNewBoatFromRequest(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));

  const { data: request } = await supabase
    .from("boat_profile_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) {
    throw new Error("Request not found.");
  }

  const { data: newBoat, error: boatError } = await supabase
    .from("boats")
    .insert({
      name: request.boat_name,
      make: request.make,
      model: request.model,
      year: request.year,
      length_feet: request.length_feet,
      home_port: request.home_port,
      website_url: request.website_url,
      facebook_url: request.facebook_url,
      instagram_url: request.instagram_url,
      youtube_url: request.youtube_url,
      notes: request.notes,
      captain_name: request.contact_name,
      captain_email: request.contact_email,
      profile_status: "approved",
      active: true,
    })
    .select("id")
    .single();

  if (boatError) throw new Error(boatError.message);

  const { error: requestError } = await supabase
    .from("boat_profile_requests")
    .update({ status: "applied" })
    .eq("id", requestId);

  if (requestError) throw new Error(requestError.message);

  redirect(`/boats/${newBoat.id}`);
}

async function updateRequestStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const status = String(formData.get("status") || "new");

  const { error } = await supabase
    .from("boat_profile_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  redirect("/admin/boat-profile-requests");
}

export default async function BoatProfileRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("boat_profile_requests")
    .select("*")
    .eq("id", Number(id))
    .single();

  const { data: boats } = await supabase
    .from("boats")
    .select("id,name")
    .order("name");

  if (!request) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Boat Profile Request</h1>
        <p>Request not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Profile Request</h1>

      <p><strong>Boat:</strong> {request.boat_name}</p>
      <p><strong>Contact:</strong> {request.contact_name}</p>
      <p><strong>Email:</strong> {request.contact_email}</p>
      <p><strong>Status:</strong> {request.status || "new"}</p>

      <h2>Requested Details</h2>

      <p>
        {[request.year, request.make, request.model].filter(Boolean).join(" ")}
        {request.length_feet ? ` — ${request.length_feet} ft` : ""}
      </p>

      {request.home_port && <p><strong>Home Port:</strong> {request.home_port}</p>}
      {request.website_url && <p><strong>Website:</strong> {request.website_url}</p>}
      {request.facebook_url && <p><strong>Facebook:</strong> {request.facebook_url}</p>}
      {request.instagram_url && <p><strong>Instagram:</strong> {request.instagram_url}</p>}
      {request.youtube_url && <p><strong>YouTube:</strong> {request.youtube_url}</p>}
      {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}

      <hr />

      <h2>Apply To Existing Boat</h2>

      <form action={applyToExistingBoat}>
        <input type="hidden" name="request_id" value={request.id} />

        <p>
          <label>Select Existing Boat</label>
          <br />
          <select name="boat_id" defaultValue="">
            <option value="">-- Select Boat --</option>
            {boats?.map((boat: any) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>
        </p>

        <input type="hidden" name="status" value="applied" />

        <button type="submit">Apply To Existing Boat</button>
      </form>

      <hr />

      <h2>Create New Boat From Request</h2>

      <form action={createNewBoatFromRequest}>
        <input type="hidden" name="request_id" value={request.id} />

        <p>
          This will create a new boat named <strong>{request.boat_name}</strong>{" "}
          using the submitted profile information.
        </p>

        <button type="submit">Create New Boat</button>
      </form>

      <hr />

      <h2>Update Request Status Only</h2>

      <form action={updateRequestStatus}>
        <input type="hidden" name="request_id" value={request.id} />

        <select name="status" defaultValue={request.status || "new"}>
          <option value="new">new</option>
          <option value="reviewed">reviewed</option>
          <option value="applied">applied</option>
          <option value="rejected">rejected</option>
        </select>

        <br />
        <br />

        <button type="submit">Save Status Only</button>
      </form>
    </main>
  );
}
