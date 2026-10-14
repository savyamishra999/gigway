"use client"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, MessageCircle, Send } from "lucide-react"
import { boundedFetch } from "@/lib/async"
import { MESSAGE_LIMIT, mergeMessages, type Message } from "@/lib/communication"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { refreshActivity } from "@/components/notifications/ActivityProvider"

type Person = { id: string; full_name: string | null; username: string | null; avatar_url: string | null; tagline?: string | null }
export default function MessagesClient({ viewerId, otherId }: { viewerId: string; otherId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]), [people, setPeople] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [cursor, setCursor] = useState<string | null>(null)
  const [text, setText] = useState(""), [search, setSearch] = useState(""), [sending, setSending] = useState(false), [sendError, setSendError] = useState("")
  const [uncertain, setUncertain] = useState(false)
  const pending = useRef<{ id: string; content: string } | null>(null), sendingRef = useRef(false)
  const active = useRef(true), reading = useRef(false), controller = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null), scroller = useRef<HTMLDivElement>(null), initial = useRef(true), newest = useRef<string | null>(null)
  const other = otherId ? people[otherId] : undefined
  const load = useCallback(async (older?: string, manual = false) => {
    if (reading.current || (!manual && document.visibilityState !== "visible")) return
    reading.current = true
    const abort = new AbortController(); controller.current = abort
    const nearBottom = !scroller.current || scroller.current.scrollHeight - scroller.current.scrollTop - scroller.current.clientHeight < 120
    try {
      const params = new URLSearchParams()
      if (otherId) params.set("with", otherId)
      if (older) params.set("cursor", older)
      const response = await boundedFetch(`/api/messages?${params}`, { signal: abort.signal })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || "Messages unavailable.")
      if (!active.current) return
      if (data.viewerId !== viewerId) throw Error("Your account changed. Reload to continue.")
      setMessages(current => mergeMessages(current, data.messages))
      setPeople(current => ({ ...current, ...Object.fromEntries(data.profiles.map((p: Person) => [p.id, p])) }))
      const gap = !older && newest.current && data.nextCursor && !data.messages.some((m: Message) => m.id === newest.current)
      if (initial.current || older || gap) setCursor(data.nextCursor)
      if (!older && data.messages.length) newest.current = data.messages[0].id
      const first = initial.current; initial.current = false; setError("")
      if (otherId && !older && (nearBottom || first)) requestAnimationFrame(() => bottom.current?.scrollIntoView({ block: "nearest" }))
    } catch (reason) { if (active.current && !abort.signal.aborted) setError(reason instanceof Error ? reason.message : "Messages unavailable. Please retry.") }
    finally { reading.current = false; if (active.current) setLoading(false) }
  }, [otherId, viewerId])
  useEffect(() => {
    active.current = true
    const start = setTimeout(() => void load(), 0)
    const refresh = () => void load()
    const timer = setInterval(refresh, otherId ? 8000 : 20000)
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh)
    return () => { active.current = false; clearTimeout(start); controller.current?.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh) }
  }, [load, otherId])

  // Acknowledge displayed incoming messages, never all messages from a sender.
  useEffect(() => {
    if (!otherId) return
    let cancelled = false, busy = false
    const mark = async () => {
      if (busy || document.visibilityState !== "visible" || !document.hasFocus()) return
      const bounds = scroller.current?.getBoundingClientRect()
      if (!bounds) return
      const visible = new Set(Array.from(scroller.current!.querySelectorAll<HTMLElement>("[data-message-id]")).filter(node => {
        const rect = node.getBoundingClientRect()
        return rect.bottom > bounds.top && rect.top < bounds.bottom
      }).map(node => node.dataset.messageId))
      const ids = messages.filter(m => visible.has(m.id) && m.receiver_id === viewerId && !m.is_read).slice(-100).map(m => m.id)
      if (!ids.length) return
      busy = true
      try {
        const response = await boundedFetch("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) })
        if (!response.ok) throw Error()
        if (!cancelled) { setMessages(current => current.map(m => ids.includes(m.id) ? { ...m, is_read: true } : m)); refreshActivity() }
      } catch { /* Keep unread status; the next refresh retries. */ }
      finally { busy = false }
    }
    const frame = requestAnimationFrame(() => void mark()); const list = scroller.current; list?.addEventListener("scroll", mark); window.addEventListener("focus", mark); document.addEventListener("visibilitychange", mark)
    return () => { cancelled = true; cancelAnimationFrame(frame); list?.removeEventListener("scroll", mark); window.removeEventListener("focus", mark); document.removeEventListener("visibilitychange", mark) }
  }, [messages, otherId, viewerId])

  const send = async () => {
    if (!otherId || otherId === viewerId || sendingRef.current || !text.trim()) return
    sendingRef.current = true; setSending(true); setSendError("")
    const attempt = pending.current || { id: crypto.randomUUID(), content: text.trim() }
    pending.current = attempt
    try {
      const response = await boundedFetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...attempt, receiver_id: otherId }) })
      const data = await response.json()
      if (!response.ok) {
        if ([400, 401, 403, 404, 409].includes(response.status)) { pending.current = null; setUncertain(false) }
        else setUncertain(true)
        throw Error(data.error || "Could not confirm delivery.")
      }
      if (!active.current) return
      setMessages(current => mergeMessages(current, [data.message])); pending.current = null
      setText(""); setUncertain(false); refreshActivity()
      requestAnimationFrame(() => bottom.current?.scrollIntoView({ block: "nearest" }))
    } catch (reason) { if (active.current) { if (pending.current) setUncertain(true); setSendError(reason instanceof Error ? reason.message : "Delivery could not be confirmed. Retry to check the same message.") } }
    finally { sendingRef.current = false; if (active.current) setSending(false) }
  }
  const conversations = new Map<string, { message: Message; unread: boolean }>()
  for (const message of messages) {
    const id = message.sender_id === viewerId ? message.receiver_id : message.sender_id
    conversations.set(id, { message, unread: !!conversations.get(id)?.unread || (message.receiver_id === viewerId && !message.is_read) })
  }
  const visible = [...conversations].reverse().filter(([id, c]) => `${people[id]?.full_name || ""} ${people[id]?.username || ""} ${c.message.content}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="mx-auto max-w-3xl px-3 py-5 text-brand-midnight sm:px-5">
    <header className="mb-4 flex items-center gap-3">
      {otherId && <Link href="/messages" aria-label="Back to messages" className="rounded-xl border p-3"><ArrowLeft className="h-5 w-5" /></Link>}
      <div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-extrabold">{otherId ? other?.full_name || "Conversation" : "Messages"}</h1><p className="text-sm text-brand-slate">{otherId ? other?.tagline || "A place for professional conversations." : "Keep your professional conversations moving."}</p></div>
      {other?.username ? <Link className="shrink-0 text-sm font-bold text-brand-indigo" href={`/u/${other.username}`}>View profile</Link> : !otherId && <Link href="/network?tab=connections" className="text-sm font-bold text-brand-indigo">My connections</Link>}
    </header>
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={() => void load(undefined, true)} className="underline">Retry</button></p>}
    <section className="overflow-hidden rounded-2xl border border-brand-borderLight bg-white shadow-soft">
      {!otherId && <label className="block border-b p-4"><span className="sr-only">Search loaded conversations</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" className="w-full rounded-xl border bg-brand-ivory p-3" /></label>}
      <div ref={scroller} className={otherId ? "h-[45dvh] min-h-60 overflow-y-auto p-4" : ""}>
        {loading && <p role="status" className="p-6 text-sm text-brand-slate">Loading conversations…</p>}
        {otherId && cursor && <button onClick={() => void load(cursor, true)} className="mb-4 w-full rounded-lg border p-2 text-sm font-semibold text-brand-indigo">Load earlier messages</button>}
        {!loading && !error && !messages.length && <div className="p-6 text-center"><MessageCircle className="mx-auto mb-3 h-8 w-8 text-brand-indigo"/><h2 className="font-bold">{otherId ? "Start with a thoughtful hello." : "Your next conversation starts with a connection."}</h2><p className="mt-2 text-sm text-brand-slate">{otherId ? "Introduce your work and say why you would like to connect." : "Meet professionals, exchange ideas and explore work together."}</p>{otherId ? <button disabled={sending || uncertain} onClick={() => setText(`Hi ${other?.full_name?.split(" ")[0] || "there"}, I came across your profile and would like to connect about your work.`)} className="mt-4 rounded-xl border px-4 py-3 font-semibold text-brand-indigo">Use an introduction</button> : <Link href="/network" className="mt-4 inline-block rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">Meet professionals</Link>}</div>}
        {otherId ? messages.map(m => <div key={m.id} data-message-id={m.id} className={`my-3 flex ${m.sender_id === viewerId ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.sender_id === viewerId ? "bg-brand-indigo text-white" : "bg-brand-ivory text-brand-midnight"}`}><p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.content}</p><p className="mt-2 text-[10px] opacity-75">{new Date(m.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{m.sender_id === viewerId && (m.is_read ? " · Read" : " · Sent")}</p></div></div>) : visible.map(([id, c]) => <Link key={id} href={`/messages/${id}`} className="flex items-center gap-3 border-b p-4 hover:bg-brand-ivory"><ProfileAvatar src={people[id]?.avatar_url} name={people[id]?.full_name} className="h-11 w-11 shrink-0"/><div className="min-w-0 flex-1"><p className="truncate font-bold">{people[id]?.full_name || "GigWay member"}</p><p className="truncate text-sm text-brand-slate">{c.message.sender_id === viewerId ? "You: " : ""}{c.message.content}</p></div>{c.unread && <span aria-label="Unread messages" className="h-2.5 w-2.5 rounded-full bg-brand-indigo"/>}</Link>)}
        {!otherId && search && !visible.length && <p className="p-6 text-sm text-brand-slate">No matching conversations in loaded history.</p>}
        <div ref={bottom}/>
      </div>
      {!otherId && cursor && <button onClick={() => void load(cursor, true)} className="w-full p-4 text-sm font-bold text-brand-indigo">Load older conversation history</button>}
      {otherId && <form onSubmit={e => { e.preventDefault(); void send() }} className="border-t p-3">
        {sendError && <p role="alert" className="mb-3 text-sm text-red-700">{sendError}</p>}
        <label htmlFor="message" className="sr-only">Your message</label><textarea id="message" value={text} disabled={sending || uncertain || !other || viewerId === otherId} onChange={e => setText(e.target.value)} maxLength={MESSAGE_LIMIT} rows={3} placeholder="Introduce yourself or continue the conversation…" className="w-full resize-y rounded-xl border bg-brand-ivory p-3 text-base disabled:opacity-60"/>
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-brand-slate">{text.length}/{MESSAGE_LIMIT} · Be thoughtful and professional.</span><button disabled={sending || !text.trim() || !other || viewerId === otherId} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-indigo px-4 py-2 font-bold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{sending ? "Sending…" : uncertain ? "Check & retry" : "Send"}</button></div>
      </form>}
    </section>
  </main>
}
