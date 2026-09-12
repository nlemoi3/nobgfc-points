export function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const rawText = String(value);
  const text = /^[=+\-@]/.test(rawText) ? `'${rawText}` : rawText;

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
}

export function createCsvResponse(csv: string, filename: string) {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
