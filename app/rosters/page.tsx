import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function RostersPage() {
  const { data: rosters, error } = await supabase
    .from("event_rosters")
    .select(`
      id,
      is_guest,
      events(id,name),
      boats(id,name),
      anglers(id,first_name,last_name)
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
            {r.events?.id ? (
              <Link href={`/tournaments/${r.events.id}`}>{r.events?.name}</Link>
            ) : (
              r.events?.name
            )}{" "}
            |{" "}
            {r.boats?.id ? (
              <Link href={`/boats/${r.boats.id}`}>{r.boats?.name}</Link>
            ) : (
              r.boats?.name
            )}{" "}
            |{" "}
            {r.anglers?.id ? (
              <Link href={`/anglers/${r.anglers.id}`}>
                {r.anglers?.first_name} {r.anglers?.last_name}
              </Link>
            ) : (
              <>
                {r.anglers?.first_name} {r.anglers?.last_name}
              </>
            )}
            {r.is_guest ? " (Guest)" : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
