import { redirect } from "next/navigation";
import { supabase } from "../../lib/supabase";

async function submitBoatProfileRequest(formData: FormData) {
  "use server";

  const { error } = await supabase.from("boat_profile_requests").insert({
    boat_name: String(formData.get("boat_name") || ""),
    contact_name: String(formData.get("contact_name") || ""),
    contact_email: String(formData.get("contact_email") || ""),
    make: String(formData.get("make") || ""),
    model: String(formData.get("model") || ""),
    year: formData.get("year") ? Number(formData.get("year")) : null,
    length_feet: formData.get("length_feet")
      ? Number(formData.get("length_feet"))
      : null,
    home_port: String(formData.get("home_port") || ""),
    website_url: String(formData.get("website_url") || ""),
    facebook_url: String(formData.get("facebook_url") || ""),
    instagram_url: String(formData.get("instagram_url") || ""),
    youtube_url: String(formData.get("youtube_url") || ""),
    notes: String(formData.get("notes") || ""),
    status: "new",
  });

  if (error) throw new Error(error.message);

  redirect("/boat-profile-request/thanks");
}

export default function BoatProfileRequestPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Boat Profile Update Request</h1>

      <p>
        Submit boat profile information for review. A club admin will update the
        official boat profile after verifying the information.
      </p>

      <form action={submitBoatProfileRequest}>
        <p>
          <label>Boat Name</label>
          <br />
          <input name="boat_name" required style={{ width: "500px" }} />
        </p>

        <p>
          <label>Your Name</label>
          <br />
          <input name="contact_name" required style={{ width: "500px" }} />
        </p>

        <p>
          <label>Your Email</label>
          <br />
          <input name="contact_email" type="email" required style={{ width: "500px" }} />
        </p>

        <hr />

        <p>
          <label>Make</label>
          <br />
          <input name="make" />
        </p>

        <p>
          <label>Model</label>
          <br />
          <input name="model" />
        </p>

        <p>
          <label>Year</label>
          <br />
          <input name="year" type="number" />
        </p>

        <p>
          <label>Length</label>
          <br />
          <input name="length_feet" type="number" step="0.1" />
        </p>

        <p>
          <label>Home Port</label>
          <br />
          <input name="home_port" />
        </p>

        <hr />

        <p>
          <label>Website URL</label>
          <br />
          <input name="website_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Facebook URL</label>
          <br />
          <input name="facebook_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Instagram URL</label>
          <br />
          <input name="instagram_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>YouTube URL</label>
          <br />
          <input name="youtube_url" style={{ width: "500px" }} />
        </p>

        <p>
          <label>Notes</label>
          <br />
          <textarea name="notes" rows={5} style={{ width: "500px" }} />
        </p>

        <button type="submit">Submit Request</button>
      </form>
    </main>
  );
}