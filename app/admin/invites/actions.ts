"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";

function getSiteUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  return (
    headerStore.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://nobgfc-points.vercel.app"
  );
}

async function sendSmsInvite(phoneNumber: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER",
    );
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: fromNumber,
        Body: message,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Twilio error: ${body}`);
  }
}

export async function sendInvite(formData: FormData) {
  await requireRole("admin");

  const method = String(formData.get("method") || "email");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const headerStore = await headers();
  const siteUrl = getSiteUrl(headerStore);
  const signupUrl = `${siteUrl}/signup`;
  const invitationMessage =
    `NOBGFC invite for ${name || "you"}. Create your account here: ${signupUrl}`;

  if (method === "sms") {
    if (!phone) {
      redirect("/admin/invites?error=Phone number is required for SMS invites");
    }

    await sendSmsInvite(phone, invitationMessage);
    redirect("/admin/invites?sent=sms");
  }

  if (!email) {
    redirect("/admin/invites?error=Email is required for email invites");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: name ? { name } : undefined,
    redirectTo: `${siteUrl}/login`,
  });

  if (error) {
    redirect(`/admin/invites?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/invites?sent=email");
}