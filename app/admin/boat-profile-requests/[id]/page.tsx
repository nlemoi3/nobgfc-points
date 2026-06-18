import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateRequestStatus(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("boat_profile_requests")
    .update({
      status: String(formData.get("status") || "new"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

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

      <h2>Status</h2>

      <form action={updateRequestStatus}>
        <input type="hidden" name="id" value={request.id} />

        <select name="status" defaultValue={request.status || "new"}>
          <option value="new">new</option>
          <option value="reviewed">reviewed</option>
          <option value="applied">applied</option>
          <option value="rejected">rejected</option>
        </select>

        <br />
        <br />

        <button type="submit">Save Status</button>
      </form>
    </main>
  );
}