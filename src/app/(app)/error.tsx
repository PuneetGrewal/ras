// Shown in place of a logged-in page that failed to load (e.g. Supabase couldn't be reached), so people
// get a plain-English message and a retry button instead of Next.js's generic "Application error" screen.
"use client";

import { useEffect } from "react";
import Message from "@/components/Message";

type Props = {
  error: Error & { digest?: string }; // in production the real reason is only in the server logs; digest matches it
  retry: () => void;
};

export default function AppError({ error, retry }: Props) {
  useEffect(() => {
    console.error("A page failed to load:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Message type="error">This page couldn&apos;t load. Check your connection and try again.</Message>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-12 rounded bg-ras-green px-4 py-3 font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
