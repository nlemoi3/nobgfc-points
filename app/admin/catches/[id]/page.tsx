import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function calculatePoints(species_id: number, weight: number | null, line_class: number, released: boolean, tagged: boolean) {
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

  if (released && speciesName === "Blue Marlin") basePoints = 500;
  else if (released && ["White Marlin", "Sailfish", "Spearfish", "Swordfish"].includes(speciesName)) basePoints = 150;
  else if (released && ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName)) basePoints = 100;
  else if (weight !== null) basePoints = Math.floor(weight);

  if (tagged && speciesName === "Blue Marlin") tagBonus = 50;
  else if (tagged && ["White Marlin", "Sailfish", "Spearfish"].includes(speciesName)) tagBonus = 25;

  return ["Yellowfin Tuna", "Bigeye Tuna"].includes(speciesName) && released
    ? basePoints
    : basePoints * multiplier + tagBonus;
}

async function updateCatch(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const species_id = Number(formData.get("species_id"));
  const weightValue = formData.get("weight");
  const weight = weightValue ? Number(weightValue) : null;
  const line_class = Number(formData.get("line_class"));
  const released = formData.get("released") === "on";
  const tagged = formData.get("tagged") === "on";

  const points_awarded = await calculatePoints(species_id, weight, line_class, released, tagged);

  const { error } = await supabase
    .from("catches")
    .update({
      event_id: Number(formData.get("event_id")),
      boat_id: Number(formData.get("boat_id")),
      angler_id: Number(formData.get("angler_id")),
      species_id,
      weight,
      line_class,
      released,
      tagged,
      catch_datetime: formData.get("catch_datetime") || null,
      points_awarded,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/catches");
}

async function deleteCatch(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("catches")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect("/admin/catches");
}

export default async function EditCatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catchId = Number(id);

  const [{ data: catchRecord }, { data: events }, { data: boats }, { data: anglers }, { data: species }] =
    await Promise.all([
      supabase.from("catches").select("*").eq("id", catchId).single(),
      supabase.from("events").select("*").order("start_date"),
      supabase.from("boats").select("*").order("name"),
      supabase.from("anglers").select("*").order("last_name"),
      supabase.from("species").select("*").order("name"),
    ]);

  if (!catchRecord) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Catch</h1>
        <p>Catch not found.</p>
      </main>
    );
  }

  const defaultDateTime = catchRecord.catch_datetime
    ? new Date(catchRecord.catch_datetime).toISOString().slice(0, 16)
    : "";

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Catch</h1>

      <form action={updateCatch}>
        <input type="hidden" name="id" value={catchRecord.id} />

        <p><label>Event</label><br />
          <select name="event_id" defaultValue={catchRecord.event_id} required>
            {events?.map((event: any) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
        </p>

        <p><label>Catch Date & Time</label><br />
          <input name="catch_datetime" type="datetime-local" defaultValue={defaultDateTime} />
        </p>

        <p><label>Boat</label><br />
          <select name="boat_id" defaultValue={catchRecord.boat_id} required>
            {boats?.map((boat: any) => <option key={boat.id} value={boat.id}>{boat.name}</option>)}
          </select>
        </p>

        <p><label>Angler</label><br />
          <select name="angler_id" defaultValue={catchRecord.angler_id} required>
            {anglers?.map((angler: any) => (
              <option key={angler.id} value={angler.id}>
                {angler.first_name} {angler.last_name}
              </option>
            ))}
          </select>
        </p>

        <p><label>Species</label><br />
          <select name="species_id" defaultValue={catchRecord.species_id} required>
            {species?.map((fish: any) => <option key={fish.id} value={fish.id}>{fish.name}</option>)}
          </select>
        </p>

        <p><label>Weight</label><br />
          <input name="weight" type="number" step="0.1" defaultValue={catchRecord.weight || ""} />
        </p>

        <p><label>Line Class</label><br />
          <select name="line_class" defaultValue={catchRecord.line_class} required>
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

        <p><label><input name="released" type="checkbox" defaultChecked={catchRecord.released} /> Released</label></p>
        <p><label><input name="tagged" type="checkbox" defaultChecked={catchRecord.tagged} /> Tagged</label></p>

        <button type="submit">Save Catch</button>
      </form>

      <hr style={{ margin: "30px 0" }} />

      <form action={deleteCatch}>
        <input type="hidden" name="id" value={catchRecord.id} />
        <button type="submit" style={{ color: "red" }}>
          Delete Catch
        </button>
      </form>
    </main>
  );
}