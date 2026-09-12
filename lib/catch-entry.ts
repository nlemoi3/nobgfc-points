export const CATCH_DRAFT_STORAGE_KEY = "nobgfc:catch-entry-draft:v1";
export const CATCH_DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type CatchEntryState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type CatchEntryDraft = {
  savedAt: number;
  entry_token: string;
  event_id: string;
  boat_id: string;
  angler_id: string;
  species_id: string;
  weight: string;
  line_class: string;
  released: boolean;
  tagged: boolean;
  catch_datetime: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSubmissionToken(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseCatchEntryDraft(
  serialized: string | null,
  now = Date.now(),
): CatchEntryDraft | null {
  if (!serialized) return null;

  try {
    const value = JSON.parse(serialized) as Partial<CatchEntryDraft>;
    if (
      typeof value.savedAt !== "number" ||
      now - value.savedAt > CATCH_DRAFT_MAX_AGE_MS ||
      !isValidSubmissionToken(value.entry_token)
    ) {
      return null;
    }

    return {
      savedAt: value.savedAt,
      entry_token: value.entry_token,
      event_id: String(value.event_id || ""),
      boat_id: String(value.boat_id || ""),
      angler_id: String(value.angler_id || ""),
      species_id: String(value.species_id || ""),
      weight: String(value.weight || ""),
      line_class: String(value.line_class || "130"),
      released: Boolean(value.released),
      tagged: Boolean(value.tagged),
      catch_datetime: String(value.catch_datetime || ""),
    };
  } catch {
    return null;
  }
}
