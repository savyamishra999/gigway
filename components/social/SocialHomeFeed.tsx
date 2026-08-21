"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, BriefcaseBusiness, Building2, Copy, Flag, Heart, Loader2, MessageSquare, MoreHorizontal, Package, Plus, Repeat2, Send, Users } from "lucide-react";
type Item = {
    id: string;
    title?: string;
    name?: string;
    href: string;
    subtitle?: string;
    image?: string | null;
};
export type Post = {
    id: string;
    body: string | null;
    postType: string;
    visibility: string;
    createdAt: string;
    editedAt: string | null;
    author: {
        type: string;
        id: string;
        name: string;
        username?: string | null;
        avatar?: string | null;
        tagline?: string | null;
        verified?: boolean;
    } | null;
    media: {
        id: string;
        type: string;
        url: string;
        fileName: string;
        mimeType?: string;
    }[];
    likeCount: number;
    commentCount: number;
    repostCount: number;
    isRepostedByMe: boolean;
    canRepost: boolean;
    isLikedByMe: boolean;
    isSavedByMe: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageVisibility: boolean;
    canFollow: boolean;
    isFollowing: boolean;
    canReport: boolean;
};
export type FeedItem = Post | {
    type: "repost";
    repostedAt: string;
    repostActor: {
        id: string;
        name: string;
        username?: string | null;
        avatar?: string | null;
        href: string;
    };
    originalPost: Post;
};
type Props = {
    jobs: Item[];
    projects: Item[];
    people: Item[];
    organizations: Item[];
};
function Rail({ title, items, href }: {
    title: string;
    items: Item[];
    href: string;
}) { if (!items.length)
    return null; return <section className="my-7"><div className="mb-3 flex justify-between"><h2 className="font-extrabold text-brand-midnight">{title}</h2><Link href={href} className="text-caption font-bold text-brand-indigo">View all</Link></div><div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map(x => <Link key={x.id} href={x.href} className="w-[78%] shrink-0 snap-start rounded-2xl border border-brand-borderLight bg-white p-4 sm:w-60"><p className="truncate font-bold text-brand-midnight">{x.title || x.name}</p><p className="mt-1 text-caption text-brand-slate">{x.subtitle}</p></Link>)}</div></section>; }
