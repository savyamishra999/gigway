"use client";
import Link from "next/link";
import PostText from "@/components/social/PostText";
import { classifyVideoPresentation } from "@/lib/social/video";
import { useEffect, useState } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Copy,
  Flag,
  Heart,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Package,
  Plus,
  Repeat2,
  Send,
  Users,
} from "lucide-react";
type Item = {
  id: string;
  title?: string;
  name?: string;
  href: string;
  subtitle?: string;
  cta?: string;
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
    width?: number | null;
    height?: number | null;
    durationSeconds?: number | null;
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
  mentions: string[];
  replyPreview?: { id: string; body: string; createdAt: string; author: { id: string; name: string; username?: string | null; avatar?: string | null; verified?: boolean } | null }[];
};
export type FeedItem =
  | Post
  | {
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
    }
  | MarketplaceShare;
export type MarketplaceShare = { type: "marketplace_share"; sharedAt: string; shareId: string; verb: "reposted" | "shared"; actor: { id: string; name: string; href: string; avatar?: string | null; type: "profile" | "organization" }; object: { type: "job" | "project" | "service"; title: string; href: string; subtitle: string; image?: string | null; cta: string; tags?: string[]; rating?: number | null } };
type Props = {
  jobs: Item[];
  projects: Item[];
  services?: Item[];
  people: Item[];
  organizations: Item[];
  jobRailTitle?: string;
  projectRailTitle?: string;
  serviceRailTitle?: string;
};
const PROFESSIONAL_TOOLS: Item[] = [
  {
    id: "resume-intelligence",
    title: "Resume Intelligence",
    subtitle: "Understand your resume's strengths, weaknesses, and opportunities.",
    href: "/tools/resume-analyzer",
    cta: "Open tool",
  },
  {
    id: "profile-intelligence",
    title: "Profile Intelligence",
    subtitle: "See how strong your professional identity is and what to improve next.",
    href: "/tools/profile-intelligence",
    cta: "Open tool",
  },
];
function Rail({
  title,
  items,
  href,
  cta,
}: {
  title: string;
  items: Item[];
  href: string;
  cta: string;
}) {
  if (!items.length) return null;
  return (
    <section className="my-7 min-w-0 max-w-full">
      <div className="mb-3 flex justify-between">
        <h2 className="font-extrabold text-brand-midnight">{title}</h2>
        <Link href={href} className="text-caption font-bold text-brand-indigo">
          View all
        </Link>
      </div>
      <div className="flex w-full max-w-full snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((x) => (
          <Link
            key={x.id}
            href={x.href}
            className="w-[78%] shrink-0 snap-start rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-indigo/35 hover:shadow-elevated sm:w-60"
          >
            <div className="flex min-w-0 items-start gap-3">
              {x.image ? (
                <img src={x.image} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-indigo/10 text-lg font-extrabold text-brand-indigo">{(x.title || x.name || "G")[0]}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-midnight">{x.title || x.name}</p>
                <p className="mt-1 line-clamp-2 text-caption leading-5 text-brand-slate">{x.subtitle}</p>
              </div>
            </div>
            <p className="mt-4 text-caption font-bold text-brand-indigo">{x.cta || cta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function PostCard({
  post,
  onRefresh = () => {},
}: {
  post: Post;
  onRefresh?: () => void;
}) {
  const [menu, setMenu] = useState(false),
    [editing, setEditing] = useState(false),
    [text, setText] = useState(post.body || ""),
    [visibility, setVisibility] = useState(post.visibility),
    [comment, setComment] = useState(""),
    [commenting, setCommenting] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(post.isSavedByMe),
    [saving, setSaving] = useState(false),
    [reposted, setReposted] = useState(post.isRepostedByMe),
    [count, setCount] = useState(post.repostCount),
    [notice, setNotice] = useState("");
  useEffect(() => setSaved(post.isSavedByMe), [post.isSavedByMe]);
  const api = async (url: string, method = "POST", body?: unknown) => {
    const r = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || "Action failed.");
    return d;
  };
  const action = async (kind: "like" | "save") => {
    const isSave = kind === "save";
    const previous = saved;
    if (isSave) setSaving(true);
    try {
      const result = await api(
        `/api/social/posts/${post.id}/${kind}`,
        (isSave ? saved : post.isLikedByMe)
          ? "DELETE"
          : "POST",
      );
      if (isSave) setSaved(result.saved === true);
      onRefresh();
    } catch {
      if (isSave) {
        setSaved(previous);
        setNotice("Could not update saved post");
      }
    } finally {
      if (isSave) setSaving(false);
    }
  };
  const repost = async () => {
    if (!post.canRepost) return;
    const before = reposted;
    setReposted(!before);
    setCount((x) => Math.max(0, x + (before ? -1 : 1)));
    try {
      await api(
        `/api/social/posts/${post.id}/repost`,
        before ? "DELETE" : "POST",
      );
      onRefresh();
    } catch {
      setReposted(before);
      setCount((x) => Math.max(0, x + (before ? 1 : -1)));
      setNotice("Could not update repost");
    }
  };
  const follow = async () => {
    if (!post.author) return;
    try {
      await api(
        `/api/social/follow/${post.author.type === "organization" ? "organization" : "profile"}/${post.author.id}`,
        post.isFollowing ? "DELETE" : "POST",
      );
      onRefresh();
    } catch {}
  };
  const copy = async () => {
    const url = `${location.origin}/social/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied");
      setTimeout(() => setNotice(""), 1800);
    } catch {}
    setMenu(false);
  };
  const share = async () => {
    const url = `${location.origin}/social/posts/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GigWay post", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice("Link copied");
      setTimeout(() => setNotice(""), 1800);
    } catch {}
  };
  const report = async () => {
    const reason = window.prompt(
      "Report reason: spam, harassment, misinformation, scam, inappropriate, or other",
    );
    if (!reason) return;
    try {
      await api("/api/social/report", "POST", { postId: post.id, reason });
      setMenu(false);
    } catch {}
  };
  const saveEdit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await api(`/api/social/posts/${post.id}`, "PATCH", {
        body: text,
        visibility,
      });
      setEditing(false);
      onRefresh();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm("Delete this post?")) return;
    setBusy(true);
    try {
      await api(`/api/social/posts/${post.id}`, "DELETE");
      onRefresh();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  const addComment = async () => {
    if (!comment.trim() || busy) return;
    setBusy(true);
    try {
      await api(`/api/social/posts/${post.id}/comments`, "POST", {
        body: comment,
      });
      setComment("");
      setCommenting(false);
      onRefresh();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  const authorHref = post.author?.username ? `/u/${post.author.username}` : null;
  const preview = post.replyPreview || [];
  return (
    <article className="relative min-w-0 max-w-full rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft">
      <div className="flex gap-3">
        {authorHref ? (
          <Link href={authorHref} aria-label={`View ${post.author?.name || "author"} profile`} className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-brand-indigo/10 font-bold text-brand-indigo ${post.author?.type === "organization" ? "rounded-xl" : "rounded-full"}`}>
            {post.author?.avatar ? <img src={post.author.avatar} alt="" className="h-full w-full object-cover" /> : post.author?.name?.[0] || "G"}
          </Link>
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-brand-indigo/10 font-bold text-brand-indigo ${post.author?.type === "organization" ? "rounded-xl" : "rounded-full"}`}>
            {post.author?.avatar ? <img src={post.author.avatar} alt="" className="h-full w-full object-cover" /> : post.author?.name?.[0] || "G"}
          </div>
        )}
        <div className="relative min-w-0 flex-1">
          {authorHref ? <Link href={authorHref} className="block truncate font-bold text-brand-midnight hover:text-brand-indigo">{post.author?.name || "GigWay member"}</Link> : <p className="truncate font-bold text-brand-midnight">{post.author?.name || "GigWay member"}</p>}
          <p className="truncate text-caption text-brand-slate">
            {post.author?.username ? `@${post.author.username} · ` : ""}
            {post.author?.tagline || "GigWay professional"} ·{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
          {authorHref && <Link href={authorHref} aria-label={`View @${post.author?.username} profile`} className="absolute inset-x-0 bottom-0 h-5" />}
        </div>
        {post.canManageVisibility && (
          <span className="text-caption text-brand-slate">
            {post.visibility === "followers" ? "Followers" : "Public"}
          </span>
        )}
        <div className="relative">
          <button
            onClick={() => setMenu((x) => !x)}
            className="rounded-lg p-1.5 text-brand-slate hover:bg-brand-ivory"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-brand-borderLight bg-white p-1 shadow-elevated">
              {post.canEdit && (
                <>
                  <button
                    onClick={() => {
                      setEditing(true);
                      setMenu(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory"
                  >
                    Edit Post
                  </button>
                  {post.canManageVisibility && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenu(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory"
                    >
                      Change Visibility
                    </button>
                  )}
                </>
              )}
              <button
                onClick={copy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm hover:bg-brand-ivory"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              {post.canDelete ? (
                <button
                  disabled={busy}
                  onClick={remove}
                  className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-brand-coral hover:bg-brand-coral/5"
                >
                  Delete Post
                </button>
              ) : post.canReport ? (
                <button
                  onClick={report}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm text-brand-coral hover:bg-brand-coral/5"
                >
                  <Flag className="h-4 w-4" />
                  Report Post
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {editing ? (
        <div className="pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 5000))}
            className="w-full rounded-xl border border-brand-borderLight p-3 text-body-sm outline-none focus:border-brand-indigo"
            rows={4}
          />
          {post.canManageVisibility && (
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="mt-2 rounded-lg border border-brand-borderLight p-2 text-caption"
            >
              <option value="public">Public</option>
              <option value="followers">Followers</option>
            </select>
          )}
          <div className="mt-2 flex gap-2">
            <button
              disabled={busy}
              onClick={saveEdit}
              className="rounded-lg bg-brand-indigo px-3 py-2 text-caption font-bold text-white"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-caption font-bold text-brand-slate"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.body && <PostText body={post.body} mentions={post.mentions} />}
          {post.media.map((m) =>
            m.type === "image" ? (
              <img
                key={m.id}
                src={m.url}
                alt={m.fileName}
                className="mt-4 max-h-[460px] w-full max-w-full rounded-xl object-cover"
              />
            ) : m.type === "video" ? (
              <div
                key={m.id}
                className={
                  classifyVideoPresentation(m) === "SHORT_VERTICAL"
                    ? "mx-auto mt-4 w-full max-w-[18rem] overflow-hidden rounded-xl bg-black"
                    : "mt-4 w-full max-w-full overflow-hidden rounded-xl bg-black"
                }
              >
                <video
                  controls
                  preload="metadata"
                  src={m.url}
                  className={
                    classifyVideoPresentation(m) === "SHORT_VERTICAL"
                      ? "block aspect-[9/16] w-full max-h-[70vh] object-contain"
                      : "block h-auto w-full max-w-full object-contain"
                  }
                />
              </div>
            ) : (
              <a
                key={m.id}
                href={m.url}
                className="mt-4 flex max-w-full rounded-xl bg-brand-ivory p-3 text-body-sm font-bold text-brand-indigo"
              >
                {m.fileName}
              </a>
            ),
          )}
        </>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-borderLight pt-3 text-caption font-bold text-brand-slate">
        <Link href={`/social/posts/${post.id}`} className="flex items-center gap-1 hover:text-brand-indigo">
          <MessageSquare className="h-4 w-4" />
          {post.commentCount ? `${post.commentCount} ${post.commentCount === 1 ? "Comment" : "Comments"}` : "Comment / Reply"}
        </Link>
        <button
          onClick={repost}
          disabled={!post.canRepost}
          className={`flex items-center gap-1 disabled:opacity-40 ${reposted ? "text-brand-indigo" : ""}`}
        >
          <Repeat2 className="h-4 w-4" />
          {reposted ? "Undo Repost" : "Repost"} {count}
        </button>
        <button
          onClick={() => action("like")}
          className={post.isLikedByMe ? "text-brand-coral" : ""}
        >
          <Heart className="inline h-4 w-4" /> {post.likeCount}
        </button>
        <button onClick={share} className="flex items-center gap-1">
          <Send className="h-4 w-4" />
          Share
        </button>
        <button
          onClick={() => action("save")}
          disabled={saving}
          className={`ml-auto disabled:opacity-60 ${saved ? "text-brand-indigo" : ""}`}
          aria-label={saved ? "Unsave post" : "Save post"}
          aria-pressed={saved}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      {post.canFollow && (
        <button
          onClick={follow}
          className="mt-3 text-caption font-bold text-brand-indigo"
        >
          {post.isFollowing ? "Following" : "Follow"}
          {post.author?.type === "organization" ? " Organization" : ""}
        </button>
      )}
      {false && (
        <div className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            placeholder="Write a comment…"
            className="min-w-0 flex-1 rounded-xl border border-brand-borderLight px-3 py-2 text-body-sm outline-none focus:border-brand-indigo"
          />
          <button
            disabled={busy}
            onClick={addComment}
            className="rounded-xl bg-brand-indigo px-3 text-caption font-bold text-white"
          >
            Post
          </button>
        </div>
      )}
      {false && preview.length > 0 && (
        <section className="mt-4 border-t border-brand-borderLight pt-3" aria-label="Reply preview">
          <div className="space-y-3">
            {preview.map((reply) => {
              const href = reply.author?.username ? `/u/${reply.author.username}` : null;
              return <div key={reply.id} className="flex min-w-0 gap-2.5 text-body-sm">
                {href ? <Link href={href} className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-brand-indigo/10" aria-label={`View ${reply.author?.name || "member"} profile`}>{reply.author?.avatar ? <img src={reply.author.avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] font-bold text-brand-indigo">{reply.author?.name?.[0] || "G"}</span>}</Link> : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-indigo/10 text-[10px] font-bold text-brand-indigo">{reply.author?.name?.[0] || "G"}</span>}
                <div className="min-w-0"><p className="truncate text-caption"><span className="font-bold text-brand-midnight">{reply.author?.name || "GigWay member"}</span>{reply.author?.username && <span className="ml-1 text-brand-indigo">@{reply.author.username}</span>}<span className="ml-1 text-brand-slate">· {new Date(reply.createdAt).toLocaleDateString()}</span></p><p className="line-clamp-2 whitespace-pre-wrap break-words leading-5 text-brand-slate">{reply.body}</p></div>
              </div>;
            })}
          </div>
          <Link href={`/social/posts/${post.id}`} className="mt-3 inline-block text-caption font-bold text-brand-indigo">View all {post.commentCount} {post.commentCount === 1 ? "reply" : "replies"}</Link>
        </section>
      )}
      {notice && (
        <p className="mt-2 text-caption text-brand-indigo">{notice}</p>
      )}
    </article>
  );
}
export default function SocialHomeFeed({
  jobs,
  projects,
  services = [],
  people,
  organizations,
  jobRailTitle = "Jobs",
  projectRailTitle = "Projects",
  serviceRailTitle = "Popular Services",
}: Props) {
  const [feed, setFeed] = useState<"discover" | "following">("discover"),
    [serviceItems, setServiceItems] = useState<Item[]>(services),
    [posts, setPosts] = useState<FeedItem[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [cursor, setCursor] = useState<string | null>(null);
  const load = async (reset = false) => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(
          `/api/social/posts?feed=${feed}${!reset && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        ),
        d: unknown = await r.json().catch(() => null);
      if (
        !r.ok ||
        !d ||
        typeof d !== "object" ||
        !Array.isArray((d as { items?: unknown }).items) ||
        !("nextCursor" in d)
      )
        throw Error("Could not load the feed.");
      const page = d as { items: FeedItem[]; nextCursor: string | null };
      setPosts((x) => (reset ? page.items : [...x, ...page.items]));
      setCursor(typeof page.nextCursor === "string" ? page.nextCursor : null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setCursor(null);
    load(true);
  }, [feed]);
  useEffect(() => {
    if (services.length) { setServiceItems(services); return; }
    fetch("/api/gigs?limit=6").then((r) => r.ok ? r.json() : null).then((data) => {
      if (!Array.isArray(data?.gigs)) return;
      setServiceItems(data.gigs.slice(0, 6).map((gig: any) => ({ id: gig.id, title: gig.title, href: `/gigs/${gig.id}`, image: gig.image_url, subtitle: [gig.price ? `From ₹${gig.price}` : null, gig.category].filter(Boolean).join(" · ") })));
    }).catch(() => {});
  }, [services]);
  // Keep discovery useful even when the social feed is short: each populated
  // rail is inserted after a post when possible, then any remainder is
  // appended below the available posts.
  const rails = [
    jobs.length ? <Rail key="j" title={jobRailTitle} href="/jobs" items={jobs} cta="View job" /> : null,
    projects.length ? <Rail
      key="p"
      title={projectRailTitle}
      href="/projects"
      items={projects}
      cta="View project"
    /> : null,
    serviceItems.length ? <Rail key="s" title={serviceRailTitle} href="/gigs" items={serviceItems} cta="View service" /> : null,
    people.length ? <Rail
      key="u"
      title="Professionals to Follow"
      href="/explore?tab=people"
      items={people}
      cta="View profile"
    /> : null,
    organizations.length ? <Rail
      key="o"
      title="Companies & Organizations to Follow"
      href="/explore?tab=organizations"
      items={organizations}
      cta="View entity"
    /> : null,
    <Rail
      key="t"
      title="Professional Tools"
      href="/ai-tools"
      items={PROFESSIONAL_TOOLS}
      cta="Open tool"
    />,
  ].filter(Boolean);
  const discoveryRails = rails.filter((rail) => rail !== null);
  const insertedRailCount = posts.length < 3 ? 0 : Math.floor((posts.length - 3) / 4) + 1;
  return (
    <section className="mt-8 w-full min-w-0 max-w-3xl">
      <Link
        href="/social/create"
        className="flex w-full min-w-0 justify-between rounded-2xl border border-brand-indigo/20 bg-white p-4 shadow-soft"
      >
        <span className="min-w-0 text-body-sm text-brand-slate">
          Share something with your professional network...
        </span>
        <Plus className="text-brand-coral" />
      </Link>
      <div className="mt-5 flex rounded-xl bg-white p-1">
        <button
          onClick={() => setFeed("discover")}
          className={`flex-1 rounded-lg py-2 font-bold ${feed === "discover" ? "bg-brand-indigo text-white" : "text-brand-slate"}`}
        >
          For You
        </button>
        <button
          onClick={() => setFeed("following")}
          className={`flex-1 rounded-lg py-2 font-bold ${feed === "following" ? "bg-brand-indigo text-white" : "text-brand-slate"}`}
        >
          Following
        </button>
      </div>
      <div className="mt-5">
        {posts.map((item, i) => {
          if ("type" in item && item.type === "marketplace_share") {
            const share = item as MarketplaceShare;
            return <div key={`marketplace-${share.shareId}`}><p className="mb-2 flex min-w-0 items-center gap-1.5 text-caption font-semibold text-brand-slate"><Repeat2 className="h-3.5 w-3.5"/><Link href={share.actor.href} className="truncate hover:text-brand-indigo">{share.actor.name}</Link><span>{share.verb} a {share.object.type === "service" ? "Service" : share.object.type[0].toUpperCase() + share.object.type.slice(1)}</span></p><Link href={share.object.href} className="block max-w-full rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft hover:border-brand-indigo/35"><div className="flex min-w-0 gap-3">{share.object.image ? <img src={share.object.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover"/> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-indigo/10 text-brand-indigo">{share.object.type === "job" ? <BriefcaseBusiness className="h-5 w-5"/> : share.object.type === "project" ? <Building2 className="h-5 w-5"/> : <Package className="h-5 w-5"/>}</span>}<div className="min-w-0"><p className="truncate font-bold text-brand-midnight">{share.object.title}</p><p className="mt-1 line-clamp-2 text-caption text-brand-slate">{share.object.subtitle}</p>{share.object.tags?.length ? <p className="mt-2 truncate text-caption text-brand-indigo">{share.object.tags.join(" · ")}</p> : null}</div></div><p className="mt-3 text-caption font-bold text-brand-indigo">{share.object.cta}</p></Link><div className="h-4"/></div>
          }
          const repost = ("type" in item ? item : null) as Extract<
              FeedItem,
              {
                type: "repost";
              }
            > | null,
            post = (repost ? repost.originalPost : item) as Post;
          return (
            <div
              key={
                repost
                  ? `repost-${repost.repostedAt}-${repost.repostActor.id}-${post.id}`
                  : post.id
              }
            >
              {repost && (
                <p className="mb-2 flex min-w-0 max-w-full items-center gap-1.5 text-caption font-semibold text-brand-slate">
                  <Repeat2 className="h-3.5 w-3.5" />
                  <Link
                    href={repost.repostActor.href}
                    className="truncate hover:text-brand-indigo"
                  >
                    {repost.repostActor.name}
                  </Link>{" "}
                  <span className="shrink-0">reposted</span>
                </p>
              )}
              <PostCard post={post} onRefresh={() => load(true)} />
              {feed === "discover" && i + 1 >= 3 && (i + 1 - 3) % 4 === 0
                ? discoveryRails[Math.floor((i - 2) / 4)]
                : null}
              <div className="h-4" />
            </div>
          );
        })}
        {loading && (
          <Loader2 className="mx-auto animate-spin text-brand-indigo" />
        )}
        {!loading && error && (
          <div className="rounded-xl border border-brand-coral/20 bg-white p-4 text-body-sm text-brand-slate">
            <p>Couldn&apos;t load posts.</p>
            <button
              onClick={() => load(true)}
              className="mt-3 rounded-lg bg-brand-indigo px-3 py-2 text-caption font-bold text-white"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-xl border border-brand-borderLight bg-white p-4 text-body-sm text-brand-slate">
            {feed === "following" ? (
              <>
                <p>Follow professionals and organizations to build your feed.</p>
                <Link href="/explore" className="mt-3 inline-block font-bold text-brand-indigo">
                  Explore professionals
                </Link>
              </>
            ) : (
              "No posts to show yet."
            )}
          </div>
        )}
        {feed === "discover" && discoveryRails.slice(insertedRailCount).map((rail, index) => (
          <div key={`remaining-rail-${index}`}>{rail}</div>
        ))}
        {!loading && !error && cursor && (
          <button
            onClick={() => load()}
            className="w-full rounded-xl bg-white py-3 text-brand-indigo"
          >
            Load more
          </button>
        )}
      </div>
    </section>
  );
}
