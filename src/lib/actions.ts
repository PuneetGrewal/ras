// Server actions: changes that run on the server and finish with a redirect or a plain-English error.
// Signing in and out, an admin marking a submission as reviewed, and emailing the admin about new forms.
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getSubmissionById, setSubmissionReviewed } from "@/lib/data/submissions";
import { sendNewSubmissionEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

// What the login form shows after a failed attempt; the email is sent back so the box stays filled in.
export type SignInState = { error: string; email: string } | null;

// Signs in with email + password. On success, sends the user to "/", which picks the page for their role.
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "invalid_credentials") return { error: "Wrong email or password.", email };
    console.error("Sign-in failed:", error.message);
    return { error: "Couldn't sign in right now. Please try again in a minute.", email };
  }

  // Throw away any pages cached for the previous visitor before showing this user's pages.
  revalidatePath("/", "layout");
  redirect("/");
}

// Signs out on this device only, then goes back to the login page.
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    // Supabase couldn't be reached, so remove this device's login cookies ourselves; sign-out must always work.
    console.error("Sign-out failed, clearing the login cookies directly:", error.message);
    const cookieStore = await cookies();
    cookieStore.getAll().filter((cookie) => cookie.name.startsWith("sb-")).forEach((cookie) => cookieStore.delete(cookie.name));
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

// Marks a submission as reviewed (admins only), then reopens it with a green "Marked as reviewed" note.
// Only returns when something went wrong, with the message to show next to the button.
export async function markSubmissionReviewed(id: string): Promise<{ error: string }> {
  try {
    const supabase = await createClient();
    // Checked here too, not just by hiding the button: anyone can call a server action directly.
    const profile = await getCurrentProfile(supabase);
    if (profile?.role !== "admin") return { error: "Only admins can mark a form as reviewed." };
    // The database's own rule also refuses non-admins; then no row changes and this is false.
    const updated = await setSubmissionReviewed(supabase, id);
    if (!updated) return { error: "This form couldn't be found, so it wasn't marked as reviewed." };
  } catch (error) {
    console.error("Mark reviewed failed:", error);
    return { error: "Couldn't mark this form as reviewed. Please try again in a minute." };
  }

  // Outside the try: redirect() works by throwing, which the catch above must not swallow.
  revalidatePath("/admin");
  revalidatePath(`/submissions/${id}`);
  redirect(`/submissions/${id}?reviewed=1`);
}

// Emails the admin about a form the framer has just sent (the safety form calls this after saving).
// It never throws: an email problem is only logged, so the framer's form is never affected.
// Until Resend is set up (see .env.example) it does nothing.
export async function notifyAdminOfSubmission(submissionId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !to || !appUrl) {
    console.warn("Admin email skipped: set RESEND_API_KEY, ADMIN_NOTIFICATION_EMAIL and NEXT_PUBLIC_APP_URL to turn it on.");
    return;
  }

  try {
    // Read the form again here, as the logged-in person: the security rules only return their own
    // forms (or any, for an admin), and the check below makes sure it is the sender's own.
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    const submission = await getSubmissionById(supabase, submissionId);
    if (!profile || !submission || submission.user_id !== profile.id) {
      console.error(`Admin email skipped: form ${submissionId} isn't the caller's own.`);
      return;
    }
    const problem = await sendNewSubmissionEmail(submission, { apiKey, to, appUrl });
    if (problem) console.error("Admin email failed:", problem);
  } catch (error) {
    console.error("Admin email failed:", error);
  }
}
