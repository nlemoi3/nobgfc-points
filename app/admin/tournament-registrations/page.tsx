import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { EVENT_SCORING_RULESETS } from "../../../lib/scoring";
import { createClient } from "../../../lib/supabase/server";
import ConfirmSubmitButton from "../../components/confirm-submit-button";

async function createRegistration(formData: FormData) {
  "use server";

  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("tournament_registrations").insert({
    event_id: Number(formData.get("event_id")),
    boat_id: Number(formData.get("boat_id")),
    status: "registered",
    notes: String(formData.get("notes") || "").trim() || null,
  });

  if (error) {
    redirect(
      `/admin/tournament-registrations?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/tournament-registrations?saved=1");
}

async function addParticipant(formData: FormData) {
  "use server";

  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registration_participants")
    .insert({
      registration_id: Number(formData.get("registration_id")),
      angler_id: Number(formData.get("angler_id")),
      participant_role: String(formData.get("participant_role") || "angler"),
      is_guest: formData.get("is_guest") === "on",
    });

  if (error) {
    redirect(
      `/admin/tournament-registrations?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/tournament-registrations?saved=1");
}

async function updateRegistrationStatus(formData: FormData) {
  "use server";

  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registrations")
    .update({ status: String(formData.get("status") || "registered") })
    .eq("id", Number(formData.get("id")));

  if (error) {
    redirect(
      `/admin/tournament-registrations?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/tournament-registrations?saved=1");
}

async function removeParticipant(formData: FormData) {
  "use server";

  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registration_participants")
    .delete()
    .eq("id", Number(formData.get("id")));

  if (error) {
    redirect(
      `/admin/tournament-registrations?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/tournament-registrations?saved=1");
}

export default async function TournamentRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireRole("admin");
  const { error: pageError, saved } = await searchParams;
  const supabase = await createClient();
  const [eventsResult, boatsResult, anglersResult, registrationsResult] =
    await Promise.all([
      supabase
        .from("events")
        .select("id,name,start_date")
        .eq("scoring_ruleset", EVENT_SCORING_RULESETS.NOIBT_2026)
        .order("start_date", { ascending: false }),
      supabase.from("boats").select("id,name").eq("active", true).order("name"),
      supabase
        .from("anglers")
        .select("id,first_name,last_name,is_member")
        .eq("active", true)
        .order("last_name"),
      supabase
        .from("tournament_registrations")
        .select(`
          id,
          status,
          notes,
          registered_at,
          events(id,name),
          boats(id,name),
          tournament_registration_participants(
            id,
            participant_role,
            is_guest,
            anglers(id,first_name,last_name,is_member)
          )
        `)
        .order("registered_at", { ascending: false }),
    ]);

  const events = eventsResult.data || [];
  const boats = boatsResult.data || [];
  const anglers = anglersResult.data || [];
  const registrations: any[] = registrationsResult.data || [];
  const loadError =
    eventsResult.error ||
    boatsResult.error ||
    anglersResult.error ||
    registrationsResult.error;

  return (
    <main className="panel">
      <div className="toolbar">
        <div>
          <p className="eyebrow">NOIBT operations</p>
          <h1>Tournament Registrations</h1>
        </div>
        <Link href="/admin" className="btn btn-ghost">
          Back to Admin
        </Link>
      </div>

      <p>
        NOIBT team and participant registration is maintained separately from
        ordinary club-event scoring. Ordinary events do not require these rows.
      </p>

      {pageError && <p className="alert alert-danger">{pageError}</p>}
      {saved === "1" && <p className="alert">Registration saved.</p>}
      {loadError && (
        <p className="alert alert-danger">
          Registration data could not be loaded: {loadError.message}
        </p>
      )}

      <section className="admin-section">
        <h2>Register a Team</h2>
        <form action={createRegistration}>
          <div className="form-grid">
            <p className="field">
              <label>NOIBT Event</label>
              <select name="event_id" required>
                <option value="">Select event</option>
                {events.map((event: any) => (
                  <option value={event.id} key={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </p>
            <p className="field">
              <label>Registered Boat</label>
              <select name="boat_id" required>
                <option value="">Select boat</option>
                {boats.map((boat: any) => (
                  <option value={boat.id} key={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </p>
            <p className="field field-full">
              <label>Registration Notes</label>
              <textarea name="notes" rows={3} />
            </p>
            <p className="field-full">
              <button type="submit" className="btn">
                Register Team
              </button>
            </p>
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>Add a Registered Participant</h2>
        <form action={addParticipant}>
          <div className="form-grid">
            <p className="field">
              <label>Registered Team</label>
              <select name="registration_id" required>
                <option value="">Select team</option>
                {registrations.map((registration: any) => (
                  <option value={registration.id} key={registration.id}>
                    {registration.events?.name} — {registration.boats?.name}
                  </option>
                ))}
              </select>
            </p>
            <p className="field">
              <label>Participant</label>
              <select name="angler_id" required>
                <option value="">Select angler</option>
                {anglers.map((angler: any) => (
                  <option value={angler.id} key={angler.id}>
                    {angler.first_name} {angler.last_name}
                  </option>
                ))}
              </select>
            </p>
            <p className="field">
              <label>Registered Role</label>
              <select name="participant_role" defaultValue="angler">
                <option value="angler">Angler</option>
                <option value="captain">Captain</option>
                <option value="mate">Mate</option>
              </select>
            </p>
            <p className="field">
              <label>
                <input name="is_guest" type="checkbox" /> Guest
              </label>
            </p>
            <p className="field-full">
              <button type="submit" className="btn">
                Add Participant
              </button>
            </p>
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>Registered Teams</h2>
        {registrations.length === 0 ? (
          <p>No NOIBT registrations have been entered yet.</p>
        ) : (
          registrations.map((registration: any) => (
            <article className="feature-card" key={registration.id}>
              <h3>
                {registration.boats?.name} — {registration.events?.name}
              </h3>
              <form action={updateRegistrationStatus} className="portal-actions">
                <input type="hidden" name="id" value={registration.id} />
                <label>
                  Status
                  <select name="status" defaultValue={registration.status}>
                    <option value="registered">Registered</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </label>
                <button type="submit" className="btn btn-ghost">
                  Save Status
                </button>
              </form>
              {registration.notes && <p>{registration.notes}</p>}
              <ul>
                {registration.tournament_registration_participants?.map(
                  (participant: any) => (
                    <li key={participant.id}>
                      {participant.anglers?.first_name}{" "}
                      {participant.anglers?.last_name} — {participant.participant_role}
                      {participant.is_guest ? " (Guest)" : ""}{" "}
                      <form action={removeParticipant} className="inline-form">
                        <input type="hidden" name="id" value={participant.id} />
                        <ConfirmSubmitButton
                          className="btn btn-danger btn-small"
                          confirmation="Remove this participant from the NOIBT registration?"
                          pendingLabel="Removing…"
                        >
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ),
                )}
              </ul>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
