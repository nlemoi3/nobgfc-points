import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "../../../lib/supabase";

function expectedPoints(c: any) {
  const speciesName = c.species?.name || "";
  const weight = c.weight !== null ? Number(c.weight) : null;
  const lineClass = Number(c.line_class || 130);

  const lineMultipliers: Record<number, number> = {
    130: 1.0,
    80: 1.3,
    50: 1.5,
    30: 2.0,
    20: 3.0,
    16: 3.5,
    12: 4.0,
    8: 4.5,
    4: 5.0,
    2: 6.0,
  };

  const multiplier = lineMultipliers[lineClass] || 1;

  let basePoints = 0;
  let tagBonus = 0;

  if (c.released && speciesName === "Blue Marlin") basePoints = 500;
  else if (
    c.released &&
    ["White Marlin", "Sailfish", "Spearfish", "Swordfish"].includes(speciesName)
  ) {
    basePoints = 150;
  } else if (
    c.released &&
    ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName)
  ) {
    basePoints = 100;
  } else if (weight !== null) {
    basePoints = Math.floor(weight);
  }

  if (c.tagged && speciesName === "Blue Marlin") tagBonus = 50;
  else if (
    c.tagged &&
    ["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)
  ) {
    tagBonus = 25;
  }

  if (["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName) && c.released) {
    return basePoints;
  }

  return basePoints * multiplier + tagBonus;
}

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ScoringAuditPage() {
  noStore();

  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      line_class,
      released,
      tagged,
      points_awarded,
      catch_datetime,
      boats(name),
      anglers(first_name,last_name),
      species(name),
      events(name)
    `)
    .order("catch_datetime", { ascending: false });

  const rows =
    catches?.map((c: any) => {
      const expected = expectedPoints(c);
      const stored = Number(c.points_awarded || 0);
      const difference = stored - expected;

      return {
        ...c,
        expected,
        stored,
        difference,
        matches: Math.abs(difference) < 0.01,
      };
    }) || [];

  const mismatches = rows.filter((r: any) => !r.matches);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Scoring Audit</h1>

      <p>
        This page recalculates every catch and compares expected points against
        stored points.
      </p>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Total Catches</strong>
          <br />
          {rows.length}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <strong>Mismatches</strong>
          <br />
          {mismatches.length}
        </div>
      </div>

      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Date</th>
            <th>Event</th>
            <th>Boat</th>
            <th>Angler</th>
            <th>Species</th>
            <th>Weight</th>
            <th>Line</th>
            <th>Released</th>
            <th>Tagged</th>
            <th>Stored</th>
            <th>Expected</th>
            <th>Difference</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((c: any) => (
            <tr
              key={c.id}
              style={{
                backgroundColor: c.matches ? "white" : "#ffd6d6",
              }}
            >
              <td>{c.matches ? "OK" : "CHECK"}</td>
              <td>{formatDateTime(c.catch_datetime)}</td>
              <td>{c.events?.name}</td>
              <td>{c.boats?.name}</td>
              <td>
                {c.anglers?.first_name} {c.anglers?.last_name}
              </td>
              <td>{c.species?.name}</td>
              <td>{c.weight ? `${c.weight} lbs` : "Released"}</td>
              <td>{c.line_class || "-"}</td>
              <td>{c.released ? "Yes" : "No"}</td>
              <td>{c.tagged ? "Yes" : "No"}</td>
              <td>{c.stored.toFixed(1)}</td>
              <td>{c.expected.toFixed(1)}</td>
              <td>{c.difference.toFixed(1)}</td>
              <td>
  <Link href={`/admin/catches/${c.id}`}>Edit</Link>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}