import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export default async function AdminBoatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  noStore();

  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const supabase = await createClient();
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  const filteredBoats = query
    ? (boats || []).filter((boat: any) => {
        const haystack = [
          boat.name,
          boat.make,
          boat.model,
          boat.home_port,
          boat.owner_name,
          boat.captain_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
    : (boats || []);

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Boats</h1>
        <Link href="/admin/boats/new" className="btn">
          + Add Boat
        </Link>
      </div>

      {error && <p className="alert alert-danger">Error: {error.message}</p>}

      <form className="searchbar" method="get" action="/admin/boats">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search boats by name, make/model, port, owner, or captain"
          aria-label="Search admin boats"
        />
        <button type="submit" className="btn">Search</button>
        {q && (
          <Link href="/admin/boats" className="btn btn-ghost">Clear</Link>
        )}
      </form>

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
          {filteredBoats.map((boat: any) => (
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
