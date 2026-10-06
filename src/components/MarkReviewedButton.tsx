// The admin's "Mark reviewed" button on a submission. The change runs on the server
// (markSubmissionReviewed); if it fails, the reason appears right here above the button.
"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import Message from "./Message";
import { markSubmissionReviewed } from "@/lib/actions";

export default function MarkReviewedButton({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      try {
        // On success the server reopens the page with a green note, so getting a result back means it failed.
        const result = await markSubmissionReviewed(submissionId);
        if (result) setError(result.error);
      } catch (error) {
        // Next.js delivers that success redirect as a thrown error; hand it back to Next.js, it isn't a failure.
        unstable_rethrow(error);
        console.error("Could not reach the server to mark the form reviewed:", error);
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Message type="error">{error}</Message>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="min-h-12 w-full rounded bg-ras-green px-5 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Marking as reviewed…" : "Mark reviewed"}
      </button>
    </div>
  );
}
