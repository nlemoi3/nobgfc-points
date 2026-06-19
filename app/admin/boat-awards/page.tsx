import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function AdminBoatAwardsPage() {
  const { data: awards } = await supabase
    .from("boat_awards")
    .select(`
      id,
      award_name,
      award_year,
      boats(name)
    `)
    .order("award_year", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Awards</h1>

      <p>
        <Link href="/admin/boat-awards/new">
          Add Boat Award
        </Link>
      </p>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
  <th>Year</th>
  <th>Award</th>
  <th>Boat</th>
  <th>Action</th>
</tr>
        </thead>

        <tbody>
          {awards?.map((award: any) => (
            <tr key={award.id}>
              <td>{award.award_year}</td>
              <td>{award.award_name}</td>
              <td>{award.boats?.name}</td>
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