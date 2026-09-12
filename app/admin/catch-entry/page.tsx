import CatchEntryForm from "../../components/catch-entry-form";
import { supabase } from "../../../lib/supabase";

export default async function CatchEntryPage() {
  const [eventsResult, boatsResult, anglersResult, speciesResult] =
    await Promise.all([
      supabase
        .from("events")
        .select("id,name,start_date,end_date,status")
        .eq("is_tournament", true)
        .order("start_date"),
      supabase.from("boats").select("id,name").order("name"),
      supabase
        .from("anglers")
        .select("id,first_name,last_name")
        .order("last_name"),
      supabase.from("species").select("id,name").order("name"),
    ]);

  const loadError =
    eventsResult.error ||
    boatsResult.error ||
    anglersResult.error ||
    speciesResult.error;

  return (
    <main className="panel">
      <p className="eyebrow">Connection-safe workflow</p>
      <h1>Catch Entry</h1>
      <p>
        Enter the actual catch date and time. The form saves a private draft on
        this device until Supabase confirms the submission.
      </p>

      {loadError ? (
        <p className="alert alert-danger" role="alert">
          Catch entry options could not be loaded. Check your connection and
          reload this page; no catch has been submitted.
        </p>
      ) : (
        <CatchEntryForm
          events={(eventsResult.data || []).map((event: any) => ({
            id: event.id,
            name: event.name,
            start_date: event.start_date,
            end_date: event.end_date,
            status: event.status,
          }))}
          boats={(boatsResult.data || []).map((boat: any) => ({
            label: boat.name,
            value: String(boat.id),
          }))}
          anglers={(anglersResult.data || []).map((angler: any) => ({
            label: `${angler.first_name} ${angler.last_name}`.trim(),
            value: String(angler.id),
          }))}
          species={(speciesResult.data || []).map((fish: any) => ({
            label: fish.name,
            value: String(fish.id),
          }))}
        />
      )}
    </main>
  );
}
