import { redirect } from "next/navigation";
import CatchEventFields from "../../../components/catch-event-fields";
import { createClient } from "../../../../lib/supabase/server";
import { requireRole } from "../../../../lib/auth";
import {
  calculateCatchPoints,
  validateCatchInput,
  validateEventAssignment,
} from "../../../../lib/scoring";
import {
  formatClubDate,
  getSubmissionTiming,
} from "../../../../lib/submission-timing";

async function uploadCatchPhoto(file: File | null, catchId: number) {
  if (!file || file.size === 0) return null;

  const authenticatedSupabase = await createClient();
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `catches/${catchId}/photo-${Date.now()}.${extension}`;

  const { error } = await authenticatedSupabase.storage
    .from("catch-media")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    throw new Error(`Catch photo upload failed: ${error.message}`);
  }

  const { data } = authenticatedSupabase.storage
    .from("catch-media")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function getCatchEventStatus(catchId: number) {
  const authenticatedSupabase = await createClient();
  const { data: catchRecord } = await authenticatedSupabase
    .from("catches")
    .select("event_id")
    .eq("id", catchId)
    .single();

  if (!catchRecord?.event_id) return null;

  const { data: event } = await authenticatedSupabase
    .from("events")
    .select("status")
    .eq("id", catchRecord.event_id)
    .single();

  return event?.status || null;
}

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

async function updateCatch(formData: FormData) {
  "use server";

  await requireRole("weighmaster");

  const authenticatedSupabase = await createClient();
  const id = Number(formData.get("id"));
  const returnUrl = `/admin/catches/${id}`;

  const currentEventStatus = await getCatchEventStatus(id);

  if (currentEventStatus === "locked") {
    redirect(
      `${returnUrl}?error=${encodeURIComponent("This catch belongs to a locked event and cannot be edited.")}`,
    );
  }

  const species_id = Number(formData.get("species_id"));
  const weightValue = formData.get("weight");
  const weight = weightValue ? Number(weightValue) : null;
  const line_class = Number(formData.get("line_class"));
  const released = formData.get("released") === "on";
  const tagged = formData.get("tagged") === "on";
  const status = String(formData.get("status") || "pending");
  const event_id = Number(formData.get("event_id"));
  const catch_datetime = String(formData.get("catch_datetime") || "") || null;
  const eligibility_notes = String(formData.get("eligibility_notes") || "").trim();

  const { data: speciesRow, error: speciesError } = await authenticatedSupabase
    .from("species")
    .select("name,minimum_weight")
    .eq("id", species_id)
    .single();

  if (speciesError || !speciesRow) {
    redirect(
      `${returnUrl}?error=${encodeURIComponent("The selected species could not be loaded.")}`,
    );
  }

  const speciesName = speciesRow.name;
  const minimumWeight =
    speciesRow.minimum_weight === null ? null : Number(speciesRow.minimum_weight);

  if (status === "approved") {
    const { data: eventRow } = await authenticatedSupabase
      .from("events")
      .select("start_date,end_date,status,is_tournament")
      .eq("id", event_id)
      .single();

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
        eventIsTournament: eventRow?.is_tournament ?? null,
      })
    );

    if (validationErrors.length > 0) {
      redirect(
        `${returnUrl}?error=${encodeURIComponent(validationErrors.join(" "))}`,
      );
    }
  }

  if (status === "rejected" && !eligibility_notes) {
    redirect(
      `${returnUrl}?error=${encodeURIComponent("A rejection reason is required.")}`,
    );
  }

  const points_awarded = calculateCatchPoints({
    speciesName,
    weight,
    lineClass: line_class,
    released,
    tagged,
  });

  const photoFile = formData.get("photo_file");
  let uploadedPhotoUrl: string | null = null;

  if (photoFile instanceof File) {
    try {
      uploadedPhotoUrl = await uploadCatchPhoto(photoFile, id);
    } catch (error: any) {
      redirect(
        `${returnUrl}?error=${encodeURIComponent(
          error?.message || "Catch photo upload failed.",
        )}`,
      );
    }
  }

  const currentPhotoUrl = String(formData.get("photo_url") || "");

  const { error } = await authenticatedSupabase
    .from("catches")
    .update({
      event_id,
      boat_id: Number(formData.get("boat_id")),
      angler_id: Number(formData.get("angler_id")),
      species_id,
      weight,
      line_class,
      released,
      tagged,
      status,
      catch_datetime,
      photo_url: uploadedPhotoUrl || currentPhotoUrl,
      points_awarded,
      eligibility_notes:
        status === "approved" ? null : eligibility_notes || null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `${returnUrl}?error=${encodeURIComponent(`Catch update failed: ${error.message}`)}`,
    );
  }

  redirect("/admin/catches");
}

