import { supabase } from "../../../lib/supabase";

export default async function BoatProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boatId = Number(id);

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", boatId)
    .single();

  const { data: catches } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      released,
      tagged,
      catch_datetime,
      species(name),
      anglers(first_name,last_name),
      events(name)
    `)
    .eq("boat_id", boatId);

  if (!boat) {
    return <main style={{ padding: "40px" }}>Boat not found.</main>;
  }

  const officialPoints =
  catches?.reduce(
    (total: number, c: any) => total + Number(c.points_awarded || 0),
    0
  ) || 0;

  const blueMarlinCount =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin").length || 0;

  const largestFish = [...(catches || [])]
    .filter((c: any) => c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>{boat.name}</h1>

      {boat.logo_url && <img src={boat.logo_url} alt={`${boat.name} logo`} style={{ maxWidth: "200px" }} />}
      {boat.photo_url && <img src={boat.photo_url} alt={boat.name} style={{ maxWidth: "500px", display: "block", marginTop: "20px" }} />}

      <p>
        {boat.year || ""} {boat.make || ""} {boat.model || ""}
        {boat.length_feet ? ` — ${boat.length_feet} ft` : ""}
      </p>

      <p>{boat.home_port || ""}</p>

      <p>
        Official Points: <strong>{officialPoints.toFixed(1)}</strong><br />
        Blue Marlin Count: <strong>{blueMarlinCount}</strong>
      </p>

      <p>
        {boat.website_url && <a href={boat.website_url}>Website</a>}{" "}
        {boat.facebook_url && <a href={boat.facebook_url}>Facebook</a>}{" "}
        {boat.instagram_url && <a href={boat.instagram_url}>Instagram</a>}{" "}
        {boat.youtube_url && <a href={boat.youtube_url}>YouTube</a>}
      </p>

      {boat.notes && <p>{boat.notes}</p>}

      <h2>Largest Fish</h2>
      {largestFish ? (
        <p>
          {largestFish.species?.name}: {largestFish.weight} lbs
        </p>
      ) : (
        <p>No weighed fish yet.</p>
      )}

      <h2>Catch History</h2>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Event</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Released</th>
            <th>Tagged</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {catches?.map((c: any) => (
            <tr key={c.id}>
              <td>{c.events?.name}</td>
              <td>{c.anglers?.first_name} {c.anglers?.last_name}</td>
              <td>{c.species?.name}</td>
              <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>
              <td>{c.points_awarded}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}