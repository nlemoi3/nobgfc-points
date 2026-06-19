import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminAwardsPage() {
  const { data: awards, error } = await supabase
    .from("angler_awards")
    .select(`
      id,
      award_name,
      award_year,
      anglers(first_name,last_name)
    `)
    .order("award_year", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Awards</h1>

      <p>
        <Link href="/admin/awards/new">
          Add Award
        </Link>
      </p>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Award</th>
            <th>Angler</th>
          </tr>
        </thead>

        <tbody>
          {awards?.map((award: any) => (
            <tr key={award.id}>
              <td>{award.award_year}</td>
              <td>{award.award_name}</td>
              <td>
                {award.anglers?.first_name}{" "}
                {award.anglers?.last_name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}