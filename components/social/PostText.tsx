import Link from "next/link";
import type { PostHighlight } from "@/lib/social/gigthought";

type Props = { body: string; mentions?: string[]; highlights?: PostHighlight[]; hiddenUrls?: string[]; gigThought?: boolean };

export default function PostText({ body, mentions = [], highlights = [], hiddenUrls = [], gigThought = false }: Props) {
  const validMentions = new Set(mentions.map((value) => value.toLowerCase()));
  const hidden = new Set(hiddenUrls);
  const token = /(@[a-zA-Z0-9_]{1,32}|#[\p{L}\p{N}_]{1,64}|https?:\/\/[^\s<>]+)/gu;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  const normal = (text: string, start: number) => {
    if (!text) return;
    let at = 0;
    for (const range of highlights) {
      const from = Math.max(0, range.start - start), to = Math.min(text.length, range.end - start);
      if (to <= from) continue;
      if (from > at) parts.push(text.slice(at, from));
      parts.push(<span key={`h-${start}-${from}`} className="font-semibold text-brand-coral">{text.slice(from, to)}</span>);
      at = to;
    }
    if (at < text.length) parts.push(text.slice(at));
  };
  for (const match of body.matchAll(token)) {
    const value = match[0], start = match.index || 0;
    const isMention = value.startsWith("@") && (start === 0 || /\s/.test(body[start - 1]));
    const isHashtag = value.startsWith("#") && (start === 0 || !/[\p{L}\p{N}_]/u.test(body[start - 1]));
    normal(body.slice(cursor, start), cursor);
    if (isMention && validMentions.has(value.slice(1).toLowerCase())) {
      parts.push(<Link key={`m-${index++}`} href={`/u/${value.slice(1)}`} className="font-semibold text-brand-indigo underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo">{value}</Link>);
    } else if (isHashtag) {
      const tag = value.slice(1);
      parts.push(<Link key={`t-${index++}`} href={`/social/explore?tag=${encodeURIComponent(tag)}`} className="font-semibold text-violet-700 underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700">{value}</Link>);
    } else if (value.startsWith("http")) {
      parts.push(hidden.has(value) ? null : <a key={`u-${index++}`} href={value} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-indigo underline underline-offset-2">{value}</a>);
    } else normal(value, start);
    cursor = start + value.length;
  }
  normal(body.slice(cursor), cursor);
  const size = gigThought ? (body.length <= 80 ? "text-[20px] leading-8" : body.length <= 160 ? "text-[18px] leading-7" : "text-[16px] leading-7") : "text-body-sm leading-6";
  return <p className={`whitespace-pre-wrap break-words pt-4 text-brand-midnight ${size}`}>{parts}</p>;
}
