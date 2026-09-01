export type ContentDomain = "post" | "jox" | "glimps";
export type PersistedContentFormat = "standard" | "vijox" | "glimps";
export type ContentMedia = { type?: unknown; mimeType?: unknown; fileSizeBytes?: unknown; durationSeconds?: unknown };
export const MAX_JOX_CAPTION_LENGTH = 500;

const domainToPersisted: Record<ContentDomain, PersistedContentFormat> = { post: "standard", jox: "vijox", glimps: "glimps" };
const persistedToDomain: Record<PersistedContentFormat, ContentDomain> = { standard: "post", vijox: "jox", glimps: "glimps" };

export function parseContentDomain(value: unknown): ContentDomain | null { return value === "post" || value === "jox" || value === "glimps" ? value : null; }
export function parsePersistedContentFormat(value: unknown): PersistedContentFormat | null { return value === "standard" || value === "vijox" || value === "glimps" ? value : null; }
export function toContentDomain(value: unknown): ContentDomain | null { const persisted = parsePersistedContentFormat(value); return persisted ? persistedToDomain[persisted] : parseContentDomain(value); }
export function toPersistedContentFormat(value: ContentDomain): PersistedContentFormat { return domainToPersisted[value]; }
export function isJox(value: unknown): boolean { return toContentDomain(value) === "jox"; }
export function isGlimps(value: unknown): boolean { return toContentDomain(value) === "glimps"; }
export function isStandardPost(value: unknown): boolean { return toContentDomain(value) === "post"; }
export function isValidJoxContent(media: ContentMedia[]): boolean { const audio = media.filter(item => item.type === "audio" && isValidJoxMime(item.mimeType) && typeof item.durationSeconds === "number" && Number.isInteger(item.durationSeconds) && item.durationSeconds > 0 && item.durationSeconds <= 27); return audio.length === 1 && media.length === audio.length + media.filter(item => item.type === "image").length && media.length <= 5; }
export function isValidJoxMime(mimeType: unknown): boolean { if (typeof mimeType !== "string") return false; const [base, ...parameters] = mimeType.toLowerCase().split(";").map(value => value.trim()); return base === "audio/webm" && (!parameters.length || parameters.every(parameter => parameter === "codecs=opus")); }
export function allowsMediaComposition(domain: ContentDomain, media: ContentMedia[]): boolean { if (domain === "post") return media.length <= 5 && (media.length <= 1 || media.every(item => item.type === "image")); if (domain === "jox") return media.every(item => item.type === "audio" || item.type === "image") && media.filter(item => item.type === "audio").length <= 1 && media.length <= 5; return media.length <= 1 && media.every(item => item.type === "video" && item.mimeType === "video/mp4"); }
