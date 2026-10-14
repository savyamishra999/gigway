export const MESSAGE_LIMIT = 4000
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
export type Message = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; is_read: boolean }
export function parseActivityCursor(value: string) {
  const [created_at, id, extra] = value.split("|")
  if (extra !== undefined || !uuid(id) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(created_at || "") || !Number.isFinite(Date.parse(created_at))) return null
  return { created_at, id }
}
export const activityCursor = (row: { created_at: string; id: string }) => `${row.created_at}|${row.id}`
export function mergeMessages(previous: Message[], incoming: Message[]) {
  return [...new Map([...previous, ...incoming].map(row => [row.id, row])).values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
}
