// Date helpers. "Today" always means today in the company's timezone (Vancouver),
// because the server runs on UTC and would roll over to tomorrow at 4–5 pm local time.
import { COMPANY_TIMEZONE } from "./constants";

// Today's date in Vancouver as "YYYY-MM-DD" (the format of the work_date column).
// This is the only place in the app that works out what "today" is.
export function todayInCompanyTimezone(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COMPANY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  // Pick the pieces out by name rather than trusting a locale's display order.
  const part = (type: "year" | "month" | "day") =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
