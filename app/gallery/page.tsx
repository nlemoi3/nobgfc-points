import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export default async function GalleryPage() {
  const { data: catches, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      released,
      catch_datetime,
      photo_url,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name)
    `)
    .eq("status", "approved")
    .not("photo_url", "is", null)
    .order("catch_datetime", { ascending: false });

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Photo Gallery</h1>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {!catches || catches.length === 0 ? (
        <p>No catch photos have been added yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {catches.map((c: any) => (
            <div
              key={c.id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
              }}
            >
              <a href={c.photo_url} target="_blank">
                <img
                  src={c.photo_url}
                  alt="Catch"
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              </a>

              <h3>{c.species?.name || "Catch"}</h3>

              <p>
                {c.weight ? `${c.weight} lbs` : c.released ? "Released" : "-"}
                <br />
                {formatDate(c.catch_datetime)}
              </p>

              <p>
                <strong>Boat:</strong>{" "}
                {c.boats?.id ? (
                  <Link href={`/boats/${c.boats.id}`}>{c.boats?.name}</Link>
                ) : (
                  c.boats?.name || "-"
                )}
              </p>

              <p>
                <strong>Angler:</strong>{" "}
                {c.anglers?.id ? (
                  <Link href={`/anglers/${c.anglers.id}`}>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </Link>
                ) : (
                  <>
                    {c.anglers?.first_name} {c.anglers?.last_name}
                  </>
                )}
              </p>

              <p>
                <strong>Event:</strong>{" "}
                {c.events?.id ? (
                  <Link href={`/tournaments/${c.events.id}`}>
                    {c.events?.name}
                  </Link>
                ) : (
                  c.events?.name || "-"
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}