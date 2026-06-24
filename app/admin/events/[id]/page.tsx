import { redirect } from "next/navigation";
import { requireRole } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { createClient } from "../../../../lib/supabase/server";

async function updateEvent(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();
  const id = Number(formData.get("id"));
  const returnUrl = `/admin/events/${id}`;

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
    redirect(
      `${returnUrl}?error=${encodeURIComponent(`Save failed: ${error.message}`)}`,
    );
  }

  redirect(`${returnUrl}?saved=1`);
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;
  const { error: pageError, saved } = await searchParams;
  const eventId = Number(id);

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return (
      <main className="panel">
        <h1>Edit Tournament Schedule</h1>
        <p className="alert alert-danger">
          {error ? `Unable to load event: ${error.message}` : "Event not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Edit Tournament Schedule</h1>
        <a href="/admin/events" className="btn btn-ghost">Back to Events</a>
      </div>

      {pageError && <p className="alert alert-danger">{pageError}</p>}
      {saved === "1" && <p className="alert">Schedule saved.</p>}

      <form action={updateEvent}>
        <input type="hidden" name="id" value={event.id} />

        <div className="form-grid">

        <p className="field field-full">
          <label>Tournament Name</label>
          <input
            name="name"
            defaultValue={event.name}
            required
          />
        </p>

        <p className="field">
          <label>Start Date</label>
          <input
            name="start_date"
            type="date"
            defaultValue={event.start_date}
            required
          />
        </p>

        <p className="field">
          <label>End Date</label>
          <input
            name="end_date"
            type="date"
            defaultValue={event.end_date}
            required
          />
        </p>

        <p className="field">
          <label>Schedule Status</label>
          <select name="status" defaultValue={event.status || "scheduled"}>
            <option value="scheduled">scheduled</option>
            <option value="rescheduled">rescheduled</option>
            <option value="cancelled">cancelled</option>
            <option value="locked">locked</option>
            <option value="completed">completed</option>
          </select>
        </p>

        <p className="field field-full">
          <label>Scheduling Notes / Public Notice</label>
          <textarea
            name="notes"
            defaultValue={event.notes || ""}
            rows={5}
            placeholder="Example: Moved due to weather. New dates June 24-25."
          />
        </p>

        <p className="field-full">
          <button type="submit" className="btn">Save Schedule</button>
        </p>
        </div>
      </form>
    </main>
  );
}
