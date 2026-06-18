import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminBoatProfileRequestsPage() {
  noStore();

  const { data: requests, error } = await supabase
    .from("boat_profile_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Profile Requests</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      {requests?.length === 0 && (
        <p>No requests submitted yet.</p>
      )}

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
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
              <td>{formatDate(request.created_at)}</td>

              <td>{request.boat_name}</td>

              <td>
                {request.contact_name}
                <br />
                {request.contact_email}
              </td>

              <td>
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

              <td>
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

              <td>{request.notes || "-"}</td>

              <td>
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
    </main>
  );
}