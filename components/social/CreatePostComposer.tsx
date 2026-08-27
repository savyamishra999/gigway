"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { FileText, ImagePlus, Loader2, Mic, Square, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import MentionPicker from "@/components/social/MentionPicker";
import { findActiveMention, replaceActiveMention } from "@/lib/social/mentions";
import { createClient } from "@/lib/supabase/client";
import type { VideoMetadata } from "@/lib/social/video";

type Author = { id?: string; name: string; avatar?: string | null };
type Props = { profile: Author; organizations: Author[] };
type MediaKind = "image" | "video" | "document" | "audio";
type Status = "idle" | "uploading" | "publishing" | "posted";

const MAX_VIJOX_SECONDS = 27;
const limits: Record<MediaKind, number> = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024, document: 20 * 1024 * 1024, audio: 10 * 1024 * 1024 };
const accepted: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"], video: ["video/mp4", "video/webm"],
  document: ["application/pdf"], audio: ["audio/webm"],
};
const kindOf = (file: File): MediaKind | null => file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "document" : file.type === "audio/webm" ? "audio" : null;
const fileSize = (bytes: number) => `${(bytes / 1e6).toFixed(bytes > 1e6 ? 1 : 0)} MB`;

const readMetadata = (file: File): Promise<VideoMetadata> => new Promise((resolve) => {
  const kind = kindOf(file);
  if (kind !== "image" && kind !== "video") return resolve({});
  const url = URL.createObjectURL(file);
  const finish = (metadata: VideoMetadata) => { URL.revokeObjectURL(url); resolve(metadata); };
  if (kind === "video") {
    const video = document.createElement("video");
    video.onloadedmetadata = () => finish({ width: video.videoWidth, height: video.videoHeight, durationSeconds: Number.isFinite(video.duration) ? Math.round(video.duration) : undefined });
    video.onerror = () => finish({}); video.src = url; return;
  }
  const image = new Image();
  image.onload = () => finish({ width: image.naturalWidth, height: image.naturalHeight });
  image.onerror = () => finish({}); image.src = url;
});

