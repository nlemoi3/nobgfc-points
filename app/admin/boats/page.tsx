import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export default async function AdminBoatsPage() {
  noStore();

  const supabase = await createClient();
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Boats</h1>
        <Link href="/admin/boats/new" className="btn">
          + Add Boat
        </Link>
      </div>

      {error && <p className="alert alert-danger">Error: {error.message}</p>}

      <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Boat</th>
            <th>Make</th>
            <th>Model</th>
            <th>Length</th>
            <th>Home Port</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {boats?.map((boat: any) => (
            <tr key={boat.id}>
              <td>
                <Link href={`/boats/${boat.id}`}>{boat.name}</Link>
              </td>
              <td>{boat.make || "-"}</td>
              <td>{boat.model || "-"}</td>
              <td>{boat.length_feet ? `${boat.length_feet} ft` : "-"}</td>
              <td>{boat.home_port || "-"}</td>
              <td>
                <Link href={`/admin/boats/${boat.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
