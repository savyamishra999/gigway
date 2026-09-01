"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type JoxImage = { id: string; url: string; alt: string; width?: number | null; height?: number | null };
export default function JoxCompanionImages({ images }: { images: JoxImage[] }) {
  const [open, setOpen] = useState<JoxImage | null>(null);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  if (!images.length) return null;
  const layout = images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : images.length === 3 ? "grid-cols-2" : "grid-cols-2";
  return <><div className={`mt-4 grid gap-2 ${layout}`}>{images.map((image, index) => <button key={image.id} type="button" onClick={() => setOpen(image)} aria-label={`Enlarge companion image ${index + 1}`} className={`overflow-hidden rounded-2xl bg-brand-ivory outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo ${images.length === 3 && index === 0 ? "col-span-2" : ""}`}><img src={image.url} alt={image.alt} className={`w-full object-contain ${images.length === 1 ? "max-h-[19rem] sm:max-h-[24rem]" : images.length === 3 && index === 0 ? "max-h-56" : "max-h-40 sm:max-h-48"}`} /></button>)}</div>{open && <div role="dialog" aria-modal="true" aria-label="Enlarged Jox companion image" className="fixed inset-0 z-[70] grid place-items-center bg-brand-midnight/80 p-4" onClick={() => setOpen(null)}><button type="button" aria-label="Close image" onClick={() => setOpen(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-brand-midnight"><X className="h-5 w-5" /></button><img src={open.url} alt={open.alt} onClick={event => event.stopPropagation()} className="max-h-[85dvh] max-w-full rounded-2xl bg-white object-contain shadow-elevated" /></div>}</>;
}
