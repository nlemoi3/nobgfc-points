"use client";

export default function EditAnglerError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="panel">
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
