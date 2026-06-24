import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminBoatAwardsPage() {
  const { data: awards, error: awardsError } = await supabase
    .from("boat_awards")
    .select("*")
    .order("award_year", { ascending: false });

  const { data: boats, error: boatsError } = await supabase
    .from("boats")
    .select("id,name");

  const boatNameById: Record<number, string> = {};

  boats?.forEach((boat: any) => {
    boatNameById[boat.id] = boat.name;
  });

  return (
    <main className="panel">
      <h1>Boat Awards</h1>

      <p>
        <Link href="/admin/boat-awards/new">Add Boat Award</Link>
      </p>

      {awardsError && (
        <p style={{ color: "red" }}>Awards Error: {awardsError.message}</p>
      )}

      {boatsError && (
        <p style={{ color: "red" }}>Boats Error: {boatsError.message}</p>
      )}

      {awards?.length === 0 && <p>No boat awards entered yet.</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Award</th>
            <th>Boat</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {awards?.map((award: any) => (
            <tr key={award.id}>
              <td>{award.award_year}</td>
              <td>{award.award_name}</td>
              <td>
                {award.boat_id ? (
                  <Link href={`/boats/${award.boat_id}`}>
                    {boatNameById[award.boat_id] || "Unknown Boat"}
                  </Link>
                ) : (
                  "Unknown Boat"
                )}
              </td>
              <td>{award.notes || "-"}</td>
              <td>
                <Link href={`/admin/boat-awards/${award.id}`}>
                  Edit / Delete
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
