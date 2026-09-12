import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../lib/supabase";
import { formatCatchWeight } from "../../lib/scoring";
import { getActiveSeasonRange } from "../../lib/season";

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
  const { year: seasonYear, start: seasonStart, end: seasonEnd } =
    await getActiveSeasonRange(supabase);

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
  .gte("catch_datetime", seasonStart)
  .lt("catch_datetime", seasonEnd)
  .order("catch_datetime", { ascending: false });

  return (
    <main className="panel">
      <h1>{seasonYear} Approved Catches</h1>
      <p>Approved catch records for the active club season.</p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {!error && (!catches || catches.length === 0) ? (
        <p>No approved catches have been recorded for {seasonYear}.</p>
      ) : (
      <div className="table-wrap" role="region" aria-label={`${seasonYear} approved catches`} tabIndex={0}>
      <table className="admin-table">
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
              <td>{formatCatchWeight(c)}</td>
              <td>{c.line_class || "-"}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
    </main>
  );
}
