import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateRequest(formData: FormData) {
  "use server";

  const requestId = Number(formData.get("request_id"));
  const boatId = Number(formData.get("boat_id"));
  const status = String(formData.get("status") || "new");

  if (boatId > 0) {
    const { data: request } = await supabase
      .from("boat_profile_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (request) {
      await supabase
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
        })
        .eq("id", boatId);
    }
  }

  await supabase
    .from("boat_profile_requests")
    .update({
      status,
    })
    .eq("id", requestId);

  redirect("/admin/boat-profile-requests");
}

export default async function BoatProfileRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
      <main style={{ padding: "40px" }}>
        <h1>Boat Profile Request</h1>
        <p>Request not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Profile Request</h1>

      <p>
        <strong>Boat:</strong> {request.boat_name}
      </p>

      <p>
        <strong>Contact:</strong> {request.contact_name}
      </p>

      <p>
        <strong>Email:</strong> {request.contact_email}
      </p>

      <h2>Requested Details</h2>

      <p>
        {[request.year, request.make, request.model]
          .filter(Boolean)
          .join(" ")}
        {request.length_feet
          ? ` — ${request.length_feet} ft`
          : ""}
      </p>

      {request.home_port && (
        <p>
          <strong>Home Port:</strong> {request.home_port}
        </p>
      )}

      {request.website_url && (
        <p>
          <strong>Website:</strong> {request.website_url}
        </p>
      )}

      {request.facebook_url && (
        <p>
          <strong>Facebook:</strong> {request.facebook_url}
        </p>
      )}

      {request.instagram_url && (
        <p>
          <strong>Instagram:</strong> {request.instagram_url}
        </p>
      )}

      {request.youtube_url && (
        <p>
          <strong>YouTube:</strong> {request.youtube_url}
        </p>
      )}

      {request.notes && (
        <p>
          <strong>Notes:</strong> {request.notes}
        </p>
      )}

      <form action={updateRequest}>
        <input
          type="hidden"
          name="request_id"
          value={request.id}
        />

        <h2>Apply To Boat</h2>

        <select
          name="boat_id"
          defaultValue="0"
        >
          <option value="0">
            -- Do Not Apply --
          </option>

          {boats?.map((boat: any) => (
            <option
              key={boat.id}
              value={boat.id}
            >
              {boat.name}
            </option>
          ))}
        </select>

        <br />
        <br />

        <h2>Status</h2>

        <select
          name="status"
          defaultValue={request.status || "new"}
        >
          <option value="new">new</option>
          <option value="reviewed">reviewed</option>
          <option value="applied">applied</option>
          <option value="rejected">rejected</option>
        </select>

        <br />
        <br />

        <button type="submit">
          Save Changes
        </button>
      </form>
    </main>
  );
}