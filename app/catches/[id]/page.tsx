import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relationName(value: any) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}

function relationId(value: any) {
  return Array.isArray(value) ? value[0]?.id : value?.id;
}

export default async function CatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catchId = Number(id);

  const { data: catchRecord, error } = await supabase
    .from("catches")
    .select(`
      id,
      weight,
      points_awarded,
      released,
      tagged,
      line_class,
      status,
      catch_datetime,
      photo_url,
      boats(id,name),
      anglers(id,first_name,last_name),
      species(name),
      events(id,name,start_date,end_date)
    `)
    .eq("id", catchId)
    .single();

  if (error || !catchRecord) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Catch Not Found</h1>
        <p>This catch could not be found.</p>
        <p>
          <Link href="/catches">← Back to Catches</Link>
        </p>
      </main>
    );
  }

  const species = relationName(catchRecord.species) || "Catch";
  const boatId = relationId(catchRecord.boats);
  const boatName = relationName(catchRecord.boats);
  const anglerId = relationId(catchRecord.anglers);
  const eventId = relationId(catchRecord.events);
  const eventName = relationName(catchRecord.events);

  const anglerName = Array.isArray(catchRecord.anglers)
    ? `${catchRecord.anglers[0]?.first_name || ""} ${
        catchRecord.anglers[0]?.last_name || ""
      }`.trim()
    : `${catchRecord.anglers?.first_name || ""} ${
        catchRecord.anglers?.last_name || ""
      }`.trim();

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/catches">← Back to Catches</Link>
      </p>

      <h1>{species}</h1>

      {catchRecord.photo_url && (
        <p>
          <a href={catchRecord.photo_url} target="_blank">
            <img
              src={catchRecord.photo_url}
              alt={species}
              style={{
                maxWidth: "700px",
                width: "100%",
                display: "block",
                marginBottom: "20px",
              }}
            />
          </a>
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Weight</h3>
          <p>
            <strong>
              {catchRecord.weight ? `${catchRecord.weight} lbs` : "Released"}
            </strong>
          </p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Points</h3>
          <p>
            <strong>{Number(catchRecord.points_awarded || 0).toFixed(1)}</strong>
          </p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Line Class</h3>
          <p>
            <strong>{catchRecord.line_class || "-"}</strong>
          </p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px", minWidth: "220px" }}>
          <h3>Status</h3>
          <p>
            <strong>{catchRecord.status || "-"}</strong>
          </p>
        </div>
      </div>

      <h2>Catch Details</h2>

      <p>
        <strong>Date:</strong> {formatDateTime(catchRecord.catch_datetime)}
      </p>

      <p>
        <strong>Boat:</strong>{" "}
        {boatId ? (
          <Link href={`/boats/${boatId}`}>{boatName}</Link>
        ) : (
          boatName || "-"
        )}
      </p>

      <p>
        <strong>Angler:</strong>{" "}
        {anglerId ? (
          <Link href={`/anglers/${anglerId}`}>{anglerName}</Link>
        ) : (
          anglerName || "-"
        )}
      </p>

      <p>
        <strong>Tournament:</strong>{" "}
        {eventId ? (
          <Link href={`/tournaments/${eventId}`}>{eventName}</Link>
        ) : (
          eventName || "-"
        )}
      </p>

      <p>
        <strong>Released:</strong> {catchRecord.released ? "Yes" : "No"}
      </p>

      <p>
        <strong>Tagged:</strong> {catchRecord.tagged ? "Yes" : "No"}
      </p>

      <p style={{ marginTop: "30px" }}>
        <Link href={`/admin/catches/${catchRecord.id}`}>Edit Catch</Link>
      </p>
    </main>
  );
}