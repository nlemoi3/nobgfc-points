import { supabase } from "../../lib/supabase";

export default async function BoatsPage() {
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  return (
    <main style={{ padding: "40px" }}>
      <h1>Boats</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error loading boats: {error.message}
        </p>
      )}

      <ul>
        {boats?.map((boat) => (
          <li key={boat.id}>{boat.name}</li>
        ))}
      </ul>
    </main>
  );
}