import { externalPreviewFor, urlsInText } from "@/lib/social/external-links";

export default function ExternalPostPreview({ body }: { body: string }) {
  const preview = urlsInText(body).map(externalPreviewFor).find(Boolean);
  if (!preview) return null;
  if (preview.kind === "youtube") return <div className="mt-4 overflow-hidden rounded-2xl bg-black"><div className="aspect-video w-full"><iframe src={preview.embedUrl} title="YouTube video shared in this post" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full border-0" /></div><a href={preview.href} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-caption font-bold text-white underline underline-offset-2">Watch on YouTube</a></div>;
  return <a href={preview.href} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-white p-4 text-body-sm text-brand-midnight"><span><b className="block">Instagram</b><span className="mt-1 block text-caption text-brand-slate">View this shared post or Reel on Instagram.</span></span><span className="shrink-0 text-caption font-bold text-brand-indigo">View on Instagram</span></a>;
}
