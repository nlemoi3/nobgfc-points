import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function AnglersPage() {
  const { data: anglers, error } = await supabase
    .from("anglers")
    .select(`
      id,
      first_name,
      last_name,
      is_member,
      is_youth,
      photo_url
    `)
    .order("last_name");

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Anglers</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {anglers?.map((angler) => (
          <Link
            key={angler.id}
            href={`/anglers/${angler.id}`}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {angler.photo_url ? (
              <img
                src={angler.photo_url}
                alt={`${angler.first_name} ${angler.last_name}`}
                style={{
                  width: "100%",
                  maxWidth: "220px",
                  height: "220px",
                  objectFit: "cover",
                  marginBottom: "10px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "220px",
                  height: "220px",
                  border: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                No Photo
              </div>
            )}

            <h3>
              {angler.first_name} {angler.last_name}
            </h3>

            <p>
              {angler.is_member ? "Member" : "Guest"}
              {angler.is_youth ? " • Youth" : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}