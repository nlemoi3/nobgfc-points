import { supabase } from "../../../lib/supabase";

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

      <form>
        <p>
          <label>Event</label><br />
          <select name="event_id">
            {events?.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </p>

        <p>
          <label>Boat</label><br />
          <select name="boat_id">
            {boats?.map((boat) => (
              <option key={boat.id} value={boat.id}>{boat.name}</option>
            ))}
          </select>
        </p>

        <p>
          <label>Angler</label><br />
          <select name="angler_id">
            {anglers?.map((angler) => (
              <option key={angler.id} value={angler.id}>
                {angler.first_name} {angler.last_name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Species</label><br />
          <select name="species_id">
            {species?.map((fish) => (
              <option key={fish.id} value={fish.id}>{fish.name}</option>
            ))}
          </select>
        </p>

        <p>
          <label>Weight</label><br />
          <input name="weight" type="number" step="0.1" />
        </p>

        <p>
          <label>Line Class</label><br />
          <select name="line_class">
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