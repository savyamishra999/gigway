"use client";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, Loader2, Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MentionPicker from "@/components/social/MentionPicker";
import { findActiveMention, replaceActiveMention } from "@/lib/social/mentions";
import type { VideoMetadata } from "@/lib/social/video";
type Author = {
    id?: string;
    name: string;
    avatar?: string | null;
};
type Props = {
    profile: Author;
    organizations: Author[];
};
type MediaKind = "image" | "video" | "document";
const limits: Record<MediaKind, number> = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024, document: 20 * 1024 * 1024 };
const allow: Record<MediaKind, string[]> = { image: ["image/jpeg", "image/png", "image/webp"], video: ["video/mp4", "video/webm"], document: ["application/pdf"] };
const kindOf = (f: File): MediaKind | null => f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type === "application/pdf" ? "document" : null;
const size = (n: number) => `${(n / 1024 / 1024).toFixed(n > 1024 * 1024 ? 1 : 0)} MB`;
const readMediaMetadata = (file: File): Promise<VideoMetadata> => new Promise((resolve) => {
    const kind = kindOf(file);
    if (kind !== "image" && kind !== "video") return resolve({});
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    const finish = (metadata: VideoMetadata) => { cleanup(); resolve(metadata); };
    if (kind === "video") {
        const video = document.createElement("video");
        video.onloadedmetadata = () => finish({ width: video.videoWidth, height: video.videoHeight, durationSeconds: Number.isFinite(video.duration) ? Math.round(video.duration) : undefined });
        video.onerror = () => finish({});
        video.src = url;
        return;
    }
    const image = new Image();
    image.onload = () => finish({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => finish({});
    image.src = url;
});
export default function CreatePostComposer({ profile, organizations }: Props) {
    const router = useRouter(), input = useRef<HTMLInputElement>(null), textarea = useRef<HTMLTextAreaElement>(null), mentionPicker = useRef<HTMLDivElement>(null), [body, setBody] = useState(""), [cursor, setCursor] = useState(0), [mentionClosed, setMentionClosed] = useState(false), [visibility, setVisibility] = useState("public"), [author, setAuthor] = useState("personal"), [files, setFiles] = useState<File[]>([]), [error, setError] = useState(""), [state, setState] = useState<"idle" | "uploading" | "publishing" | "posted">("idle");
    const busy = state !== "idle";
    const selectedKind = files[0] ? kindOf(files[0]) : null;
    const activeMention = useMemo(() => findActiveMention(body, cursor), [body, cursor]);
    const updateCursor = () => {
        const nextCursor = textarea.current?.selectionStart ?? cursor;
        if (nextCursor !== cursor)
            setMentionClosed(false);
        setCursor(nextCursor);
    };
    const selectMention = (username: string) => {
        const replacement = replaceActiveMention(body, cursor, username);
        setBody(replacement.text);
        setCursor(replacement.cursor);
        setMentionClosed(true);
        requestAnimationFrame(() => {
            textarea.current?.focus();
            textarea.current?.setSelectionRange(replacement.cursor, replacement.cursor);
        });
    };
    const onMentionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!activeMention || mentionClosed || !["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
        e.preventDefault();
        mentionPicker.current?.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, bubbles: true, cancelable: true }));
    };
    const choose = (kind: MediaKind) => { if (busy)
        return; input.current?.setAttribute("accept", allow[kind].join(",")); input.current?.setAttribute("data-kind", kind); input.current?.click(); };
    const onFiles = (e: ChangeEvent<HTMLInputElement>) => { const next = Array.from(e.target.files || []), wanted = e.target.dataset.kind as MediaKind; if (!next.length)
        return; setError(""); if (next.some(f => kindOf(f) !== wanted || !allow[wanted].includes(f.type) || f.size > limits[wanted])) {
        setError(`Choose supported ${wanted} files within the size limit.`);
        return;
    } if (files.length && selectedKind !== wanted) {
        setError("Use up to five images, or one video, or one PDF in a post.");
        return;
    } const combined = [...files, ...next]; if ((wanted !== "image" && combined.length > 1) || combined.length > 5) {
        setError(wanted === "image" ? "You can attach up to five images." : "Only one video or PDF can be attached.");
        return;
    } setFiles(combined); e.target.value = ""; };
    const remove = (i: number) => setFiles(x => x.filter((_, n) => n !== i));
    const submit = async () => { if (busy)
        return; setError(""); if (!body.trim() && !files.length) {
        setError("Add text or an attachment before posting.");
        return;
    } try {
        setState(files.length ? "uploading" : "publishing");
        const created = await fetch("/api/social/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, visibility, organizationId: author === "personal" ? undefined : author, draft: files.length > 0 }) });
        const c = await created.json();
        if (!created.ok)
            throw Error(c.error || "Could not create post.");
        const postId = c.post.id as string;
        for (const file of files) {
            const init = await fetch(`/api/social/posts/${postId}/media/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }) });
            const i = await init.json();
            if (!init.ok)
                throw Error(i.error || "Could not prepare upload.");
            const upload = await createClient().storage.from("post-media").uploadToSignedUrl(i.path, i.token, file, { contentType: file.type });
            if (upload.error)
                throw Error("Upload failed. Your text is still saved in this draft.");
            const metadata = await readMediaMetadata(file);
            const finish = await fetch(`/api/social/posts/${postId}/media/finalize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: i.path, fileName: file.name, mimeType: file.type, fileSize: file.size, ...metadata }) });
            const f = await finish.json();
            if (!finish.ok)
                throw Error(f.error || "Could not attach uploaded media.");
        }
        if (files.length) {
            setState("publishing");
            const published = await fetch(`/api/social/posts/${postId}/publish`, { method: "POST" });
            const p = await published.json();
            if (!published.ok)
                throw Error(p.error || "Could not publish post.");
        }
        setState("posted");
        setTimeout(() => router.push("/home"), 700);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        setState("idle");
    } };
    return <section className="rounded-3xl border border-brand-borderLight bg-white p-4 shadow-elevated sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-caption font-bold tracking-[.15em] text-brand-coral">SOCIAL</p><h1 className="mt-1 text-h2 font-extrabold text-brand-midnight">Create Post</h1></div><button onClick={() => router.back()} className="rounded-full p-2 text-brand-slate hover:bg-brand-ivory" aria-label="Close"><X className="h-5 w-5"/></button></div><div className="mt-6 rounded-2xl bg-brand-ivory p-3"><label className="text-caption font-bold text-brand-slate">Post as</label><select value={author} onChange={e => setAuthor(e.target.value)} disabled={busy} className="mt-1 w-full bg-transparent text-body-sm font-bold text-brand-midnight outline-none"><option value="personal">{profile.name} · Personal profile</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name} · Organization</option>)}</select></div><textarea ref={textarea} value={body} onChange={e => { setBody(e.target.value.slice(0, 5000)); setCursor(e.target.selectionStart); setMentionClosed(false); }} onSelect={updateCursor} onClick={updateCursor} onKeyUp={updateCursor} onKeyDown={onMentionKeyDown} disabled={busy} rows={7} maxLength={5000} placeholder="Share something useful with your professional network..." className="mt-5 w-full resize-none rounded-2xl border border-brand-borderLight p-4 text-body-sm text-brand-midnight outline-none focus:border-brand-indigo disabled:bg-slate-50"/>{activeMention && !mentionClosed && <div ref={mentionPicker} className="relative z-10 mt-2"><MentionPicker query={activeMention.query} onSelect={selectMention} onClose={() => setMentionClosed(true)}/></div>}<div className="mt-1 text-right text-caption text-brand-slate">{body.length}/5000</div><input ref={input} type="file" className="hidden" onChange={onFiles}/>{files.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{files.map((f, i) => <div key={`${f.name}-${i}`} className="relative min-w-0 rounded-xl border border-brand-borderLight bg-brand-ivory p-3">{kindOf(f) === "image" ? <img src={URL.createObjectURL(f)} alt="Selected preview" className="h-28 w-full rounded-lg object-cover"/> : <div className="flex h-28 items-center justify-center rounded-lg bg-white"><FileText className="h-8 w-8 text-brand-indigo"/></div>}<p className="mt-2 truncate text-caption font-bold text-brand-midnight">{f.name}</p><p className="text-caption text-brand-slate">{size(f.size)}</p><button disabled={busy} onClick={() => remove(i)} className="absolute right-2 top-2 rounded-full bg-white p-1 text-brand-coral shadow"><X className="h-4 w-4"/></button></div>)}</div>}<div className="mt-5 flex flex-wrap gap-2 border-y border-brand-borderLight py-3"><button disabled={busy || !!selectedKind && selectedKind !== "image"} onClick={() => choose("image")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><ImagePlus className="h-4 w-4"/>Photo</button><button disabled={busy || !!selectedKind && selectedKind !== "video"} onClick={() => choose("video")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><Video className="h-4 w-4"/>Video</button><button disabled={busy || !!selectedKind && selectedKind !== "document"} onClick={() => choose("document")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm font-bold text-brand-indigo hover:bg-brand-indigo/5 disabled:opacity-40"><FileText className="h-4 w-4"/>Document</button></div>{selectedKind && <p className="mt-2 text-caption text-brand-slate">{selectedKind === "image" ? "Up to five images, 10 MB each." : selectedKind === "video" ? "One video, up to 100 MB." : "One PDF, up to 20 MB."}</p>}<div className="mt-5"><p className="text-caption font-bold text-brand-slate">Who can see this?</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="rounded-xl border border-brand-borderLight p-3 text-body-sm"><input type="radio" value="public" checked={visibility === "public"} onChange={e => setVisibility(e.target.value)} className="mr-2"/>Public<p className="ml-5 mt-1 text-caption text-brand-slate">Anyone on GigWay can see this.</p></label><label className="rounded-xl border border-brand-borderLight p-3 text-body-sm"><input type="radio" value="followers" checked={visibility === "followers"} onChange={e => setVisibility(e.target.value)} className="mr-2"/>Followers<p className="ml-5 mt-1 text-caption text-brand-slate">Only people who follow you can see this.</p></label></div></div>{error && <p className="mt-4 rounded-xl bg-brand-coral/10 p-3 text-body-sm text-brand-coral">{error}</p>}{state === "posted" && <p className="mt-4 rounded-xl bg-brand-success/10 p-3 text-body-sm text-brand-success">Posted successfully.</p>}<button onClick={submit} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white hover:bg-brand-indigoDark disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin"/>}{state === "uploading" ? "Uploading..." : state === "publishing" ? "Publishing..." : state === "posted" ? "Posted" : "Post"}</button></section>;
}
