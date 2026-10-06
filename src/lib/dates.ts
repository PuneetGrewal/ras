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

// A work_date ("2026-10-06") for display, e.g. "Tue, Oct 6, 2026". It is a plain calendar day,
// so it is formatted as UTC; on Vancouver's clock the same value would show as the day before.
export function formatWorkDate(workDate: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${workDate}T00:00:00Z`));
}

// A moment in time (e.g. when a form was sent) on Vancouver's clock, e.g. "Oct 6, 2026, 7:42 a.m.".
export function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COMPANY_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
