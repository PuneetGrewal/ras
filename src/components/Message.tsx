// A coloured box for success or error messages, so every user action ends in clear,
// plain-English feedback (green for success, red for errors).
import type { ReactNode } from "react";

export default function Message({ type, children }: { type: "success" | "error"; children: ReactNode }) {
  const colours =
    type === "success"
      ? "border-ras-green bg-green-50 text-ras-green"
      : "border-red-300 bg-red-50 text-red-800";

  // role="alert" makes screen readers announce errors as soon as they appear.
  return (
    <p role={type === "error" ? "alert" : "status"} className={`rounded border px-3 py-2 text-sm ${colours}`}>
      {children}
    </p>
  );
}
