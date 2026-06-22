import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function speciesName(c: any) {
  return c.species?.name || "";
}

function getLargestByYear(catches: any[], speciesList: string[]) {
  const byYear: Record<number, any> = {};

  catches.forEach((c: any) => {
    if (!c.weight || !c.catch_datetime) return;
    if (!speciesList.includes(speciesName(c))) return;

    const year = new Date(c.catch_datetime).getFullYear();

    if (!byYear[year] || Number(c.weight) > Number(byYear[year].weight)) {
      byYear[year] = c;
    }
  });

  return Object.entries(byYear)
    .map(([year, catchRecord]) => ({
      year: Number(year),
      catchRecord,
    }))
    .sort((a, b) => b.year - a.year);
}

function ProgressionTable({
  title,
  rows,
}: {
  title: string;
  rows: { year: number; catchRecord: any }[];
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2>{title}</h2>

      {rows.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Weight</th>
              <th>Angler</th>
              <th>Boat</th>
              <th>Event</th>
              <th>Date</th>
              <th>Photo</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(({ year, catchRecord }) => (
              <tr key={`${title}-${year}`}>
                <td>{year}</td>
                <td>
                  <Link href={`/catches/${catchRecord.id}`}>
                    {catchRecord.weight} lbs
                  </Link>
                </td>
                <td>
                  {catchRecord.anglers?.id ? (
                    <Link href={`/anglers/${catchRecord.anglers.id}`}>
                      {catchRecord.anglers?.first_name}{" "}
                      {catchRecord.anglers?.last_name}
                    </Link>
                  ) : (
                    <>
                      {catchRecord.anglers?.first_name}{" "}
                      {catchRecord.anglers?.last_name}
                    </>
                  )}
                </td>
                <td>
                  {catchRecord.boats?.id ? (
                    <Link href={`/boats/${catchRecord.boats.id}`}>
                      {catchRecord.boats?.name}
                    </Link>
                  ) : (
                    catchRecord.boats?.name
                  )}
                </td>
                <td>
                  {catchRecord.events?.id ? (
                    <Link href={`/tournaments/${catchRecord.events.id}`}>
                      {catchRecord.events?.name}
                    </Link>
                  ) : (
                    catchRecord.events?.name
                  )}
                </td>
                <td>{formatDate(catchRecord.catch_datetime)}</td>
                <td>
                  {catchRecord.photo_url ? (
                    <a href={catchRecord.photo_url} target="_blank">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function RecordProgressionsPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      catch_datetime,
      photo_url,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name)
    `)
    .eq("status", "approved");

  const approvedCatches = catches || [];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Record Progressions</h1>

      <p>
        Largest recorded fish by species for each season.
      </p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <ProgressionTable
        title="Blue Marlin"
        rows={getLargestByYear(approvedCatches, ["Blue Marlin"])}
      />

      <ProgressionTable
        title="White Marlin"
        rows={getLargestByYear(approvedCatches, ["White Marlin"])}
      />

      <ProgressionTable
        title="Swordfish"
        rows={getLargestByYear(approvedCatches, ["Swordfish"])}
      />

      <ProgressionTable
        title="Tuna"
        rows={getLargestByYear(approvedCatches, [
          "Yellowfin Tuna",
          "Bigeye Tuna",
        ])}
      />

      <ProgressionTable
        title="Wahoo"
        rows={getLargestByYear(approvedCatches, ["Wahoo"])}
      />

      <ProgressionTable
        title="Dolphin"
        rows={getLargestByYear(approvedCatches, ["Dolphin"])}
      />
    </main>
  );
}
