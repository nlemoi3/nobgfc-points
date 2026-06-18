import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";

export default async function AdminAnglersPage() {
  noStore();

  const { data: anglers, error } = await supabase
    .from("anglers")
    .select("*")
    .order("last_name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Manage Anglers</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Angler</th>
            <th>Member</th>
            <th>Youth</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {anglers?.map((angler: any) => (
            <tr key={angler.id}>
              <td>
                {angler.first_name} {angler.last_name}
              </td>
              <td>{angler.is_member ? "Yes" : "No"}</td>
              <td>{angler.is_youth ? "Yes" : "No"}</td>
              <td>
                <Link href={`/admin/anglers/${angler.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}