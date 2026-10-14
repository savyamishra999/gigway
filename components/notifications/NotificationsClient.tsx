"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bell, MessageCircle, UserRoundPlus } from "lucide-react"
import { boundedFetch } from "@/lib/async"
import { safeReturnTo } from "@/lib/auth/return-to"
import { refreshActivity, useActivity } from "./ActivityProvider"
type Notice = { id: string; title?: string; message?: string; body?: string; type: string; link?: string; is_read: boolean; created_at: string }
export default function NotificationsClient() {
  const [items, setItems] = useState<Notice[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("")
  const [cursor, setCursor] = useState<string | null>(null), [unreadOnly, setUnreadOnly] = useState(false), [busy, setBusy] = useState(false)
  const activity = useActivity(), inFlight = useRef(false), mounted = useRef(true), request = useRef<AbortController | null>(null)
  const load = async (older?: string) => {
    if (inFlight.current || document.visibilityState !== "visible") return
    inFlight.current = true
    const controller = new AbortController(); request.current = controller
    try {
      const response = await boundedFetch(`/api/notifications${older ? `?cursor=${encodeURIComponent(older)}` : ""}`, { signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || "Notifications unavailable.")
      if (!mounted.current) return
      setItems(current => older ? [...new Map([...current, ...data.notifications].map(n => [n.id, n])).values()] : data.notifications)
      setCursor(data.nextCursor); setError("")
    } catch { if (mounted.current && !controller.signal.aborted) setError("Notifications could not be loaded. Please retry.") }
    finally { inFlight.current = false; if (mounted.current) setLoading(false) }
  }
  useEffect(() => {
    mounted.current = true; const start = setTimeout(() => void load(), 0)
    return () => { mounted.current = false; clearTimeout(start); request.current?.abort() }
  }, [])
  useEffect(() => {
    const start = setTimeout(() => { if (activity) void load() }, 0)
    return () => clearTimeout(start)
  }, [activity])
  const mark = async (id?: string) => {
    if (busy) return
    setBusy(true); setError("")
    try {
      const response = await boundedFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) })
      if (!response.ok) throw Error()
      setItems(current => current.map(n => !id || n.id === id ? { ...n, is_read: true } : n)); refreshActivity()
    } catch { setError("Read status was not saved. Please try again.") }
    finally { setBusy(false) }
  }
  const visible = items.filter(n => !unreadOnly || !n.is_read)
  return <main className="mx-auto max-w-2xl px-4 py-7 text-brand-midnight">
    <header className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-brand-indigo">Your professional network</p><h1 className="mt-2 text-3xl font-extrabold">Notifications</h1><p className="mt-2 text-sm text-brand-slate">Real requests, replies and updates from your activity.</p></header>
    {!!activity?.messages && <section className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4"><h2 className="flex items-center gap-2 font-bold"><MessageCircle className="h-5 w-5"/>{activity.messages} unread {activity.messages === 1 ? "message" : "messages"}</h2><p className="mt-1 text-sm text-brand-slate">Continue a conversation with a professional.</p><div className="mt-3 flex flex-wrap gap-3">{[...new Map(activity.recentMessages.map(m => [m.sender_id, m])).values()].map(m => <Link key={m.sender_id} href={`/messages/${m.sender_id}`} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand-indigo">Reply to {m.sender_name || "professional"}</Link>)}<Link href="/messages" className="px-2 py-3 text-sm font-bold text-brand-indigo">All messages</Link></div></section>}
    <div className="mb-4 flex flex-wrap gap-2"><button aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)} className={`rounded-xl border px-4 py-2 font-semibold ${!unreadOnly ? "border-brand-indigo bg-brand-indigo text-white" : "bg-white"}`}>All</button><button aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)} className={`rounded-xl border px-4 py-2 font-semibold ${unreadOnly ? "border-brand-indigo bg-brand-indigo text-white" : "bg-white"}`}>Unread</button><button disabled={busy || !items.some(n => !n.is_read)} onClick={() => void mark()} className="ml-auto rounded-xl px-3 py-2 text-sm font-bold text-brand-indigo disabled:opacity-50">{busy ? "Saving…" : "Mark all read"}</button></div>
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={() => void load()} className="underline">Refresh</button></p>}
    {loading ? <p role="status">Loading notifications…</p> : !visible.length && !error ? <section className="rounded-2xl border bg-white p-8 text-center"><Bell className="mx-auto h-8 w-8 text-brand-indigo"/><h2 className="mt-3 font-bold">{unreadOnly ? "No unread updates in this page." : "Your connections start here."}</h2><p className="mt-2 text-sm text-brand-slate">Connection requests and updates will appear here as they happen.</p><Link href="/network" className="mt-4 inline-block rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">Meet professionals</Link></section> : <div className="space-y-3">{visible.map(n => {
      const href = n.type === "connection_request" ? "/network?tab=connections" : safeReturnTo(n.link, ""), Icon = n.type.startsWith("connection_") ? UserRoundPlus : Bell
      return <article key={n.id} className={`rounded-2xl border p-4 ${n.is_read ? "border-brand-borderLight bg-white" : "border-indigo-200 bg-indigo-50"}`}><div className="flex gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-brand-indigo"/><div className="min-w-0 flex-1"><h2 className="break-words font-bold">{n.title || n.message || "Account update"}</h2>{n.body && <p className="mt-1 break-words text-sm text-brand-slate">{n.body}</p>}<time dateTime={n.created_at} className="mt-2 block text-xs text-brand-slate">{new Date(n.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time><div className="mt-3 flex flex-wrap gap-4">{href && <Link href={href} className="py-2 text-sm font-bold text-brand-indigo">{n.type === "connection_request" ? "Review request" : n.type === "connection_accepted" && href.startsWith("/messages/") ? "Say hello" : "View update"}</Link>}{!n.is_read && <button disabled={busy} onClick={() => void mark(n.id)} className="py-2 text-sm font-semibold text-brand-slate">Mark read</button>}</div></div>{!n.is_read && <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-indigo"/>}</div></article>
    })}</div>}
    {cursor && <button onClick={() => void load(cursor)} className="mt-4 w-full rounded-xl border bg-white p-3 font-bold text-brand-indigo">Load older updates</button>}
  </main>
}
