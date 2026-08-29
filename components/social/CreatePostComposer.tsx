"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  FileText,
  ImagePlus,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import MentionPicker from "@/components/social/MentionPicker";
import { findActiveMention, replaceActiveMention } from "@/lib/social/mentions";
import { createClient } from "@/lib/supabase/client";
import type { VideoMetadata } from "@/lib/social/video";
import VijoxExperience from "@/components/social/VijoxExperience";
import VijoxCircularProgress from "@/components/social/VijoxCircularProgress";
type Author = { id?: string; name: string; avatar?: string | null };
type Props = { profile: Author; organizations: Author[] };
type Kind = "image" | "video" | "document" | "audio";
type Status = "idle" | "uploading" | "publishing" | "posted";
const MAX = 27,
  limits: Record<Kind, number> = {
    image: 10485760,
    video: 104857600,
    document: 20971520,
    audio: 10485760,
  },
  accept: Record<Kind, string[]> = {
    image: ["image/jpeg", "image/png", "image/webp"],
    video: ["video/mp4", "video/webm"],
    document: ["application/pdf"],
    audio: ["audio/webm"],
  };
const kind = (f: File): Kind | null =>
  f.type.startsWith("image/")
    ? "image"
    : f.type.startsWith("video/")
      ? "video"
      : f.type === "application/pdf"
        ? "document"
        : f.type === "audio/webm"
          ? "audio"
          : null;
const clock = (n: number) =>
  `00:${Math.max(0, Math.floor(n)).toString().padStart(2, "0")}`;
const metadata = (f: File): Promise<VideoMetadata> =>
  new Promise((resolve) => {
    const k = kind(f);
    if (k !== "image" && k !== "video" && k !== "audio") return resolve({});
    const url = URL.createObjectURL(f),
      done = (x: VideoMetadata) => {
        URL.revokeObjectURL(url);
        resolve(x);
      };
    if (k === "image") {
      const i = new Image();
      i.onload = () => done({ width: i.naturalWidth, height: i.naturalHeight });
      i.onerror = () => done({});
      i.src = url;
      return;
    }
    const media = document.createElement(k === "audio" ? "audio" : "video");
    media.onloadedmetadata = () =>
      done(
        k === "audio"
          ? {
              durationSeconds: Number.isFinite(media.duration)
                ? Math.min(MAX, Math.ceil(media.duration))
                : undefined,
            }
          : {
              width: (media as HTMLVideoElement).videoWidth,
              height: (media as HTMLVideoElement).videoHeight,
              durationSeconds: Number.isFinite(media.duration)
                ? Math.round(media.duration)
                : undefined,
            },
      );
    media.onerror = () => done({});
    media.src = url;
  });
