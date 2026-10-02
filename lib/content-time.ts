// Explicit English/IST formatting keeps server and browser output identical.
export const CONTENT_TIME_ZONE = "Asia/Kolkata";
type Timestamp = string | null | undefined;
export function timestampMillis(value: Timestamp): number | null {
  // Never interpret a timezone-less datetime using the host's local timezone.
  if (!value || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}
export function formatContentDate(value: Timestamp): string | null {
  const time = timestampMillis(value);
  if (time === null) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONTENT_TIME_ZONE, day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(time);
  const part = (type: string) => parts.find(p => p.type === type)?.value || "";
  return `${part("day")} ${part("month")} ${part("year")}, ${Number(part("hour")) || 12}:${part("minute")} ${part("dayPeriod").toUpperCase()} IST`;
}
export function formatContentAge(value: Timestamp, now: number): string | null {
  const time = timestampMillis(value);
  if (time === null || !Number.isFinite(now)) return null;
  if (time > now) return formatContentDate(value);
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
  return formatContentDate(value);
}
export function contentTimestamp(createdAt: Timestamp, updatedAt?: Timestamp) {
  const created = timestampMillis(createdAt), updated = timestampMillis(updatedAt);
  // Ignore insert-time clock noise; only a later stored minute counts as an update.
  if (updated !== null && (created === null || updated - created >= 60_000)) return { value: updatedAt!, label: "Updated" };
  return created === null ? null : { value: createdAt!, label: "Posted" };
}
