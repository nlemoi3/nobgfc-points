import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { formatCatchWeight } from "../../../lib/scoring";

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

export default async function AdminCatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  noStore();

  const { created } = await searchParams;
  const supabase = await createClient();

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
      eligibility_notes,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name)
    `)
    .order("id", { ascending: false });

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Catches</h1>
        <Link href="/admin/catch-entry" className="btn">
          + Add Catch
        </Link>
      </div>

      {created === "1" && (
        <p className="alert">Catch saved as pending and ready for review.</p>
      )}

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
            <th>Review Notes</th>
            <th>Points</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {catches?.map((c: any) => (
            <tr key={c.id}>
              <td>
                <Link href={`/admin/catches/${c.id}`}>
                  {formatDateTime(c.catch_datetime)}
                </Link>
              </td>
              <td>
                {c.events?.id ? (
                  <Link href={`/tournaments/${c.events.id}`}>
                    {c.events?.name}
                  </Link>
                ) : (
                  c.events?.name
                )}
              </td>
              <td>
                {c.boats?.id ? (
                  <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                ) : (
                  c.boats?.name
                )}
              </td>
              <td>
                {c.anglers?.id ? (
                  <Link href={`/anglers/${c.anglers.id}`}>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </Link>
                ) : (
                  <>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </>
                )}
              </td>
              <td>
                {c.species?.name}
              </td>
              <td>{formatCatchWeight(c)}</td>
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

            <td>{c.eligibility_notes || "-"}</td>

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
