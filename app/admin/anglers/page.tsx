import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export default async function AdminAnglersPage() {
  noStore();

  const supabase = await createClient();
  const { data: anglers, error } = await supabase
    .from("anglers")
    .select("*")
    .order("last_name");

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Anglers</h1>
        <Link href="/admin/anglers/new" className="btn">
          + Add Angler
        </Link>
      </div>

      {error && <p className="alert alert-danger">Error: {error.message}</p>}

      <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Angler</th>
            <th>Member</th>
            <th>Youth</th>
            <th>Email</th>
            <th>Phone</th>
            <th>User ID</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {anglers?.map((angler: any) => (
            <tr key={angler.id}>
              <td>
                <Link href={`/anglers/${angler.id}`}>
                  {angler.first_name} {angler.last_name}
                </Link>
              </td>
              <td>{angler.is_member ? "Yes" : "No"}</td>
              <td>{angler.is_youth ? "Yes" : "No"}</td>
              <td>{angler.email || "—"}</td>
              <td>{angler.phone_number || "—"}</td>
              <td className="mono">
                {angler.user_id || "—"}
              </td>
              <td>
                <Link href={`/admin/anglers/${angler.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