async function deleteCatch(formData: FormData) {
  "use server";

  await requireRole("weighmaster");

  const authenticatedSupabase = await createClient();
  const id = Number(formData.get("id"));
  const returnUrl = `/admin/catches/${id}`;

  const currentEventStatus = await getCatchEventStatus(id);

  if (currentEventStatus === "locked") {
    redirect(
      `${returnUrl}?error=${encodeURIComponent("This catch belongs to a locked event and cannot be deleted.")}`,
    );
  }

  const { error } = await authenticatedSupabase
    .from("catches")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(
      `${returnUrl}?error=${encodeURIComponent(`Delete failed: ${error.message}`)}`,
    );
  }

  redirect("/admin/catches");
}

export default async function EditCatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const catchId = Number(id);
  const supabase = await createClient();

  const [
    { data: catchRecord },
    { data: events },
    { data: boats },
    { data: anglers },
    { data: species },
    { data: auditRows },
  ] = await Promise.all([
    supabase.from("catches").select("*").eq("id", catchId).single(),
    supabase
      .from("events")
      .select("*")
      .eq("is_tournament", true)
      .order("start_date"),
    supabase.from("boats").select("id,name").order("name"),
    supabase
      .from("anglers")
      .select("id,first_name,last_name")
      .order("last_name"),
    supabase.from("species").select("*").order("name"),
    supabase
      .from("catch_audit_log")
      .select(
        "id,action,actor_email,actor_role,changed_fields,occurred_at",
      )
      .eq("catch_id", catchId)
      .order("occurred_at", { ascending: false }),
  ]);

  if (!catchRecord) {
    return (
      <main className="panel">
        <h1>Edit Catch</h1>
        <p>Catch not found.</p>
      </main>
    );
  }

  const currentEvent = events?.find(
    (event: any) => event.id === catchRecord.event_id
  );

  const submissionTiming = getSubmissionTiming({
    released: Boolean(catchRecord.released),
    tagged: Boolean(catchRecord.tagged),
    submittedAt: catchRecord.created_at,
    eventEndDate: currentEvent?.end_date || null,
  });

  const isLocked = currentEvent?.status === "locked";

  const defaultDateTime = catchRecord.catch_datetime
    ? new Date(catchRecord.catch_datetime).toISOString().slice(0, 16)
    : "";

  return (
    <main className="panel">
      <h1>Edit Catch</h1>

      {error && <p className="alert alert-danger">{error}</p>}

      {isLocked && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          This catch belongs to a locked event. Editing and deleting are blocked.
        </p>
      )}

      {submissionTiming.isLate && (
        <p className="alert alert-warning">
          Review timing: this tag/release record was submitted {submissionTiming.daysLate} day{submissionTiming.daysLate === 1 ? "" : "s"} after the {formatClubDate(submissionTiming.deadlineDate)} deadline. Late entry remains allowed; the Weighmaster should document the eligibility decision.
        </p>
      )}

      <form action={updateCatch}>
        <input type="hidden" name="id" value={catchRecord.id} />

        <CatchEventFields
          events={(events || []).map((event: any) => ({
            id: event.id,
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            status: event.status,
          }))}
          defaultDateTime={defaultDateTime}
          defaultEventId={catchRecord.event_id}
          disabled={isLocked}
        />

        <p>
          <label>Boat</label>
          <br />
          <select
            name="boat_id"
            defaultValue={catchRecord.boat_id}
            required
            disabled={isLocked}
          >
            {boats?.map((boat: any) => (
              <option key={boat.id} value={boat.id}>
                {boat.name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Angler</label>
          <br />
          <select
            name="angler_id"
            defaultValue={catchRecord.angler_id}
            required
            disabled={isLocked}
          >
            {anglers?.map((angler: any) => (
              <option key={angler.id} value={angler.id}>
                {angler.first_name} {angler.last_name}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label>Species</label>
          <br />
          <select
            name="species_id"
            defaultValue={catchRecord.species_id}
            required
            disabled={isLocked}
          >
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
          <input
            name="weight"
            type="number"
            step="0.1"
            defaultValue={catchRecord.weight || ""}
            disabled={isLocked}
          />
        </p>

        <p>
          <label>Line Class</label>
          <br />
          <select
            name="line_class"
            defaultValue={catchRecord.line_class}
            required
            disabled={isLocked}
          >
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
            <input
              name="released"
              type="checkbox"
              defaultChecked={catchRecord.released}
              disabled={isLocked}
            />{" "}
            Released
          </label>
        </p>

        <p>
          <label>
            <input
              name="tagged"
              type="checkbox"
              defaultChecked={catchRecord.tagged}
              disabled={isLocked}
            />{" "}
            Tagged
          </label>
        </p>

        <p>
          <label>Status</label>
          <br />
          <select
            name="status"
            defaultValue={catchRecord.status || "approved"}
            disabled={isLocked}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </p>

        <p>
          <label>Review / Rejection Notes</label>
          <br />
          <textarea
            name="eligibility_notes"
            defaultValue={catchRecord.eligibility_notes || ""}
            placeholder="Required when rejecting a catch"
            rows={3}
            disabled={isLocked}
          />
        </p>

        <hr />

        <h2>Public Catch Photo (Optional)</h2>

        <p>
          This image is for the website and gallery. Club verification records
          may be maintained separately by the Weighmaster.
        </p>

        {catchRecord.photo_url && (
          <p>
            <strong>Current Catch Photo:</strong>
            <br />
            <img
              src={catchRecord.photo_url}
              alt="Catch photo"
              style={{ maxWidth: "300px" }}
            />
          </p>
        )}

        <p>
          <label>Upload New Public Photo</label>
          <br />
          <input
            name="photo_file"
            type="file"
            accept="image/*"
            disabled={isLocked}
          />
        </p>

        <p>
          <label>Photo URL</label>
          <br />
          <input
            name="photo_url"
            defaultValue={catchRecord.photo_url || ""}
            style={{ width: "500px" }}
            disabled={isLocked}
          />
        </p>

        {!isLocked && <button type="submit">Save Catch</button>}
      </form>

      <hr style={{ margin: "30px 0" }} />

      <section>
        <h2>Audit History</h2>
        <p>
          This record is append-only and shows submissions, edits, review
          decisions, and score recalculations.
        </p>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Changed fields</th>
              </tr>
            </thead>
            <tbody>
              {(auditRows || []).map((row: any) => (
                <tr key={row.id}>
                  <td>{formatAuditDate(row.occurred_at)}</td>
                  <td>{row.action}</td>
                  <td>
                    {row.actor_email || "System baseline"}
                    {row.actor_role ? ` (${row.actor_role})` : ""}
                  </td>
                  <td>{(row.changed_fields || []).join(", ") || "—"}</td>
                </tr>
              ))}
              {(auditRows || []).length === 0 ? (
                <tr>
                  <td colSpan={4}>No audit entries are available.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <hr style={{ margin: "30px 0" }} />

      {!isLocked && (
        <form action={deleteCatch}>
          <input type="hidden" name="id" value={catchRecord.id} />
          <button type="submit" style={{ color: "red" }}>
            Delete Catch
          </button>
        </form>
      )}
    </main>
  );
}