export function PostCard({ post, onRefresh = () => { } }: {
    post: Post;
    onRefresh?: () => void;
}) { const [menu, setMenu] = useState(false), [editing, setEditing] = useState(false), [text, setText] = useState(post.body || ""), [visibility, setVisibility] = useState(post.visibility), [comment, setComment] = useState(""), [commenting, setCommenting] = useState(false), [busy, setBusy] = useState(false), [reposted, setReposted] = useState(post.isRepostedByMe), [count, setCount] = useState(post.repostCount), [notice, setNotice] = useState(""); const api = async (url: string, method = "POST", body?: unknown) => { const r = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const d = await r.json().catch(() => ({})); if (!r.ok)
    throw Error(d.error || "Action failed."); return d; }; const action = async (kind: "like" | "save") => { try {
    await api(`/api/social/posts/${post.id}/${kind}`, post[kind === "like" ? "isLikedByMe" : "isSavedByMe"] ? "DELETE" : "POST");
    onRefresh();
}
catch { } }; const repost = async () => { if (!post.canRepost)
    return; const before = reposted; setReposted(!before); setCount(x => Math.max(0, x + (before ? -1 : 1))); try {
    await api(`/api/social/posts/${post.id}/repost`, before ? "DELETE" : "POST");
    onRefresh();
}
catch {
    setReposted(before);
    setCount(x => Math.max(0, x + (before ? 1 : -1)));
    setNotice("Could not update repost");
} }; const follow = async () => { if (!post.author)
    return; try {
    await api(`/api/social/follow/${post.author.type === "organization" ? "organization" : "profile"}/${post.author.id}`, post.isFollowing ? "DELETE" : "POST");
    onRefresh();
}
catch { } }; const copy = async () => { const url = `${location.origin}/social/posts/${post.id}`; try {
    await navigator.clipboard.writeText(url);
    setNotice("Link copied");
    setTimeout(() => setNotice(""), 1800);
}
catch { } setMenu(false); }; const share = async () => { const url = `${location.origin}/social/posts/${post.id}`; try {
    if (navigator.share) {
        await navigator.share({ title: "GigWay post", url });
        return;
    }
    await navigator.clipboard.writeText(url);
    setNotice("Link copied");
    setTimeout(() => setNotice(""), 1800);
}
catch { } }; const report = async () => { const reason = window.prompt("Report reason: spam, harassment, misinformation, scam, inappropriate, or other"); if (!reason)
    return; try {
    await api("/api/social/report", "POST", { postId: post.id, reason });
    setMenu(false);
}
catch { } }; const saveEdit = async () => { if (!text.trim() || busy)
    return; setBusy(true); try {
    await api(`/api/social/posts/${post.id}`, "PATCH", { body: text, visibility });
    setEditing(false);
    onRefresh();
}
catch { }
finally {
    setBusy(false);
} }; const remove = async () => { if (!window.confirm("Delete this post?"))
    return; setBusy(true); try {
    await api(`/api/social/posts/${post.id}`, "DELETE");
    onRefresh();
}
catch { }
finally {
    setBusy(false);
} }; const addComment = async () => { if (!comment.trim() || busy)
    return; setBusy(true); try {
    await api(`/api/social/posts/${post.id}/comments`, "POST", { body: comment });
    setComment("");
    setCommenting(false);
    onRefresh();
}
catch { }
finally {
    setBusy(false);
} }; return <article className="relative rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft"><div className="flex gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-brand-indigo/10 font-bold text-brand-indigo ${post.author?.type === "organization" ? "rounded-xl" : "rounded-full"}`}>{post.author?.avatar ? <img src={post.author.avatar} alt="" className="h-full w-full object-cover"/> : post.author?.name?.[0] || "G"}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-brand-midnight">{post.author?.name || "GigWay member"}</p><p className="truncate text-caption text-brand-slate">{post.author?.username ? `@${post.author.username} · ` : ""}{post.author?.tagline || "GigWay professional"} · {new Date(post.createdAt).toLocaleDateString()}</p></div>{post.canManageVisibility && <span className="text-caption text-brand-slate">{post.visibility === "followers" ? "Followers" : "Public"}</span>}<div className="relative"><button onClick={() => setMenu(x => !x)} className="rounded-lg p-1.5 text-brand-slate hover:bg-brand-ivory" aria-label="Post options"><MoreHorizontal className="h-5 w-5"/></button>{menu && <div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-brand-borderLight bg-white p-1 shadow-elevated">{post.canEdit && <><button onClick={() => { setEditing(true); setMenu(false); }} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory">Edit Post</button>{post.canManageVisibility && <button onClick={() => { setEditing(true); setMenu(false); }} className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory">Change Visibility</button>}</>}<button onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory"><Copy className="h-4 w-4"/>Copy Link</button>{post.canDelete ? <button disabled={busy} onClick={remove} className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-brand-coral hover:bg-brand-coral/5">Delete Post</button> : post.canReport ? <button onClick={report} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm text-brand-coral hover:bg-brand-coral/5"><Flag className="h-4 w-4"/>Report Post</button> : null}</div>}</div></div>{editing ? <div className="pt-4"><textarea value={text} onChange={e => setText(e.target.value.slice(0, 5000))} className="w-full rounded-xl border border-brand-borderLight p-3 text-body-sm outline-none focus:border-brand-indigo" rows={4}/>{post.canManageVisibility && <select value={visibility} onChange={e => setVisibility(e.target.value)} className="mt-2 rounded-lg border border-brand-borderLight p-2 text-caption"><option value="public">Public</option><option value="followers">Followers</option></select>}<div className="mt-2 flex gap-2"><button disabled={busy} onClick={saveEdit} className="rounded-lg bg-brand-indigo px-3 py-2 text-caption font-bold text-white">Save</button><button onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-caption font-bold text-brand-slate">Cancel</button></div></div> : <>{post.body && <p className="whitespace-pre-wrap break-words pt-4 text-body-sm leading-6 text-brand-midnight">{post.body}</p>}{post.media.map(m => m.type === "image" ? <img key={m.id} src={m.url} alt={m.fileName} className="mt-4 max-h-[460px] w-full rounded-xl object-cover"/> : m.type === "video" ? <video key={m.id} controls src={m.url} className="mt-4 w-full rounded-xl"/> : <a key={m.id} href={m.url} className="mt-4 flex rounded-xl bg-brand-ivory p-3 text-body-sm font-bold text-brand-indigo">{m.fileName}</a>)}</>}<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-borderLight pt-3 text-caption font-bold text-brand-slate"><button onClick={() => setCommenting(x => !x)} className="flex items-center gap-1"><MessageSquare className="h-4 w-4"/>Reply {post.commentCount}</button><button onClick={repost} disabled={!post.canRepost} className={`flex items-center gap-1 disabled:opacity-40 ${reposted ? "text-brand-indigo" : ""}`}><Repeat2 className="h-4 w-4"/>{reposted ? "Undo Repost" : "Repost"} {count}</button><button onClick={() => action("like")} className={post.isLikedByMe ? "text-brand-coral" : ""}><Heart className="inline h-4 w-4"/> {post.likeCount}</button><button onClick={share} className="flex items-center gap-1"><Send className="h-4 w-4"/>Share</button><button onClick={() => action("save")} className={`ml-auto ${post.isSavedByMe ? "text-brand-indigo" : ""}`} aria-label="Save post"><Bookmark className="h-4 w-4"/></button></div>{post.canFollow && <button onClick={follow} className="mt-3 text-caption font-bold text-brand-indigo">{post.isFollowing ? "Following" : "Follow"}{post.author?.type === "organization" ? " Organization" : ""}</button>}{commenting && <div className="mt-3 flex gap-2"><input value={comment} onChange={e => setComment(e.target.value.slice(0, 2000))} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-xl border border-brand-borderLight px-3 py-2 text-body-sm outline-none focus:border-brand-indigo"/><button disabled={busy} onClick={addComment} className="rounded-xl bg-brand-indigo px-3 text-caption font-bold text-white">Post</button></div>}{notice && <p className="mt-2 text-caption text-brand-indigo">{notice}</p>}</article>; }
export default function SocialHomeFeed({ jobs, projects, people, organizations }: Props) { const [feed, setFeed] = useState<"discover" | "following">("discover"), [posts, setPosts] = useState<FeedItem[]>([]), [loading, setLoading] = useState(true), [cursor, setCursor] = useState<string | null>(null); const load = async (reset = false) => { setLoading(true); const r = await fetch(`/api/social/posts?feed=${feed}${!reset && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`), d = await r.json(); if (r.ok) {
    setPosts(x => reset ? d.items : [...x, ...d.items]);
    setCursor(d.nextCursor);
} setLoading(false); }; useEffect(() => { setCursor(null); load(true); }, [feed]); const rails = [<Rail key="j" title="Jobs for You" href="/jobs" items={jobs}/>, <Rail key="p" title="Projects You May Like" href="/projects" items={projects}/>, <Rail key="u" title="Professionals to Follow" href="/explore?tab=people" items={people}/>, <Rail key="o" title="Organizations to Follow" href="/explore?tab=organizations" items={organizations}/>]; return <section className="mt-8 max-w-3xl"><Link href="/social/create" className="flex justify-between rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft"><span className="text-body-sm text-brand-slate">Share something with your professional network...</span><Plus className="text-brand-coral"/></Link><div className="mt-5 flex rounded-xl bg-white p-1"><button onClick={() => setFeed("discover")} className={`flex-1 rounded-lg py-2 font-bold ${feed === "discover" ? "bg-brand-indigo text-white" : "text-brand-slate"}`}>Discover</button><button onClick={() => setFeed("following")} className={`flex-1 rounded-lg py-2 font-bold ${feed === "following" ? "bg-brand-indigo text-white" : "text-brand-slate"}`}>Following</button></div><div className="mt-5">{posts.map((item, i) => { const repost = ("type" in item ? item : null) as Extract<FeedItem, {
    type: "repost";
}> | null, post = (repost ? repost.originalPost : item) as Post; return <div key={repost ? `repost-${repost.repostedAt}-${repost.repostActor.id}-${post.id}` : post.id}>{repost && <p className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-brand-slate"><Repeat2 className="h-3.5 w-3.5"/><Link href={repost.repostActor.href} className="hover:text-brand-indigo">{repost.repostActor.name}</Link> reposted</p>}<PostCard post={post} onRefresh={() => load(true)}/>{feed === "discover" && (i + 1) >= 3 && (i + 1 - 3) % 4 === 0 ? rails[Math.floor((i - 2) / 4) % rails.length] : null}<div className="h-4"/></div>; })}{loading && <Loader2 className="mx-auto animate-spin text-brand-indigo"/>}{!loading && cursor && <button onClick={() => load()} className="w-full rounded-xl bg-white py-3 text-brand-indigo">Load more</button>}</div></section>; }
