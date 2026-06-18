import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminCatchesPage() {
  noStore();

  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      released,
      tagged,
      status,
      catch_datetime,
      boats(name),
      anglers(first_name,last_name),
      species(name),
      events(name)
    `)
    .order("id", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Manage Catches</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Event</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Released</th>
            <th>Tagged</th>
            <th>Status</th>
            <th>Points</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {catches?.map((c: any) => (
            <tr key={c.id}>
              <td>{formatDateTime(c.catch_datetime)}</td>
              <td>{c.events?.name}</td>
              <td>{c.boats?.name}</td>
              <td>{c.anglers?.first_name} {c.anglers?.last_name}</td>
              <td>{c.species?.name}</td>
              <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>

            <td
              style={{
                fontWeight: "bold",
                color:
                  c.status === "approved"
                    ? "green"
                   : c.status === "pending"
                    ? "orange"
                    : "red",
              }}
            >
              {c.status || "approved"}
            </td>

            <td>{c.points_awarded}</td>
              <td>
                <Link href={`/admin/catches/${c.id}`}>Edit / Delete</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}