import { supabase } from "../../lib/supabase";

export default async function AnglersPage() {
  const result = await supabase
    .from("anglers")
    .select("*")
    .order("last_name");

  return (
    <main style={{ padding: "40px" }}>
      <h1>Anglers Debug</h1>

      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}