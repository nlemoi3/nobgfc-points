import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../lib/supabase";

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

export default async function CatchesPage() {
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
    line_class,
    catch_datetime,
    photo_url,
    boats(id,name),
    anglers(id,first_name,last_name),
    species(name),
    events(id,name)
  `)
  .eq("status", "approved")
  .order("catch_datetime", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Catches</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Date/Time</th>
            <th>Event</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Line</th>
            <th>Released</th>
            <th>Tagged</th>
            <th>Points</th>
          </tr>
        </thead>

        <tbody>
          {catches?.map((c: any) => (
            <tr key={c.id}>
              <td>
                {c.photo_url ? (
                  <a href={c.photo_url} target="_blank">
                    <img
                      src={c.photo_url}
                      alt="Catch"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>
                <Link href={`/catches/${c.id}`}>
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
                <Link href={`/catches/${c.id}`}>{c.species?.name}</Link>
              </td>
              <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
              <td>{c.line_class || "-"}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
