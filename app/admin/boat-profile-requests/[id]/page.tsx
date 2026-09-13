import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { requireRole } from "../../../../lib/auth";
import ConfirmSubmitButton from "../../../components/confirm-submit-button";

async function applyToExistingBoat(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const boatId = Number(formData.get("boat_id"));

  if (!boatId) {
    throw new Error("Please select a boat.");
  }

  const { error } = await supabase.rpc("admin_apply_boat_profile_request", {
    p_request_id: requestId,
    p_boat_id: boatId,
  });

  if (error) throw new Error(error.message);

  redirect(`/boats/${boatId}`);
}

async function createNewBoatFromRequest(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));

  const { data: newBoatId, error } = await supabase.rpc(
    "admin_apply_boat_profile_request",
    { p_request_id: requestId, p_boat_id: null },
  );

  if (error || !newBoatId) {
    throw new Error(error?.message || "Unable to create boat.");
  }

  redirect(`/boats/${newBoatId}`);
}

async function updateRequestStatus(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();
  const requestId = Number(formData.get("request_id"));
  const status = String(formData.get("status") || "new");

  const { error } = await supabase.rpc(
    "admin_update_boat_profile_request_status",
    { p_id: requestId, p_status: status },
  );

  if (error) throw new Error(error.message);

  redirect("/admin/boat-profile-requests");
}

export default async function BoatProfileRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: requestRows }, { data: boats }] = await Promise.all([
    supabase.rpc("admin_get_boat_profile_requests", { p_id: Number(id) }),
    supabase.rpc("admin_get_boats", { p_id: null }),
  ]);
  const request = Array.isArray(requestRows) ? requestRows[0] : null;
  const canApply = request?.status === "new" || request?.status === "reviewed";

  if (!request) {
    return (
      <main className="panel">
        <h1>Boat Profile Request</h1>
        <p>Request not found.</p>
      </main>
    );
  }

  return (
    <main className="panel">
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
          <select name="boat_id" defaultValue="" disabled={!canApply}>
            <option value="">-- Select Boat --</option>
            {boats?.map((boat: any) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>
        </p>

        <ConfirmSubmitButton
          confirmation="Apply this request to the selected boat? Existing profile fields from the request will be replaced."
          disabled={!canApply}
        >
          Apply To Existing Boat
        </ConfirmSubmitButton>
      </form>

      <hr />

      <h2>Create New Boat From Request</h2>

      <form action={createNewBoatFromRequest}>
        <input type="hidden" name="request_id" value={request.id} />

        <p>
          This will create a new boat named <strong>{request.boat_name}</strong>{" "}
          using the submitted profile information.
        </p>

        <ConfirmSubmitButton
          confirmation={`Create a new boat named ${request.boat_name} and mark this request applied?`}
          disabled={!canApply}
        >
          Create New Boat
        </ConfirmSubmitButton>
      </form>

      {!canApply && (
        <p className="alert alert-warning">
          This request is already {request.status}. Change it to new or reviewed before applying it again.
        </p>
      )}

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
