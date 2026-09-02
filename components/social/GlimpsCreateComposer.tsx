"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { Loader2, Upload, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_GLIMPS_CAPTION_LENGTH } from "@/lib/social/content-domain";
import { isValidGlimpsVideoMime } from "@/lib/social/content-domain";
import GlimpsCameraCapture from "@/components/social/GlimpsCameraCapture";

type Author = { id?: string; name: string; avatar?: string | null };
type Props = { profile: Author; organizations: Author[] };
type Metadata = { width: number; height: number; durationSeconds: number };
type Status = "idle" | "preparing" | "uploading" | "publishing" | "posted";
const MAX_BYTES = 100 * 1024 * 1024;

function readMetadata(file: File): Promise<Metadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), video = document.createElement("video");
    const done = () => URL.revokeObjectURL(url);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const durationSeconds = Math.round(video.duration);
      done();
      if (!Number.isFinite(video.duration) || durationSeconds <= 0) return reject(Error("We couldn't read this video's duration."));
      resolve({ width: video.videoWidth, height: video.videoHeight, durationSeconds });
    };
    video.onerror = () => { done(); reject(Error("We couldn't read this video's details. Try another MP4.")); };
    video.src = url;
  });
}

function Avatar({ author }: { author: Author }) {
  return <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 font-bold text-brand-indigo">{author.avatar ? <img src={author.avatar} alt="" className="h-full w-full object-cover" /> : author.name.charAt(0).toUpperCase()}</span>;
}

