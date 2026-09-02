export type ExternalPreview = { kind: "youtube" | "instagram"; href: string; embedUrl?: string };

const safeUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url : null; } catch { return null; } };

export function urlsInText(value: string) { return value.match(/https?:\/\/[^\s<>]+/g) || []; }

export function externalPreviewFor(value: string): ExternalPreview | null {
  const url = safeUrl(value);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") { const id = url.pathname.split("/").filter(Boolean)[0]; return id && /^[\w-]{6,}$/.test(id) ? { kind: "youtube", href: url.href, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null; }
  if (host === "youtube.com" || host.endsWith(".youtube.com")) { const id = url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : url.searchParams.get("v"); return id && /^[\w-]{6,}$/.test(id) ? { kind: "youtube", href: url.href, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null; }
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return { kind: "instagram", href: url.href };
  return null;
}
