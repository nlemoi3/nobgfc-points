import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { requireRole } from "../../../lib/auth";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
}

export default async function AdminBoatProfileRequestsPage() {
  await requireRole("admin");
  noStore();

  const supabase = await createClient();
  const { data: requests, error } = await supabase.rpc(
    "admin_get_boat_profile_requests",
    { p_id: null },
  );

  return (
    <main className="panel">
      <h1>Boat Profile Requests</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      {requests?.length === 0 && (
        <p>No requests submitted yet.</p>
      )}

      <div className="table-wrap mobile-card-wrap" role="region" aria-label="Boat profile requests" tabIndex={0}>
      <table className="admin-table mobile-card-table">
        <thead>
          <tr>
            <th>Submitted</th>
            <th>Boat</th>
            <th>Contact</th>
            <th>Details</th>
            <th>Links</th>
            <th>Notes</th>
            <th>Status / Review</th>
          </tr>
        </thead>

        <tbody>
          {requests?.map((request: any) => (
            <tr key={request.id}>
              <td data-label="Submitted">{formatDate(request.created_at)}</td>

              <td data-label="Boat">{request.boat_name}</td>

              <td data-label="Contact">
                {request.contact_name}
                <br />
                {request.contact_email}
              </td>

              <td data-label="Details">
                {[request.year, request.make, request.model]
                  .filter(Boolean)
                  .join(" ")}
                <br />
                {request.length_feet
                  ? `${request.length_feet} ft`
                  : ""}
                <br />
                {request.home_port || ""}
              </td>

              <td data-label="Links">
                {request.website_url && (
                  <p>Website: {request.website_url}</p>
                )}

                {request.facebook_url && (
                  <p>Facebook: {request.facebook_url}</p>
                )}

                {request.instagram_url && (
                  <p>Instagram: {request.instagram_url}</p>
                )}

                {request.youtube_url && (
                  <p>YouTube: {request.youtube_url}</p>
                )}
              </td>

              <td data-label="Notes">{request.notes || "-"}</td>

              <td data-label="Status / Review">
                <Link
                  href={`/admin/boat-profile-requests/${request.id}`}
                >
                  {request.status || "new"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
