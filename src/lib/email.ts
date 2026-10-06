// Emails the admin about a new safety form, through Resend (resend.com). Runs only on the server, from
// notifyAdminOfSubmission in actions.ts, so the Resend API key never reaches anyone's browser.
import { Resend } from "resend";
import { formatWorkDate } from "./dates";
import type { SubmissionDetail } from "./types";

// Resend's shared test sender: it only delivers to the Resend account owner's own address. After
// verifying your own domain in Resend, change this to e.g. "RAS Safety <safety@your-domain.ca>".
const FROM = "RAS Safety <onboarding@resend.dev>";

type EmailSettings = { apiKey: string; to: string; appUrl: string };

// Sends "New safety form: <worker> at <site>" with the details and a link to the form.
// Returns what went wrong as text, or null once Resend has accepted the email.
export async function sendNewSubmissionEmail(submission: SubmissionDetail, settings: EmailSettings): Promise<string | null> {
  const link = `${settings.appUrl.replace(/\/$/, "")}/submissions/${submission.id}`;
  const hazards = submission.hazards_identified;
  const subject = `New safety form: ${submission.worker_name} at ${submission.site_name}${hazards ? " (hazards identified)" : ""}`;
  const text = [
    `Worker: ${submission.worker_name}`,
    `Site: ${submission.site_name}`,
    `Date: ${formatWorkDate(submission.work_date)}`,
    `Hazards identified: ${hazards ? "Yes" : "No"}`,
    "",
    `Open the form: ${link}`,
  ].join("\n");

  const { error } = await new Resend(settings.apiKey).emails.send(
    { from: FROM, to: settings.to, subject, text },
    // The key makes Resend ignore a repeat for the same form (so it's never emailed twice), and the
    // time limit stops a slow Resend from tying up the server.
    { idempotencyKey: `new-submission/${submission.id}`, signal: AbortSignal.timeout(10_000) },
  );
  return error ? error.message : null;
}
