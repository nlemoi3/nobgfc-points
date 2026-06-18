import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function BoatsPage() {
  const { data: boats, error } = await supabase
    .from("boats")
    .select("*")
    .order("name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boats</h1>

      {error && <p style={{ color: "red" }}>Error loading boats: {error.message}</p>}

      <ul>
        {boats?.map((boat: any) => (
          <li key={boat.id}>
            <Link href={`/boats/${boat.id}`}>{boat.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}