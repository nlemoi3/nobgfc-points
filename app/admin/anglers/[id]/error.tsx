"use client";

export default function EditAnglerError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Angler — Error</h1>
      <p style={{ color: "red" }}>
        <strong>{error.message}</strong>
      </p>
      {error.digest && (
        <p style={{ fontFamily: "monospace", fontSize: "0.85em" }}>
          Digest: {error.digest}
        </p>
      )}
    </main>
  );
}
