import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function RecordsReviewPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      released,
      points_awarded,
      catch_datetime,
      photo_url,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name)
    `)
    .eq("status", "approved");

  const issues =
    catches?.filter((c: any) => {
      return (
        !c.photo_url ||
        !c.catch_datetime ||
        (!c.released && !c.weight) ||
        c.points_awarded === null ||
        (c.released && c.weight)
      );
    }) || [];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Records Review</h1>

      <p>
        Approved catches with missing data that may affect club records.
      </p>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <p>
        <strong>Issues Found:</strong> {issues.length}
      </p>

      <table
        border={1}
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Edit</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Issues</th>
          </tr>
        </thead>

        <tbody>
          {issues.map((c: any) => {
            const problems: string[] = [];

            if (!c.photo_url) problems.push("Missing Photo");
            if (!c.catch_datetime) problems.push("Missing Date");
            if (!c.released && !c.weight) problems.push("Missing Weight");
            if (c.points_awarded === null) problems.push("Missing Points");
            if (c.released && c.weight)
              problems.push("Released Fish Has Weight");

            return (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/catches/${c.id}`}>
                    Edit
                  </Link>
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

                <td>{problems.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
