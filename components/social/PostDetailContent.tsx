"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { PostCard, type Post } from "@/components/social/SocialHomeFeed";

type Comment = {
  id: string;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string | null;
  author: { id: string; name: string; username?: string | null; avatar?: string | null; verified?: boolean } | null;
};

function CommentComposer({ postId, parentCommentId, onDone, compact = false }: { postId: string; parentCommentId?: string; onDone: () => void; compact?: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, parentCommentId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Could not post reply.");
      setBody(""); onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post reply.");
    } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className={compact ? "mt-3" : "mt-4 border-t border-brand-borderLight pt-4"}>
    <textarea value={body} onChange={event => setBody(event.target.value.slice(0, 2000))} maxLength={2000} rows={compact ? 2 : 3} placeholder={parentCommentId ? "Write a reply…" : "Join the conversation…"} className="w-full resize-none rounded-xl border border-brand-borderLight bg-white p-3 text-body-sm text-brand-midnight outline-none focus:border-brand-indigo" />
    {error && <p className="mt-2 text-caption text-brand-coral">{error}</p>}
    <div className="mt-2 flex items-center justify-between gap-3"><span className="text-caption text-brand-slate">{body.length}/2000</span><button disabled={busy || !body.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-3 py-2 text-caption font-bold text-white disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}{parentCommentId ? "Reply" : "Post reply"}</button></div>
  </form>;
}

function CommentItem({ comment, postId, viewerId, children, onChanged }: { comment: Comment; postId: string; viewerId: string; children?: Comment[]; onChanged: () => void }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const own = comment.author?.id === viewerId;
  const save = async () => { if (!text.trim() || busy) return; setBusy(true); setError(""); try { const response = await fetch(`/api/social/comments/${comment.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: text }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw Error(data.error || "Could not update reply."); setEditing(false); onChanged(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update reply."); } finally { setBusy(false); } };
  const remove = async () => { if (busy) return; setBusy(true); setError(""); try { const response = await fetch(`/api/social/comments/${comment.id}`, { method: "DELETE" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw Error(data.error || "Could not delete reply."); onChanged(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete reply."); } finally { setBusy(false); } };
  return <div className="py-4 first:pt-0"><div className="flex gap-3"><ProfileAvatar src={comment.author?.avatar} name={comment.author?.name} className="h-9 w-9 text-xs"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><span className="font-bold text-brand-midnight">{comment.author?.name || "GigWay member"}</span>{comment.author?.verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-indigo" aria-label="Verified"/>}{comment.author?.username && <span className="text-caption text-brand-indigo">@{comment.author.username}</span>}<span className="text-caption text-brand-slate">· {new Date(comment.createdAt).toLocaleDateString()}</span></div>{editing ? <><textarea value={text} onChange={event => setText(event.target.value.slice(0, 2000))} rows={3} className="mt-2 w-full resize-none rounded-xl border border-brand-borderLight p-2 text-body-sm outline-none focus:border-brand-indigo"/><div className="mt-2 flex gap-2"><button disabled={busy} onClick={save} className="rounded-lg bg-brand-indigo px-3 py-1.5 text-caption font-bold text-white">Save</button><button onClick={() => { setText(comment.body); setEditing(false); }} className="px-2 text-caption font-bold text-brand-slate">Cancel</button></div></> : <p className="mt-1 whitespace-pre-wrap break-words text-body-sm leading-6 text-brand-midnight">{comment.body}</p>}{error && <p className="mt-2 text-caption text-brand-coral">{error}</p>}<div className="mt-2 flex flex-wrap gap-3 text-caption font-bold text-brand-slate">{!comment.parentCommentId && <button onClick={() => setReplying(value => !value)} className="inline-flex items-center gap-1 hover:text-brand-indigo"><MessageSquare className="h-3.5 w-3.5"/>Reply</button>}{own && !editing && <><button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 hover:text-brand-indigo"><Pencil className="h-3.5 w-3.5"/>Edit</button><button disabled={busy} onClick={remove} className="inline-flex items-center gap-1 text-brand-coral"><Trash2 className="h-3.5 w-3.5"/>Delete</button></>}</div>{replying && <CommentComposer postId={postId} parentCommentId={comment.id} compact onDone={() => { setReplying(false); onChanged(); }}/>}</div></div>{children?.length ? <div className="ml-6 mt-3 border-l border-brand-borderLight pl-3 sm:ml-10 sm:pl-4">{children.map(reply => <CommentItem key={reply.id} comment={reply} postId={postId} viewerId={viewerId} onChanged={onChanged}/>)}</div> : null}</div>;
}

export default function PostDetailContent({ post, viewerId }: { post: Post; viewerId: string }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const response = await fetch(`/api/social/posts/${post.id}/comments`); const data = await response.json().catch(() => ({})); if (!response.ok) throw Error(data.error || "Could not load replies."); setComments(data.items || []); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load replies."); } finally { setLoading(false); } }, [post.id]);
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); router.refresh(); };
  const topLevel = comments.filter(comment => !comment.parentCommentId);
  const replies = (id: string) => comments.filter(comment => comment.parentCommentId === id);
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-24"><div className="mx-auto max-w-2xl"><PostCard post={post} onRefresh={changed}/><section className="mt-5 rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft sm:p-5"><div className="flex items-center justify-between"><h1 className="text-h3 font-extrabold text-brand-midnight">Conversation</h1><span className="text-caption font-bold text-brand-slate">{comments.length} {comments.length === 1 ? "reply" : "replies"}</span></div><CommentComposer postId={post.id} onDone={changed}/><div className="mt-5 border-t border-brand-borderLight pt-4">{loading ? <Loader2 className="mx-auto animate-spin text-brand-indigo"/> : error ? <p className="text-body-sm text-brand-coral">{error}</p> : topLevel.length ? topLevel.map(comment => <CommentItem key={comment.id} comment={comment} postId={post.id} viewerId={viewerId} onChanged={changed} children={replies(comment.id)}/>) : <p className="py-3 text-body-sm text-brand-slate">No replies yet. Start the conversation.</p>}</div></section></div></main>;
}