function Avatar({ a }: { a: Author }) {
  return (
    <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 font-extrabold text-brand-indigo">
      {a.avatar ? (
        <img src={a.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        a.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
export default function CreatePostComposer({ profile, organizations }: Props) {
  const router = useRouter(),
    params = useSearchParams(),
    input = useRef<HTMLInputElement>(null),
    textarea = useRef<HTMLTextAreaElement>(null),
    picker = useRef<HTMLDivElement>(null),
    rec = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    ctx = useRef<AudioContext | null>(null),
    analyser = useRef<AnalyserNode | null>(null),
    frame = useRef<number | null>(null),
    timeout = useRef<ReturnType<typeof setTimeout> | null>(null),
    interval = useRef<ReturnType<typeof setInterval> | null>(null),
    start = useRef(0),
    chunks = useRef<Blob[]>([]),
    preview = useRef<HTMLAudioElement>(null);
  const [body, setBody] = useState(""),
    [cursor, setCursor] = useState(0),
    [closed, setClosed] = useState(false),
    [visibility, setVisibility] = useState("public"),
    [author, setAuthor] = useState("personal"),
    [files, setFiles] = useState<File[]>([]),
    [error, setError] = useState(""),
    [status, setStatus] = useState<Status>("idle"),
    [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [level, setLevel] = useState(0),
    [playing, setPlaying] = useState(false),
    [current, setCurrent] = useState(0),
    [vijoxTranscriptText, setVijoxTranscriptText] = useState(""),
    [editingVijoxTranscript, setEditingVijoxTranscript] = useState(false);
  const busy = status !== "idle",
    active = useMemo(() => findActiveMention(body, cursor), [body, cursor]),
    images = files.filter((f) => kind(f) === "image"),
    vijox = files.find((f) => kind(f) === "audio"),
    urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]),
    vijoxUrl = vijox ? urls[files.indexOf(vijox)] : undefined;
  const cleanup = () => {
    if (timeout.current) clearTimeout(timeout.current);
    if (interval.current) clearInterval(interval.current);
    if (frame.current) cancelAnimationFrame(frame.current);
    timeout.current = interval.current = frame.current = null;
    analyser.current?.disconnect();
    ctx.current?.close().catch(() => undefined);
    stream.current?.getTracks().forEach((t) => t.stop());
    analyser.current = null;
    ctx.current = null;
    stream.current = null;
  };
  useEffect(
    () => () => {
      cleanup();
      preview.current?.pause();
    },
    [],
  );
  useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls]);
  const stop = () => {
    if (rec.current?.state === "recording") rec.current.stop();
    else cleanup();
    setRecording(false);
  };
  const choose = (k: Exclude<Kind, "audio">) => {
    if (!busy && !recording) {
      input.current?.setAttribute("accept", accept[k].join(","));
      input.current?.setAttribute("data-kind", k);
      input.current?.click();
    }
  };
  const add = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(e.target.files || []),
      wanted = e.target.dataset.kind as Exclude<Kind, "audio">;
    e.target.value = "";
    if (!next.length) return;
    if (
      next.some(
        (f) =>
          kind(f) !== wanted ||
          !accept[wanted].includes(f.type) ||
          f.size > limits[wanted],
      )
    )
      return setError(
        `Choose supported ${wanted} files within the size limit.`,
      );
    if (vijox && wanted !== "image")
      return setError(
        "A VIJOX can be paired with images, but not video or documents.",
      );
    if (files.length && !vijox && kind(files[0]) !== wanted)
      return setError(
        "Use up to five images, or one video, PDF, or VIJOX in a post.",
      );
    if (wanted !== "image" && files.length)
      return setError("Only one attachment is allowed.");
    if (images.length + next.length > (vijox ? 4 : 5))
      return setError(`You can attach up to ${vijox ? 4 : 5} images.`);
    setError("");
    setFiles((f) => [...f, ...next]);
  };
  const record = async () => {
    if (busy || recording || (files.length && !images.length)) return;
    setVijoxTranscriptText("");
    setEditingVijoxTranscript(false);
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    )
      return setError("Voice recording is not supported by this browser.");
    try {
      const opus = MediaRecorder.isTypeSupported("audio/webm;codecs=opus");
      if (!opus && !MediaRecorder.isTypeSupported("audio/webm"))
        return setError(
          "This browser cannot create a compatible VIJOX recording.",
        );
      setError("");
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.current = s;
      const c = new AudioContext(),
        source = c.createMediaStreamSource(s),
        a = c.createAnalyser();
      a.fftSize = 256;
      source.connect(a);
      ctx.current = c;
      analyser.current = a;
      const data = new Uint8Array(a.fftSize),
        read = () => {
          a.getByteTimeDomainData(data);
          let sum = 0;
          data.forEach((x) => {
            const v = (x - 128) / 128;
            sum += v * v;
          });
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 5));
          frame.current = requestAnimationFrame(read);
        };
      read();
      const r = new MediaRecorder(s, {
        mimeType: opus ? "audio/webm;codecs=opus" : "audio/webm",
      });
      chunks.current = [];
      start.current = Date.now();
      r.ondataavailable = ({ data }) => {
        if (data.size) chunks.current.push(data);
      };
      r.onerror = () => {
        cleanup();
        setRecording(false);
        setError("Recording failed. Please try again.");
      };
      r.onstop = () => {
        const duration = Math.min(
            MAX,
            Math.max(1, Math.ceil((Date.now() - start.current) / 1000)),
          ),
          blob = new Blob(chunks.current, { type: "audio/webm" });
        cleanup();
        rec.current = null;
        setRecording(false);
        setLevel(0);
        if (!blob.size) setError("No audio was captured. Please try again.");
        else if (blob.size > limits.audio)
          setError("Your VIJOX is larger than the 10 MB limit.");
        else {
          setFiles((f) => [
            ...f.filter((x) => kind(x) !== "audio"),
            new File([blob], `vijox-${Date.now()}.webm`, {
              type: "audio/webm",
            }),
          ]);
          setSeconds(duration);
        }
      };
      rec.current = r;
      r.start();
      setRecording(true);
      setSeconds(0);
      interval.current = setInterval(
        () => setSeconds(Math.min(MAX, (Date.now() - start.current) / 1000)),
        100,
      );
      timeout.current = setTimeout(stop, MAX * 1000);
    } catch {
      cleanup();
      setError("Microphone access is needed to record a VIJOX.");
    }
  };
  const removeVijox = () => {
    preview.current?.pause();
    setPlaying(false);
    setCurrent(0);
    setSeconds(0);
    setVijoxTranscriptText("");
    setEditingVijoxTranscript(false);
    setFiles((f) => f.filter((x) => kind(x) !== "audio"));
  };
  const submit = async () => {
    if (busy || recording) return;
    if (!body.trim() && !files.length)
      return setError("Add text or an attachment before posting.");
    try {
      setStatus(files.length ? "uploading" : "publishing");
      const created = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            body,
            visibility,
            organizationId: author === "personal" ? undefined : author,
            draft: files.length > 0,
            momentSlug: params.get("moment") || undefined,
            vijoxTranscriptText:
              vijox && vijoxTranscriptText.trim()
                ? vijoxTranscriptText.trim()
                : undefined,
          }),
        }),
        cb = await created.json();
      if (!created.ok) throw Error(cb.error || "Could not create post.");
      for (const file of files) {
        const init = await fetch(
            `/api/social/posts/${cb.post.id}/media/upload`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
              }),
            },
          ),
          d = await init.json();
        if (!init.ok) throw Error(d.error || "Could not prepare upload.");
        const upload = await createClient()
          .storage.from("post-media")
          .uploadToSignedUrl(d.path, d.token, file, { contentType: file.type });
        if (upload.error)
          throw Error("Upload failed. Your text is still saved in this draft.");
        const final = await fetch(
            `/api/social/posts/${cb.post.id}/media/finalize`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                path: d.path,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                ...(await metadata(file)),
              }),
            },
          ),
          fb = await final.json();
        if (!final.ok)
          throw Error(fb.error || "Could not attach uploaded media.");
      }
      if (files.length) {
        setStatus("publishing");
        const p = await fetch(`/api/social/posts/${cb.post.id}/publish`, {
            method: "POST",
          }),
          pb = await p.json();
        if (!p.ok) throw Error(pb.error || "Could not publish post.");
      }
      setStatus("posted");
      setTimeout(() => router.push("/home"), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("idle");
    }
  };
  const disabled = (k: Kind) =>
    busy ||
    recording ||
    (k === "image"
      ? !!files.length && !vijox && !images.length
      : !!files.length && !(k === "audio" && images.length));
  const update = () => {
    const n = textarea.current?.selectionStart ?? cursor;
    if (n !== cursor) setClosed(false);
    setCursor(n);
  };
  const select = (u: string) => {
    const x = replaceActiveMention(body, cursor, u);
    setBody(x.text);
    setCursor(x.cursor);
    setClosed(true);
    requestAnimationFrame(() =>
      textarea.current?.setSelectionRange(x.cursor, x.cursor),
    );
  };
  return (
    <section className="rounded-3xl border border-brand-borderLight bg-white p-4 shadow-elevated sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption font-bold tracking-[.15em] text-brand-coral">
            SOCIAL
          </p>
          <h1 className="mt-1 text-h2 font-extrabold text-brand-midnight">
            Create Post
          </h1>
        </div>
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="rounded-full p-2"
        >
          <X />
        </button>
      </div>
      <div className="mt-6 rounded-2xl bg-brand-ivory p-3">
        <label className="text-caption font-bold text-brand-slate">
          Post as
        </label>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={busy || recording}
          className="mt-1 w-full bg-transparent font-bold outline-none"
        >
          <option value="personal">{profile.name} · Personal profile</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · Organization
            </option>
          ))}
        </select>
      </div>
      <textarea
        ref={textarea}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, 5000));
          setCursor(e.target.selectionStart);
          setClosed(false);
        }}
        onSelect={update}
        onClick={update}
        onKeyUp={update}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (
            active &&
            !closed &&
            ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)
          ) {
            e.preventDefault();
            picker.current?.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: e.key,
                bubbles: true,
                cancelable: true,
              }),
            );
          }
        }}
        disabled={busy || recording}
        rows={7}
        maxLength={5000}
        placeholder="Share something useful with your professional network..."
        className="mt-5 w-full resize-none rounded-2xl border border-brand-borderLight p-4 text-body-sm outline-none focus:border-brand-indigo"
      />
      {active && !closed && (
        <div ref={picker} className="relative z-10 mt-2">
          <MentionPicker
            query={active.query}
            onSelect={select}
            onClose={() => setClosed(true)}
          />
        </div>
      )}
      <div className="mt-1 text-right text-caption text-brand-slate">
        {body.length}/5000
      </div>
      <input ref={input} type="file" className="hidden" onChange={add} />
      {recording && (
        <div className="mt-4 rounded-3xl border border-violet-200 bg-gradient-to-br from-pink-50 via-white to-cyan-50 p-5 text-center">
          <p className="text-[10px] font-extrabold tracking-[.16em] text-violet-700">
            RECORDING VIJOX
          </p>
          <div className="mx-auto mt-4">
            <VijoxCircularProgress currentTimeMs={Math.round(seconds * 1000)} durationMs={MAX * 1000} energy={level} label={`Recording VIJOX: ${clock(seconds)} of 00:27`} center={<Avatar a={profile} />} />
          </div>
          <p className="mt-4 text-lg font-extrabold tabular-nums text-brand-midnight">
            {clock(seconds)} <span className="text-brand-slate">/ 00:27</span>
          </p>
          <p className="mt-1 text-caption text-brand-slate">
            Listening to your voice · stops automatically at 27 seconds
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={stop}
              aria-label="Stop VIJOX recording"
              className="flex items-center gap-2 rounded-xl bg-brand-indigo px-4 py-2.5 font-bold text-white"
            >
              <Square className="h-4 w-4 fill-current" />
              Stop
            </button>
            <button
              onClick={() => {
                chunks.current = [];
                setVijoxTranscriptText("");
                setEditingVijoxTranscript(false);
                stop();
              }}
              aria-label="Cancel VIJOX recording"
              className="rounded-xl border px-4 py-2.5 font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {vijox && (
        <div className="mt-4 rounded-3xl border border-violet-200 bg-gradient-to-br from-pink-50 via-white to-cyan-50 p-4">
          <VijoxExperience src={vijoxUrl || ""} duration={seconds || MAX} avatar={profile.avatar} name={profile.name} imageUrl={images[0] ? urls[files.indexOf(images[0])] : undefined} imageAlt={images[0]?.name || "Selected VIJOX scene image"} transcript={vijoxTranscriptText.trim() ? { text: vijoxTranscriptText.trim() } : null} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={record} className="rounded-xl border border-brand-indigo/20 bg-white px-3 py-2 text-caption font-bold text-brand-indigo">Jox Again</button>
            <button onClick={removeVijox} aria-label="Remove VIJOX" className="flex items-center gap-1 px-2 py-2 text-caption font-bold text-brand-coral"><Trash2 className="h-3.5 w-3.5" />Remove</button>
            <button onClick={() => setEditingVijoxTranscript(true)} aria-label={vijoxTranscriptText.trim() ? "Edit VIJOX transcript" : "Add VIJOX transcript"} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-caption font-bold text-violet-700">{vijoxTranscriptText.trim() ? "Edit transcript" : "Add transcript"}</button>
          </div>
          {editingVijoxTranscript && <div className="mt-3 rounded-2xl border border-violet-100 bg-white/80 p-3"><label htmlFor="vijox-transcript" className="text-caption font-bold text-brand-midnight">Add the words spoken in your VIJOX</label><textarea id="vijox-transcript" value={vijoxTranscriptText} onChange={event => setVijoxTranscriptText(event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full resize-none rounded-xl border border-brand-borderLight bg-white p-3 text-body-sm text-brand-midnight outline-none focus:border-brand-indigo" aria-describedby="vijox-transcript-count" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span id="vijox-transcript-count" className="text-caption text-brand-slate">{vijoxTranscriptText.length} / 2000 characters</span><div className="flex gap-2"><button type="button" onClick={() => setEditingVijoxTranscript(false)} className="rounded-lg bg-brand-indigo px-3 py-1.5 text-caption font-bold text-white">Done</button><button type="button" onClick={() => { setVijoxTranscriptText(""); setEditingVijoxTranscript(false); }} aria-label="Remove VIJOX transcript" className="rounded-lg px-3 py-1.5 text-caption font-bold text-brand-coral">Remove transcript</button></div></div></div>}
        </div>
      )}
      {images.length > 0 && !vijox && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {files.map((f, i) =>
            kind(f) === "image" ? (
              <div
                key={`${f.name}-${i}`}
                className="relative rounded-xl border p-3"
              >
                <img
                  src={urls[i]}
                  alt="Selected preview"
                  className="h-28 w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => setFiles((x) => x.filter((_, n) => n !== i))}
                  aria-label={`Remove ${f.name}`}
                  className="absolute right-2 top-2 rounded-full bg-white p-1 text-brand-coral"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null,
          )}
        </div>
      )}
      {!vijox && files.length > 0 && (
        <div className="mt-4 rounded-xl border p-3">
          {kind(files[0]) === "video" ? (
            <video src={urls[0]} controls className="h-28 w-full" />
          ) : (
            <FileText className="h-8 w-8 text-brand-indigo" />
          )}
          <button
            onClick={() => setFiles([])}
            aria-label="Remove attachment"
            className="float-right rounded-full p-1 text-brand-coral"
          >
            <X />
          </button>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-y border-brand-borderLight py-3">
        <button
          disabled={disabled("image")}
          onClick={() => choose("image")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-brand-indigo disabled:opacity-40"
        >
          <ImagePlus className="h-4 w-4" />
          Photo
        </button>
        <button
          disabled={disabled("video")}
          onClick={() => choose("video")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-brand-indigo disabled:opacity-40"
        >
          <Video className="h-4 w-4" />
          Video
        </button>
        <button
          disabled={disabled("document")}
          onClick={() => choose("document")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-brand-indigo disabled:opacity-40"
        >
          <FileText className="h-4 w-4" />
          Document
        </button>
        <button
          disabled={disabled("audio")}
          onClick={record}
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-brand-indigo disabled:opacity-40"
        >
          <Mic className="h-4 w-4" />
          {vijox ? "Jox Again" : "Create a Jox"}
        </button>
      </div>
      <p className="mt-2 text-caption text-brand-slate">
        {vijox
          ? "Your VIJOX can be Joxed with your caption and up to four images."
          : "Jox your voice in up to 27 seconds, or add media."}
      </p>
      <div className="mt-5">
        <p className="text-caption font-bold text-brand-slate">
          Who can see this?
        </p>
        {[
          ["public", "Public"],
          ["followers", "Followers"],
        ].map(([v, l]) => (
          <label key={v} className="mr-4 text-body-sm">
            <input
              type="radio"
              value={v}
              checked={visibility === v}
              onChange={(e) => setVisibility(e.target.value)}
              className="mr-1"
            />
            {l}
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-brand-coral/10 p-3 text-body-sm text-brand-coral">
          {error}
        </p>
      )}
      <button
        onClick={submit}
        disabled={busy || recording}
        className="mt-6 flex w-full justify-center gap-2 rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "uploading"
          ? "Uploading..."
          : status === "publishing"
            ? "Publishing..."
            : status === "posted"
              ? (vijox ? "Joxed" : "Posted")
              : (vijox ? "Jox" : "Post")}
      </button>
    </section>
  );
}
