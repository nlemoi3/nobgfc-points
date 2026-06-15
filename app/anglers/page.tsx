import { supabase } from "../../lib/supabase";

export default async function AnglersPage() {
  const { data: anglers, error } = await supabase
    .from("anglers")
    .select("*")
    .order("last_name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Anglers</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error loading anglers: {error.message}
        </p>
      )}

      {anglers?.length === 0 && <p>No anglers entered yet.</p>}

      <ul>
        {anglers?.map((angler) => (
          <li key={angler.id}>
            {angler.first_name} {angler.last_name}
            {angler.is_member ? " — Member" : " — Guest"}
            {angler.is_youth ? " — Youth" : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}