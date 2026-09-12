"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CATCH_DRAFT_STORAGE_KEY,
  type CatchEntryDraft,
  type CatchEntryState,
  parseCatchEntryDraft,
} from "../../lib/catch-entry";
import { saveCatch } from "../admin/catch-entry/actions";
import CatchEventFields from "./catch-event-fields";
import SearchableSelect from "./searchable-select";

type Option = { label: string; value: string };
type EventOption = {
  id: number | string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status?: string | null;
};

const INITIAL_STATE: CatchEntryState = { status: "idle", message: "" };

function createSubmissionToken() {
  return crypto.randomUUID();
}

function emptyDraft(speciesId: string): CatchEntryDraft {
  return {
    savedAt: Date.now(),
    entry_token: createSubmissionToken(),
    event_id: "",
    boat_id: "",
    angler_id: "",
    species_id: speciesId,
    weight: "",
    line_class: "130",
    released: false,
    tagged: false,
    catch_datetime: "",
  };
}

function SaveCatchButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn" type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Saving Catch…" : "Save Catch"}
    </button>
  );
}

export default function CatchEntryForm({
  events,
  boats,
  anglers,
  species,
}: {
  events: EventOption[];
  boats: Option[];
  anglers: Option[];
  species: Option[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(saveCatch, INITIAL_STATE);
  const [draft, setDraft] = useState<CatchEntryDraft | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const storedValue = localStorage.getItem(CATCH_DRAFT_STORAGE_KEY);
    const restoredDraft = parseCatchEntryDraft(storedValue);

    if (restoredDraft) {
      setDraft(restoredDraft);
      setDraftNotice("Draft restored from this device.");
      return;
    }

    if (storedValue) localStorage.removeItem(CATCH_DRAFT_STORAGE_KEY);
    setDraft(emptyDraft(species[0]?.value || ""));
  }, [species]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (state.status !== "success") return;
    localStorage.removeItem(CATCH_DRAFT_STORAGE_KEY);
    router.replace("/admin/catches?created=1");
  }, [router, state.status]);

  function saveDraftFromForm(overrides: Partial<CatchEntryDraft> = {}) {
    if (!formRef.current || !draft) return;
    const formData = new FormData(formRef.current);
    const nextDraft: CatchEntryDraft = {
      savedAt: Date.now(),
      entry_token: draft.entry_token,
      event_id: overrides.event_id ?? String(formData.get("event_id") || ""),
      boat_id: String(formData.get("boat_id") || ""),
      angler_id: String(formData.get("angler_id") || ""),
      species_id: String(formData.get("species_id") || ""),
      weight: String(formData.get("weight") || ""),
      line_class: String(formData.get("line_class") || "130"),
      released: formData.get("released") === "on",
      tagged: formData.get("tagged") === "on",
      catch_datetime:
        overrides.catch_datetime ??
        String(formData.get("catch_datetime") || ""),
    };
    localStorage.setItem(CATCH_DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
    setDraftNotice("Draft saved on this device.");
  }

  function startOver() {
    if (!window.confirm("Clear this saved catch draft and start over?")) return;
    localStorage.removeItem(CATCH_DRAFT_STORAGE_KEY);
    setDraft(emptyDraft(species[0]?.value || ""));
    setDraftNotice("Draft cleared.");
  }

  if (!draft) {
    return <p className="alert">Preparing reliable catch entry…</p>;
  }

  return (
    <>
      <div className={`connection-notice ${isOnline ? "connection-online" : "connection-offline"}`} role="status">
        <strong>{isOnline ? "Online" : "Offline"}</strong>
        <span>
          {isOnline
            ? " Changes are saved on this device until the catch is confirmed."
            : " Keep entering the catch. Your draft will remain here, and you can submit when service returns."}
        </span>
      </div>

      {state.status === "error" ? (
        <p className="alert alert-danger" role="alert">{state.message}</p>
      ) : null}
      {draftNotice ? <p className="draft-notice" role="status">{draftNotice}</p> : null}

      <form
        key={draft.entry_token}
        ref={formRef}
        action={formAction}
        className="catch-entry-form"
        onChange={() => saveDraftFromForm()}
        onSubmit={(event) => {
          saveDraftFromForm();
          if (!navigator.onLine) {
            event.preventDefault();
            setDraftNotice("You are offline. The draft is saved; submit it when service returns.");
          }
        }}
      >
        <input type="hidden" name="entry_token" value={draft.entry_token} />

        <CatchEventFields
          events={events}
          defaultDateTime={draft.catch_datetime}
          defaultEventId={draft.event_id}
          onValuesChange={({ catchDateTime, eventId }) => {
            saveDraftFromForm({
              catch_datetime: catchDateTime,
              event_id: eventId,
            });
          }}
        />

        <SearchableSelect label="Boat" name="boat_id" options={boats} defaultValue={draft.boat_id} />
        <SearchableSelect label="Angler" name="angler_id" options={anglers} defaultValue={draft.angler_id} />

        <p>
          <label htmlFor="catch-species">Species</label>
          <br />
          <select id="catch-species" name="species_id" required defaultValue={draft.species_id || species[0]?.value}>
            {species.map((fish) => <option key={fish.value} value={fish.value}>{fish.label}</option>)}
          </select>
        </p>

        <p>
          <label htmlFor="catch-weight">Weight</label>
          <br />
          <input id="catch-weight" name="weight" type="number" step="0.1" min="0" defaultValue={draft.weight} inputMode="decimal" />
        </p>

        <p>
          <label htmlFor="catch-line-class">Line Class</label>
          <br />
          <select id="catch-line-class" name="line_class" required defaultValue={draft.line_class}>
            {[130, 80, 50, 30, 20, 16, 12, 8, 4, 2].map((lineClass) => (
              <option key={lineClass} value={lineClass}>{lineClass}</option>
            ))}
          </select>
        </p>

        <p>
          <label><input name="released" type="checkbox" defaultChecked={draft.released} /> Released</label>
        </p>
        <p>
          <label><input name="tagged" type="checkbox" defaultChecked={draft.tagged} /> Tagged</label>
        </p>

        <div className="catch-entry-actions">
          <SaveCatchButton />
          <button className="btn btn-ghost" type="button" onClick={startOver}>Clear Draft</button>
        </div>
        <p className="helper-text">
          The catch is not complete until the confirmation appears in the review queue. Retrying this draft cannot create a duplicate catch.
        </p>
      </form>
    </>
  );
}
