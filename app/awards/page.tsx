import { supabase } from "../../lib/supabase";

export default async function AwardsPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      weight,
      species(name),
      anglers(first_name,last_name),
      boats(name),
      events(name)
    `);

  const speciesAwards: Record<string, any> = {};

  catches?.forEach((c: any) => {
    const species = c.species?.name;

    if (!species || !c.weight) return;

    if (
      !speciesAwards[species] ||
      c.weight > speciesAwards[species].weight
    ) {
      speciesAwards[species] = c;
    }
  });

  const awards = Object.entries(speciesAwards).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Annual Awards</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Species</th>
            <th>Weight</th>
            <th>Angler</th>
            <th>Boat</th>
            <th>Event</th>
          </tr>
        </thead>

        <tbody>
          {awards.map(([species, catchRecord]: any) => (
            <tr key={species}>
              <td>{species}</td>
              <td>{catchRecord.weight} lbs</td>
              <td>
                {catchRecord.anglers?.first_name}{" "}
                {catchRecord.anglers?.last_name}
              </td>
              <td>{catchRecord.boats?.name}</td>
              <td>{catchRecord.events?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
