import { redirect } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

async function updateEvent(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  const { error } = await supabase
    .from("events")
    .update({
      name: String(formData.get("name") || ""),
      start_date: String(formData.get("start_date") || ""),
      end_date: String(formData.get("end_date") || ""),
      status: String(formData.get("status") || "scheduled"),
      notes: String(formData.get("notes") || ""),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/events");
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Edit Event</h1>
        <p style={{ color: "red" }}>Event not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Edit Event</h1>

      <form action={updateEvent}>
        <input type="hidden" name="id" value={event.id} />

        <p>
          <label>Tournament Name</label>
          <br />
          <input
            name="name"
            defaultValue={event.name}
            style={{ width: "500px" }}
            required
          />
        </p>

        <p>
          <label>Start Date</label>
          <br />
          <input
            name="start_date"
            type="date"
            defaultValue={event.start_date}
            required
          />
        </p>

        <p>
          <label>End Date</label>
          <br />
          <input
            name="end_date"
            type="date"
            defaultValue={event.end_date}
            required
          />
        </p>

        <p>
          <label>Status</label>
          <br />
          <select name="status" defaultValue={event.status || "scheduled"}>
            <option value="scheduled">scheduled</option>
            <option value="rescheduled">rescheduled</option>
            <option value="cancelled">cancelled</option>
            <option value="completed">completed</option>
          </select>
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea
            name="notes"
            defaultValue={event.notes || ""}
            rows={5}
            style={{ width: "500px" }}
          />
        </p>

        <button type="submit">Save Event</button>
      </form>
    </main>
  );
}