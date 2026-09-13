import Link from "next/link";
import { redirect } from "next/navigation";
import ScheduleNotePresets from "../../../components/schedule-note-presets";
import { requireRole } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { EVENT_SCORING_RULESETS } from "../../../../lib/scoring";

async function createEvent(formData: FormData) {
  "use server";

  await requireRole("admin");

  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: String(formData.get("name") || ""),
      start_date: String(formData.get("start_date") || ""),
      end_date: String(formData.get("end_date") || ""),
      status: String(formData.get("status") || "scheduled"),
      is_tournament: formData.get("is_tournament") === "true",
      scoring_ruleset: String(
        formData.get("scoring_ruleset") || EVENT_SCORING_RULESETS.CLUB,
      ),
      notes: String(formData.get("notes") || ""),
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin/events/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect(event?.id ? `/admin/events/${event.id}?saved=1` : "/admin/events");
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("admin");

  const { error } = await searchParams;

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Add Event</h1>
        <Link href="/admin/events" className="btn btn-ghost">Back to Events</Link>
      </div>

      {error && <p className="alert alert-danger">Create failed: {error}</p>}

      <form action={createEvent}>
        <div className="form-grid">
          <p className="field field-full">
            <label>Event Name</label>
            <input name="name" required />
          </p>

          <p className="field">
            <label>Start Date</label>
            <input name="start_date" type="date" required />
          </p>

          <p className="field">
            <label>End Date</label>
            <input name="end_date" type="date" required />
          </p>

          <p className="field">
            <label>Event Type</label>
            <select name="is_tournament" defaultValue="true">
              <option value="true">Tournament</option>
              <option value="false">Club Event</option>
            </select>
          </p>

          <p className="field">
            <label>Scoring Ruleset</label>
            <select
              name="scoring_ruleset"
              defaultValue={EVENT_SCORING_RULESETS.CLUB}
            >
              <option value={EVENT_SCORING_RULESETS.CLUB}>
                NOBGFC club rules
              </option>
              <option value={EVENT_SCORING_RULESETS.NOIBT_2026}>
                2026 NOIBT rules
              </option>
            </select>
          </p>

          <p className="field">
            <label>Schedule Status</label>
            <select name="status" defaultValue="scheduled">
              <option value="scheduled">scheduled</option>
              <option value="rescheduled">rescheduled</option>
              <option value="cancelled">cancelled</option>
              <option value="locked">locked</option>
              <option value="completed">completed</option>
            </select>
          </p>

          <p className="field field-full">
            <label>Scheduling Notes / Public Notice</label>
            <ScheduleNotePresets defaultValue="" />
          </p>

          <p className="field-full">
            <button type="submit" className="btn">Save Event</button>
          </p>
        </div>
      </form>
    </main>
  );
}