export default function GlimpsCreateComposer({ profile, organizations }: Props) {
  const router = useRouter(), input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null), [metadata, setMetadata] = useState<Metadata | null>(null), [preview, setPreview] = useState(""), [caption, setCaption] = useState(""), [author, setAuthor] = useState("personal"), [visibility, setVisibility] = useState("public"), [status, setStatus] = useState<Status>("idle"), [error, setError] = useState(""), [hint, setHint] = useState("");
  const busy = status !== "idle", selectedAuthor = author === "personal" ? profile : organizations.find((item) => item.id === author) || profile;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selectFile = async (candidate?: File) => {
    if (!candidate || busy) return;
    setError(""); setHint(""); setMetadata(null);
    if (!isValidGlimpsVideoMime(candidate.type)) return setError("Choose an MP4 or WebM video.");
    if (candidate.size > MAX_BYTES) return setError("Video must be 100 MB or smaller.");
    setStatus("preparing");
    try {
      const next = await readMetadata(candidate);
      if (next.durationSeconds > 60) throw Error("GLIMPS can be up to 60 seconds.");
      if (!next.width || !next.height) throw Error("We couldn't read this video's details. Try another MP4.");
      const ratio = next.width / next.height;
      if (ratio < 9 / 16 || ratio > 4 / 5) setHint("Portrait video works best in GLIMPS.");
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(candidate)); setFile(candidate); setMetadata(next);
    } catch (cause) { setFile(null); setError(cause instanceof Error ? cause.message : "Choose another MP4 video."); }
    finally { setStatus("idle"); }
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0]; event.target.value = ""; void selectFile(next); };
  const onDrop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); void selectFile(event.dataTransfer.files?.[0]); };
  const clear = () => { if (preview) URL.revokeObjectURL(preview); setPreview(""); setFile(null); setMetadata(null); setHint(""); setError(""); };
  const publish = async () => {
    if (!file || !metadata || busy) return;
    setError("");
    try {
      setStatus("preparing");
      const created = await fetch("/api/social/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: caption, visibility, organizationId: author === "personal" ? undefined : author, draft: true, contentDomain: "glimps" }) });
      const post = await created.json(); if (!created.ok) throw Error(post.error || "Could not prepare your GLIMPS.");
      const prepared = await fetch(`/api/social/posts/${post.post.id}/media/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }) });
      const uploadInfo = await prepared.json(); if (!prepared.ok) throw Error(uploadInfo.error || "Could not prepare video upload.");
      setStatus("uploading");
      const upload = await createClient().storage.from("post-media").uploadToSignedUrl(uploadInfo.path, uploadInfo.token, file, { contentType: file.type });
      if (upload.error) throw Error("Video upload failed. Your GLIMPS draft is still saved so you can retry.");
      const finalized = await fetch(`/api/social/posts/${post.post.id}/media/finalize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: uploadInfo.path, fileName: file.name, mimeType: file.type, fileSize: file.size, ...metadata }) });
      const finalInfo = await finalized.json(); if (!finalized.ok) throw Error(finalInfo.error || "Could not attach your video. Your GLIMPS draft is still saved so you can retry.");
      setStatus("publishing");
      const published = await fetch(`/api/social/posts/${post.post.id}/publish`, { method: "POST" });
      const publishInfo = await published.json(); if (!published.ok) throw Error(publishInfo.error || "Could not publish your GLIMPS. Your draft is still saved so you can retry.");
      setStatus("posted");
      setTimeout(() => router.push(`/social/posts/${post.post.id}`), 550);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); setStatus("idle"); }
  };
  return <section className="rounded-3xl border border-brand-borderLight bg-white p-4 pb-28 text-brand-midnight shadow-elevated sm:p-7 sm:pb-7">
    <header className="flex items-start justify-between gap-4"><div><p className="text-caption font-bold tracking-[.15em] text-brand-coral">GLIMPS</p><h1 className="mt-1 text-h2 font-extrabold">Share your work in motion.</h1><p className="mt-1 text-body-sm text-brand-slate">A short professional video for your network.</p></div><button type="button" onClick={() => router.back()} aria-label="Close GLIMPS creator" className="rounded-full p-2 text-brand-slate hover:bg-brand-ivory"><X /></button></header>
    <div className="mt-6 rounded-2xl border border-brand-borderLight bg-brand-ivory p-3"><label htmlFor="glimps-author" className="text-caption font-bold text-brand-slate">Post as</label><div className="mt-1 flex items-center gap-2"><Avatar author={selectedAuthor} /><select id="glimps-author" value={author} onChange={(event) => setAuthor(event.target.value)} disabled={busy} className="min-w-0 flex-1 rounded-lg border border-brand-borderLight bg-white px-3 py-2 font-bold outline-none focus:border-brand-indigo disabled:opacity-60"><option value="personal">{profile.name} · Personal profile</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name} · Organization</option>)}</select></div></div>
    {!file ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><GlimpsCameraCapture onVideo={(next) => void selectFile(next)} /><button type="button" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} disabled={busy} className="flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-indigo/30 bg-gradient-to-br from-brand-indigo/[.04] via-white to-brand-coral/[.05] p-6 text-center outline-none transition-colors hover:border-brand-indigo focus-visible:ring-2 focus-visible:ring-brand-indigo disabled:opacity-60"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-indigo text-white"><Upload className="h-6 w-6" /></span><b className="mt-4">Upload Video</b><span className="mt-1 text-body-sm text-brand-slate">MP4 or WebM · Up to 60 seconds · Max 100 MB</span></button></div> : <div className="mt-5 overflow-hidden rounded-3xl border border-brand-indigo/15 bg-brand-midnight"><video src={preview} controls playsInline preload="metadata" aria-label={`Preview ${file.name}`} className="mx-auto block max-h-[62dvh] w-full max-w-[28rem] bg-brand-midnight object-contain" /><div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3"><div className="min-w-0"><p className="truncate text-body-sm font-bold">{file.name}</p><p className="text-caption text-brand-slate">{metadata?.durationSeconds}s · {metadata?.width} × {metadata?.height}</p></div><div className="flex gap-2"><button type="button" onClick={clear} disabled={busy} className="rounded-xl border border-brand-borderLight px-3 py-2 text-caption font-bold text-brand-indigo">Retake / Replace</button><button type="button" onClick={clear} disabled={busy} aria-label="Remove selected video" className="rounded-xl px-3 py-2 text-caption font-bold text-brand-coral">Remove</button></div></div></div>}
    <input ref={input} type="file" accept="video/mp4,video/webm" className="hidden" onChange={onChange} />
    {hint && <p className="mt-3 rounded-xl bg-brand-indigo/[.06] p-3 text-body-sm text-brand-indigo" role="status">{hint}</p>}
    <label htmlFor="glimps-caption" className="mt-5 block text-caption font-bold text-brand-slate">Caption</label><textarea id="glimps-caption" value={caption} onChange={(event) => setCaption(event.target.value.slice(0, MAX_GLIMPS_CAPTION_LENGTH))} disabled={busy} rows={5} maxLength={MAX_GLIMPS_CAPTION_LENGTH} placeholder="Add a caption…" className="mt-2 w-full resize-none rounded-2xl border border-brand-borderLight bg-white p-4 text-body-sm outline-none placeholder:text-brand-slate focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/15 disabled:opacity-60" /><p className="mt-1 text-right text-caption text-brand-slate">{caption.length}/{MAX_GLIMPS_CAPTION_LENGTH}</p>
    <fieldset className="mt-4 rounded-2xl bg-brand-ivory p-3"><legend className="px-1 text-caption font-bold text-brand-slate">Who can see this?</legend>{[["public","Public"],["followers","Followers"]].map(([value,label]) => <label key={value} className="mr-4 inline-flex min-h-10 items-center gap-2 text-body-sm font-semibold"><input type="radio" value={value} checked={visibility === value} onChange={(event) => setVisibility(event.target.value)} disabled={busy} className="h-4 w-4 accent-brand-indigo" />{label}</label>)}</fieldset>
    {error && <p className="mt-4 rounded-xl bg-brand-coral/10 p-3 text-body-sm text-brand-coral" role="alert">{error}</p>}
    {status === "posted" && <p className="mt-4 rounded-xl bg-brand-indigo/[.08] p-3 text-body-sm font-bold text-brand-indigo" role="status">GLIMPS posted.</p>}
    <button type="button" onClick={publish} disabled={!file || !metadata || busy} className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex min-h-12 justify-center gap-2 rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white shadow-elevated disabled:opacity-60 sm:static sm:mt-6 sm:w-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{status === "preparing" ? "Preparing…" : status === "uploading" ? "Uploading video…" : status === "publishing" ? "Publishing GLIMPS…" : status === "posted" ? "GLIMPS posted." : "Post GLIMPS"}</button>
  </section>;
}
