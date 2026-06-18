import Link from "next/link";
import { supabase } from "../../../lib/supabase";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AnglerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anglerId = Number(id);

  const { data: angler } = await supabase
    .from("anglers")
    .select("*")
    .eq("id", anglerId)
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
      photo_url,
      boats(id,name),
      species(name),
      events(name)
    `)
    .eq("angler_id", anglerId)
    .eq("status", "approved")
    .order("catch_datetime", { ascending: false });

  if (!angler) {
    return <main style={{ padding: "40px" }}>Angler not found.</main>;
  }

  const totalPoints =
    catches?.reduce(
      (total: number, c: any) => total + Number(c.points_awarded || 0),
      0
    ) || 0;

  const blueMarlinCount =
    catches?.filter((c: any) => c.species?.name === "Blue Marlin").length || 0;

  const largestFish = [...(catches || [])]
    .filter((c: any) => c.weight)
    .sort((a: any, b: any) => b.weight - a.weight)[0];

  const boatsFished = Array.from(
    new Set((catches || []).map((c: any) => c.boats?.name).filter(Boolean))
  );

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/anglers">← Back to Anglers</Link>
      </p>

      <h1>
        {angler.first_name} {angler.last_name}
      </h1>

      {angler.photo_url && (
        <img
          src={angler.photo_url}
          alt={`${angler.first_name} ${angler.last_name}`}
          style={{
            maxWidth: "300px",
            display: "block",
            marginBottom: "20px",
          }}
        />
      )}

      <p>
        {angler.is_member ? "Member" : "Guest"}
        {angler.is_youth ? " • Youth Angler" : ""}
      </p>

      {angler.biography && <p>{angler.biography}</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Total Points</h3>
          <p><strong>{totalPoints.toFixed(1)}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Total Catches</h3>
          <p><strong>{catches?.length || 0}</strong></p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Blue Marlin Count</h3>
          <p><strong>{blueMarlinCount}</strong></p>
        </div>
      </div>

      <h2>Largest Fish</h2>

      {largestFish ? (
        <div style={{ border: "1px solid #ccc", padding: "15px", maxWidth: "320px" }}>
          {largestFish.photo_url && (
            <img
              src={largestFish.photo_url}
              alt="Largest fish"
              style={{ maxWidth: "280px", display: "block", marginBottom: "10px" }}
            />
          )}

          <p>
            <strong>{largestFish.species?.name}</strong>
            <br />
            {largestFish.weight} lbs
            <br />
            {formatDateTime(largestFish.catch_datetime)}
          </p>
        </div>
      ) : (
        <p>No weighed fish yet.</p>
      )}

      <h2>Boats Fished</h2>

      {boatsFished.length > 0 ? (
        <ul>
          {boatsFished.map((boat: any) => (
            <li key={boat}>{boat}</li>
          ))}
        </ul>
      ) : (
        <p>No boats recorded yet.</p>
      )}

      <h2>Catch History</h2>

      {catches?.length === 0 ? (
        <p>No approved catches yet.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Photo</th>
              <th>Date</th>
              <th>Event</th>
              <th>Boat</th>
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
                <td>
                  {c.photo_url ? (
                    <a href={c.photo_url} target="_blank">
                      <img
                        src={c.photo_url}
                        alt="Catch"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{formatDateTime(c.catch_datetime)}</td>
                <td>{c.events?.name}</td>
                <td>
                  {c.boats?.id ? (
                    <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                  ) : (
                    c.boats?.name
                  )}
                </td>
                <td>{c.species?.name}</td>
                <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
                <td>{c.released ? "Yes" : "No"}</td>
                <td>{c.tagged ? "Yes" : "No"}</td>
                <td>{c.points_awarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}