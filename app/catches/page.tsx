import { supabase } from "../../lib/supabase";

export default async function CatchesPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      line_class,
      points_awarded,
      released,
      tagged,
      species(name),
      boats(name),
      anglers(first_name,last_name),
      events(name)
    `)
    .order("id", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Catches</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      {catches?.length === 0 && (
        <p>No catches entered yet.</p>
      )}

      <ul>
        {catches?.map((c: any) => (
          <li key={c.id}>
          {c.events?.name} |
          {" "}{c.boats?.name} |
          {" "}{c.anglers?.first_name} {c.anglers?.last_name} |
          {" "}{c.species?.name} |
          {" "}{c.weight ? `${c.weight} lbs` : "Released"} |
          {" "}{c.points_awarded} points
</li>
        ))}
      </ul>
    </main>
  );
}