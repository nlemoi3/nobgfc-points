"use server";

import { requireRole } from "../../../lib/auth";
import {
  type CatchEntryState,
  isValidSubmissionToken,
} from "../../../lib/catch-entry";
import {
  calculateCatchPoints,
  validateCatchInput,
  validateEventAssignment,
} from "../../../lib/scoring";
import { createClient } from "../../../lib/supabase/server";
import { clubDateTimeToIso } from "../../../lib/club-time";

export async function saveCatch(
  _previousState: CatchEntryState,
  formData: FormData,
): Promise<CatchEntryState> {
  await requireRole("weighmaster");

  const authenticatedSupabase = await createClient();
  const entry_token = String(formData.get("entry_token") || "");
  const event_id = Number(formData.get("event_id"));
  const boat_id = Number(formData.get("boat_id"));
  const angler_id = Number(formData.get("angler_id"));
  const species_id = Number(formData.get("species_id"));
  const weightValue = formData.get("weight");
  const weight = weightValue ? Number(weightValue) : null;
  const line_class = Number(formData.get("line_class"));
  const released = formData.get("released") === "on";
  const tagged = formData.get("tagged") === "on";
  const catchDateTimeInput = String(formData.get("catch_datetime") || "") || null;
  const catch_datetime = clubDateTimeToIso(catchDateTimeInput);

  if (!isValidSubmissionToken(entry_token)) {
    return {
      status: "error",
      message: "This draft could not be identified safely. Refresh the page and try again; your entered values will remain on this device.",
    };
  }

  if (![event_id, boat_id, angler_id, species_id].every(Number.isInteger)) {
    return {
      status: "error",
      message: "Select an event, boat, angler, and species before saving.",
    };
  }

  const [{ data: speciesRow, error: speciesError }, { data: eventRow, error: eventError }] =
    await Promise.all([
      authenticatedSupabase
        .from("species")
        .select("name,minimum_weight")
        .eq("id", species_id)
        .single(),
      authenticatedSupabase
        .from("events")
        .select("start_date,end_date,status,is_tournament")
        .eq("id", event_id)
        .single(),
    ]);

  if (speciesError || eventError || !speciesRow || !eventRow) {
    return {
      status: "error",
      message: "The selected event or species could not be verified. Your draft is safe; reload the page and try again.",
    };
  }

  const speciesName = speciesRow.name || "";
  const minimumWeight =
    speciesRow.minimum_weight === null || speciesRow.minimum_weight === undefined
      ? null
      : Number(speciesRow.minimum_weight);
  const validationErrors = validateCatchInput({
    speciesName,
    minimumWeight,
    weight,
    lineClass: line_class,
    released,
    tagged,
  });

  validationErrors.push(
    ...validateEventAssignment({
      catchDateTime: catchDateTimeInput,
      eventStartDate: eventRow.start_date || null,
      eventEndDate: eventRow.end_date || null,
      eventStatus: eventRow.status || null,
      eventIsTournament: eventRow.is_tournament ?? null,
    }),
  );

  if (validationErrors.length > 0) {
    return { status: "error", message: validationErrors.join(" ") };
  }

  if (!catch_datetime) {
    return {
      status: "error",
      message: "Enter a valid catch date and time in Central Time.",
    };
  }

  const points_awarded = calculateCatchPoints({
    speciesName,
    weight,
    lineClass: line_class,
    released,
    tagged,
  });

  const { error } = await authenticatedSupabase.from("catches").upsert(
    {
      entry_token,
      event_id,
      boat_id,
      angler_id,
      species_id,
      weight,
      line_class,
      released,
      tagged,
      catch_datetime,
      points_awarded,
      status: "pending",
    },
    { onConflict: "entry_token", ignoreDuplicates: true },
  );

  if (error) {
    return {
      status: "error",
      message: "The catch could not be confirmed. Your draft is still saved on this device. Check your connection and try again; retries will not create a duplicate.",
    };
  }

  return {
    status: "success",
    message: "Catch saved as pending and ready for review.",
  };
}
