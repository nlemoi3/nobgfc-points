import { supabase } from "../../lib/supabase";

export default async function RostersPage() {
  const { data: rosters, error } = await supabase
    .from("event_rosters")
    .select(`
      id,
      is_guest,
      events(name),
      boats(name),
      anglers(first_name,last_name)
    `);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Tournament Rosters</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      {rosters?.length === 0 && (
        <p>No roster entries yet.</p>
      )}

      <ul>
        {rosters?.map((r: any) => (
          <li key={r.id}>
            {r.events?.name} | {r.boats?.name} |{" "}
            {r.anglers?.first_name} {r.anglers?.last_name}
            {r.is_guest ? " (Guest)" : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}