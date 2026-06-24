import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminAwardsPage() {
  const { data: awards, error: awardsError } = await supabase
    .from("angler_awards")
    .select("*")
    .order("award_year", { ascending: false });

  const { data: anglers, error: anglersError } = await supabase
    .from("anglers")
    .select("id,first_name,last_name");

  const anglerNameById: Record<number, string> = {};

  anglers?.forEach((angler: any) => {
    anglerNameById[angler.id] =
      `${angler.first_name || ""} ${angler.last_name || ""}`.trim();
  });

  return (
    <main className="panel">
      <h1>Angler Awards</h1>

      <p>
        <Link href="/admin/awards/new">Add Award</Link>
      </p>

      {awardsError && (
        <p style={{ color: "red" }}>Awards Error: {awardsError.message}</p>
      )}

      {anglersError && (
        <p style={{ color: "red" }}>Anglers Error: {anglersError.message}</p>
      )}

      {awards?.length === 0 && <p>No angler awards entered yet.</p>}

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Award</th>
            <th>Angler</th>
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
                {award.angler_id ? (
                  <Link href={`/anglers/${award.angler_id}`}>
                    {anglerNameById[award.angler_id] || "Unknown Angler"}
                  </Link>
                ) : (
                  "Unknown Angler"
                )}
              </td>
              <td>{award.notes || "-"}</td>
              <td>
                <Link href={`/admin/awards/${award.id}`}>
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
