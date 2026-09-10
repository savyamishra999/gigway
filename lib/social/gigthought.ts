export type PostHighlight = { start: number; end: number };
export function validPostHighlights(value: unknown, body: string): PostHighlight[] {
  if (!Array.isArray(value) || value.length > 8) return [];
  const rows = value.filter((item): item is PostHighlight => !!item && typeof item === "object" && Number.isInteger((item as PostHighlight).start) && Number.isInteger((item as PostHighlight).end)).map(item => ({ start: item.start, end: item.end }));
  if (rows.length !== value.length || rows.some(item => item.start < 0 || item.end <= item.start || item.end > body.length || item.end - item.start > 80)) return [];
  const sorted = [...rows].sort((a,b) => a.start - b.start);
  return sorted.some((item,index) => index > 0 && item.start < sorted[index-1].end) ? [] : sorted;
}
