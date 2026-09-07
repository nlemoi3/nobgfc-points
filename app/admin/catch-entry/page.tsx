import { redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { createClient } from "../../../lib/supabase/server";
import CatchEventFields from "../../components/catch-event-fields";
import SearchableSelect from "../../components/searchable-select";
import {
  calculateCatchPoints,
  validateCatchInput,
  validateEventAssignment,
} from "../../../lib/scoring";

async function saveCatch(formData: FormData) {
  "use server";

  const authenticatedSupabase = await createClient();
  const event_id = Number(formData.get("event_id"));
  const boat_id = Number(formData.get("boat_id"));
  const angler_id = Number(formData.get("angler_id"));
  const species_id = Number(formData.get("species_id"));
  const weightValue = formData.get("weight");
  const weight = weightValue ? Number(weightValue) : null;
  const line_class = Number(formData.get("line_class"));
  const released = formData.get("released") === "on";
  const tagged = formData.get("tagged") === "on";
  const catch_datetime = String(formData.get("catch_datetime") || "") || null;

  const [{ data: speciesRow }, { data: eventRow }] = await Promise.all([
    authenticatedSupabase
    .from("species")
    .select("name,minimum_weight")
    .eq("id", species_id)
    .single(),
    authenticatedSupabase
      .from("events")
      .select("start_date,end_date,status")
      .eq("id", event_id)
      .single(),
  ]);

  const speciesName = speciesRow?.name || "";
  const minimumWeight =
    speciesRow?.minimum_weight === null ||
    speciesRow?.minimum_weight === undefined
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
      catchDateTime: catch_datetime,
      eventStartDate: eventRow?.start_date || null,
      eventEndDate: eventRow?.end_date || null,
      eventStatus: eventRow?.status || null,
    })
  );

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(" "));
  }

  const points_awarded = calculateCatchPoints({
    speciesName,
    weight,
    lineClass: line_class,
    released,
    tagged,
  });

  const { error } = await authenticatedSupabase.from("catches").insert({
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
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/catches");
}

export default async function CatchEntryPage() {
  const [{ data: events }, { data: boats }, { data: anglers }, { data: species }] =
    await Promise.all([
      supabase.from("events").select("*").order("start_date"),
      supabase.from("boats").select("*").order("name"),
      supabase.from("anglers").select("*").order("last_name"),
      supabase.from("species").select("*").order("name"),
    ]);

  return (
    <main className="panel">
      <h1>Catch Entry</h1>

      <form action={saveCatch}>
        <CatchEventFields
          events={(events || []).map((event: any) => ({
            id: event.id,
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            status: event.status,
          }))}
        />

        <SearchableSelect
          label="Boat"
          name="boat_id"
          options={(boats || []).map((boat: any) => ({
            label: boat.name,
            value: String(boat.id),
          }))}
        />

        <SearchableSelect
          label="Angler"
          name="angler_id"
          options={(anglers || []).map((angler: any) => ({
            label: `${angler.first_name} ${angler.last_name}`.trim(),
            value: String(angler.id),
          }))}
        />

        <p>
          <label>Species</label>
          <br />
          <select name="species_id" required>
            {species?.map((fish: any) => (
              <option key={fish.id} value={fish.id}>
                {fish.name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Weight</label>
          <br />
          <input name="weight" type="number" step="0.1" />
        </p>

        <p>
          <label>Line Class</label>
          <br />
          <select name="line_class" required>
            <option value="130">130</option>
            <option value="80">80</option>
            <option value="50">50</option>
            <option value="30">30</option>
            <option value="20">20</option>
            <option value="16">16</option>
            <option value="12">12</option>
            <option value="8">8</option>
            <option value="4">4</option>
            <option value="2">2</option>
          </select>
        </p>

        <p>
          <label>
            <input name="released" type="checkbox" /> Released
          </label>
        </p>

        <p>
          <label>
            <input name="tagged" type="checkbox" /> Tagged
          </label>
        </p>

        <button type="submit">Save Catch</button>
      </form>
    </main>
  );
}
