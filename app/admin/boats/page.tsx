import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";

export default async function AdminBoatsPage() {
  noStore();

  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Manage Boats</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
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
    </main>
  );
}