export default function CreatePostComposer({ profile, organizations }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const chunks = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mentionClosed, setMentionClosed] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [author, setAuthor] = useState("personal");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const busy = status !== "idle";
  const selectedKind = files[0] && kindOf(files[0]);
  const activeMention = useMemo(() => findActiveMention(body, cursor), [body, cursor]);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  useEffect(() => () => stopRecording(), []);

  function stopRecording() {
    if (recordingTimer.current) clearTimeout(recordingTimer.current);
    recordingTimer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    else recorder.current?.stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
  }

  const updateCursor = () => { const next = textarea.current?.selectionStart ?? cursor; if (next !== cursor) setMentionClosed(false); setCursor(next); };
  const selectMention = (username: string) => { const result = replaceActiveMention(body, cursor, username); setBody(result.text); setCursor(result.cursor); setMentionClosed(true); requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(result.cursor, result.cursor); }); };
  const onMentionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (!activeMention || mentionClosed || !["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) return; event.preventDefault(); picker.current?.dispatchEvent(new KeyboardEvent("keydown", { key: event.key, bubbles: true, cancelable: true })); };

  const choose = (kind: Exclude<MediaKind, "audio">) => { if (busy || recording) return; input.current?.setAttribute("accept", accepted[kind].join(",")); input.current?.setAttribute("data-kind", kind); input.current?.click(); };
  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files || []); const wanted = event.target.dataset.kind as Exclude<MediaKind, "audio">; event.target.value = ""; if (!next.length) return;
    setError("");
    if (next.some((file) => kindOf(file) !== wanted || !accepted[wanted].includes(file.type) || file.size > limits[wanted])) return void setError(`Choose supported ${wanted} files within the size limit.`);
    if (files.length && selectedKind !== wanted) return void setError("Use up to five images, or one video, PDF, or VIJOX in a post.");
    const combined = [...files, ...next];
    if ((wanted !== "image" && combined.length > 1) || combined.length > 5) return void setError(wanted === "image" ? "You can attach up to five images." : "Only one video or PDF can be attached.");
    setFiles(combined);
  };

  const startRecording = async () => {
    if (busy || recording || files.length) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return void setError("Voice recording is not supported by this browser.");
    try {
      const supportsOpus = MediaRecorder.isTypeSupported("audio/webm;codecs=opus");
      if (!supportsOpus && !MediaRecorder.isTypeSupported("audio/webm")) return void setError("This browser cannot create a compatible VIJOX recording.");
      setError(""); const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = supportsOpus ? "audio/webm;codecs=opus" : "audio/webm";
      const nextRecorder = new MediaRecorder(stream, { mimeType }); chunks.current = []; startedAt.current = Date.now();
      nextRecorder.ondataavailable = ({ data }) => { if (data.size) chunks.current.push(data); };
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const duration = Math.min(MAX_VIJOX_SECONDS, Math.max(1, Math.ceil((Date.now() - startedAt.current) / 1000)));
        if (!blob.size) setError("No audio was captured. Please try again.");
        else if (blob.size > limits.audio) setError("Your VIJOX is larger than the 10 MB limit.");
        else { setFiles([new File([blob], `vijox-${Date.now()}.webm`, { type: "audio/webm" })]); setRecordingSeconds(duration); }
        stream.getTracks().forEach((track) => track.stop()); recorder.current = null; setRecording(false);
      };
      recorder.current = nextRecorder; nextRecorder.start(); setRecording(true); setRecordingSeconds(0);
      recordingTimer.current = setTimeout(stopRecording, MAX_VIJOX_SECONDS * 1000);
    } catch { setError("Microphone access is needed to record a VIJOX."); }
  };
  const remove = (index: number) => { setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index)); setRecordingSeconds(0); };

  const submit = async () => {
    if (busy || recording) return; setError("");
    if (!body.trim() && !files.length) return void setError("Add text or an attachment before posting.");
    try {
      setStatus(files.length ? "uploading" : "publishing");
      const created = await fetch("/api/social/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, visibility, organizationId: author === "personal" ? undefined : author, draft: files.length > 0 }) });
      const createdBody = await created.json(); if (!created.ok) throw Error(createdBody.error || "Could not create post.");
      const postId = createdBody.post.id as string;
      for (const file of files) {
        const init = await fetch(`/api/social/posts/${postId}/media/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }) });
        const details = await init.json(); if (!init.ok) throw Error(details.error || "Could not prepare upload.");
        const upload = await createClient().storage.from("post-media").uploadToSignedUrl(details.path, details.token, file, { contentType: file.type }); if (upload.error) throw Error("Upload failed. Your text is still saved in this draft.");
        const metadata = await readMetadata(file);
        const finalized = await fetch(`/api/social/posts/${postId}/media/finalize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: details.path, fileName: file.name, mimeType: file.type, fileSize: file.size, ...metadata }) });
        const finalizedBody = await finalized.json(); if (!finalized.ok) throw Error(finalizedBody.error || "Could not attach uploaded media.");
      }
      if (files.length) { setStatus("publishing"); const published = await fetch(`/api/social/posts/${postId}/publish`, { method: "POST" }); const publishedBody = await published.json(); if (!published.ok) throw Error(publishedBody.error || "Could not publish post."); }
      setStatus("posted"); setTimeout(() => router.push("/home"), 700);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); setStatus("idle"); }
  };

  const disabledFor = (kind: MediaKind) => busy || recording || (!!selectedKind && selectedKind !== kind);
  return <section className="rounded-3xl border border-brand-borderLight bg-white p-4 shadow-elevated sm:p-7">
    <div className="flex items-center justify-between gap-3"><div><p className="text-caption font-bold tracking-[.15em] text-brand-coral">SOCIAL</p><h1 className="mt-1 text-h2 font-extrabold text-brand-midnight">Create Post</h1></div><button onClick={() => router.back()} className="rounded-full p-2 text-brand-slate hover:bg-brand-ivory" aria-label="Close"><X className="h-5 w-5" /></button></div>
    <div className="mt-6 rounded-2xl bg-brand-ivory p-3"><label className="text-caption font-bold text-brand-slate">Post as</label><select value={author} onChange={(event) => setAuthor(event.target.value)} disabled={busy || recording} className="mt-1 w-full bg-transparent text-body-sm font-bold text-brand-midnight outline-none"><option value="personal">{profile.name} · Personal profile</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name} · Organization</option>)}</select></div>
    <textarea ref={textarea} value={body} onChange={(event) => { setBody(event.target.value.slice(0, 5000)); setCursor(event.target.selectionStart); setMentionClosed(false); }} onSelect={updateCursor} onClick={updateCursor} onKeyUp={updateCursor} onKeyDown={onMentionKeyDown} disabled={busy || recording} rows={7} maxLength={5000} placeholder="Share something useful with your professional network..." className="mt-5 w-full resize-none rounded-2xl border border-brand-borderLight bg-white p-4 text-body-sm leading-6 text-brand-midnight shadow-inner shadow-brand-indigo/5 outline-none placeholder:text-brand-slate focus:border-brand-indigo focus:ring-4 focus:ring-brand-indigo/10 disabled:bg-brand-ivory" />
    {activeMention && !mentionClosed && <div ref={picker} className="relative z-10 mt-2"><MentionPicker query={activeMention.query} onSelect={selectMention} onClose={() => setMentionClosed(true)} /></div>}<div className="mt-1 text-right text-caption text-brand-slate">{body.length}/5000</div><input ref={input} type="file" className="hidden" onChange={onFiles} />
    {files.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="relative min-w-0 rounded-xl border border-brand-borderLight bg-brand-ivory p-3">{kindOf(file) === "image" ? <img src={previews[index]} alt="Selected preview" className="h-28 w-full rounded-lg object-cover" /> : kindOf(file) === "audio" ? <div className="flex h-28 flex-col items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo"><Mic className="h-8 w-8" /><span className="mt-2 text-caption font-bold">VIJOX{recordingSeconds ? ` · ${recordingSeconds}s` : ""}</span></div> : <div className="flex h-28 items-center justify-center rounded-lg bg-white"><FileText className="h-8 w-8 text-brand-indigo" /></div>}<p className="mt-2 truncate text-caption font-bold text-brand-midnight">{file.name}</p><p className="text-caption text-brand-slate">{fileSize(file.size)}</p><button disabled={busy} onClick={() => remove(index)} className="absolute right-2 top-2 rounded-full bg-white p-1 text-brand-coral shadow" aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button></div>)}</div>}
    <div className="mt-5 flex flex-wrap gap-2 border-y border-brand-borderLight py-3"><button disabled={disabledFor("image")} onClick={() => choose("image")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><ImagePlus className="h-4 w-4" />Photo</button><button disabled={disabledFor("video")} onClick={() => choose("video")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><Video className="h-4 w-4" />Video</button><button disabled={disabledFor("document")} onClick={() => choose("document")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><FileText className="h-4 w-4" />Document</button><button disabled={busy || (!!selectedKind && selectedKind !== "audio")} onClick={recording ? stopRecording : startRecording} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40">{recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}{recording ? "Stop recording" : "Record VIJOX"}</button></div>
    {recording && <p className="mt-2 text-caption font-bold text-brand-coral">Recording now — it stops automatically after {MAX_VIJOX_SECONDS} seconds.</p>}{selectedKind && <p className="mt-2 text-caption text-brand-slate">{selectedKind === "image" ? "Up to five images, 10 MB each." : selectedKind === "video" ? "One video, up to 100 MB." : selectedKind === "audio" ? `One VIJOX, up to ${MAX_VIJOX_SECONDS} seconds and 10 MB.` : "One PDF, up to 20 MB."}</p>}
    <div className="mt-5"><p className="text-caption font-bold text-brand-slate">Who can see this?</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{[["public", "Public", "Anyone on GigWay can see this."], ["followers", "Followers", "Only people who follow you can see this."]].map(([value, label, description]) => <label key={value} className="rounded-xl border border-brand-borderLight p-3 text-body-sm"><input type="radio" value={value} checked={visibility === value} onChange={(event) => setVisibility(event.target.value)} disabled={busy || recording} className="mr-2" />{label}<p className="ml-5 mt-1 text-caption text-brand-slate">{description}</p></label>)}</div></div>
    {error && <p className="mt-4 rounded-xl bg-brand-coral/10 p-3 text-body-sm text-brand-coral">{error}</p>}{status === "posted" && <p className="mt-4 rounded-xl bg-brand-success/10 p-3 text-body-sm text-brand-success">Posted successfully.</p>}<button onClick={submit} disabled={busy || recording} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white hover:bg-brand-indigoDark disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{status === "uploading" ? "Uploading..." : status === "publishing" ? "Publishing..." : status === "posted" ? "Posted" : recording ? "Finish recording first" : "Post"}</button>
  </section>;
}
