// Login page: email + password. A client component so it can show a loading state and errors;
// the actual sign-in runs on the server (signIn in src/lib/actions.ts).
"use client";

import { useActionState } from "react";
import Message from "@/components/Message";
import { signIn } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex justify-center bg-ras-green py-6">
        <img src="/ras-logo.png" alt="RAS logo" className="h-16 w-auto" />
      </div>

      <main className="mx-auto max-w-sm px-4 py-8">
        <h1 className="text-2xl font-semibold">Sign in to RAS Safety</h1>
        <p className="mt-1 text-sm text-ras-grey">Use the email and password your supervisor gave you.</p>

        <form action={formAction} className="mt-6 space-y-4">
          {state && <Message type="error">{state.error}</Message>}

          <label className="block">
            <span className="text-sm font-medium text-ras-grey">Email</span>
            {/* defaultValue refills the email after a failed attempt (React clears the form after each submit). */}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state?.email}
              className="mt-1 block w-full rounded border border-neutral-300 px-3 py-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ras-grey">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded border border-neutral-300 px-3 py-3"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-ras-green px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
