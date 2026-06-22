import { redirect } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import SearchableSelect from "../../components/searchable-select";

async function saveCatch(formData: FormData) {
  "use server";

  const event_id = Number(formData.get("event_id"));
  const boat_id = Number(formData.get("boat_id"));
  const angler_id = Number(formData.get("angler_id"));
  const species_id = Number(formData.get("species_id"));
  const weightValue = formData.get("weight");
  const weight = weightValue ? Number(weightValue) : null;
  const line_class = Number(formData.get("line_class"));
  const released = formData.get("released") === "on";
  const tagged = formData.get("tagged") === "on";
  const catch_datetime = formData.get("catch_datetime") || null;

  const { data: speciesRow } = await supabase
    .from("species")
    .select("name")
    .eq("id", species_id)
    .single();

  const { data: multiplierRow } = await supabase
    .from("line_class_multipliers")
    .select("multiplier")
    .eq("line_class", line_class)
    .single();

  const speciesName = speciesRow?.name || "";
  const multiplier = Number(multiplierRow?.multiplier || 1);

  let basePoints = 0;
  let tagBonus = 0;

  if (released && speciesName === "Blue Marlin") {
    basePoints = 500;
  } else if (
    released &&
    ["White Marlin", "Sailfish", "Spearfish", "Swordfish"].includes(speciesName)
  ) {
    basePoints = 150;
  } else if (
    released &&
    ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName)
  ) {
    basePoints = 100;
  } else if (weight !== null) {
    basePoints = Math.floor(weight);
  }

  if (tagged && speciesName === "Blue Marlin") {
    tagBonus = 50;
  } else if (
    tagged &&
    ["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)
  ) {
    tagBonus = 25;
  }

  const points_awarded =
    ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName) && released
      ? basePoints
      : basePoints * multiplier + tagBonus;

  await supabase.from("catches").insert({
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
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Catch Entry</h1>

      <form action={saveCatch}>
        <p>
          <label>Event</label>
          <br />
          <select name="event_id" required>
            {events?.map((event: any) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Catch Date & Time</label>
          <br />
          <input name="catch_datetime" type="datetime-local" />
        </p>

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
