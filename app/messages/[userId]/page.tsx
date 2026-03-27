"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const [otherId, setOtherId] = useState("")
  const [me, setMe] = useState<{ id: string } | null>(null)
  const [other, setOther] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [messages, setMessages] = useState<{
    id: string; sender_id: string; receiver_id: string; content: string; created_at: string; is_read: boolean
  }[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { userId: resolvedId } = await params
      setOtherId(resolvedId)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMe(user)

      const { data: otherProfile } = await supabase
        .from("profiles").select("id, full_name, avatar_url").eq("id", resolvedId).single()
      setOther(otherProfile)

      const { data: msgs, error } = await supabase
        .from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${resolvedId}),and(sender_id.eq.${resolvedId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })

      console.log("Chat messages:", { msgs, error })
      setMessages(msgs || [])
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView(), 100)

      await supabase.from("messages").update({ is_read: true })
        .eq("receiver_id", user.id).eq("sender_id", resolvedId).eq("is_read", false)

      const channel = supabase
        .channel("chat-" + resolvedId)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `receiver_id=eq.${user.id}`
        }, payload => {
          if (payload.new.sender_id === resolvedId) {
            setMessages(prev => [...prev, payload.new as typeof messages[0]])
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
          }
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!text.trim() || sending || !me || !otherId) return
    setSending(true)
    const optimistic = {
      id: Date.now().toString(),
      sender_id: me.id,
      receiver_id: otherId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimistic])
    setText("")
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

    const { error } = await supabase.from("messages").insert({
      sender_id: me.id,
      receiver_id: otherId,
      content: optimistic.content,
      is_read: false,
    })
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-[#94A3B8]">Loading chat...</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-[#94A3B8]">Please login to view messages</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F172A]">
      {/* Header */}
      <div className="px-5 py-4 bg-[#1E293B] border-b border-[#334155] flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          {other?.avatar_url
            ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
            : (other?.full_name?.[0] ?? "?").toUpperCase()
          }
        </div>
        <span className="text-[#F8FAFC] font-semibold">{other?.full_name ?? "User"}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-center text-[#94A3B8] mt-10">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={`flex ${msg.sender_id === me.id ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.sender_id === me.id ? "#6366F1" : "#1E293B",
                color: "#F8FAFC",
                borderBottomRightRadius: msg.sender_id === me.id ? "4px" : undefined,
                borderBottomLeftRadius: msg.sender_id !== me.id ? "4px" : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#1E293B] border-t border-[#334155] flex gap-2 flex-shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message..."
          className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-[#F8FAFC] text-sm outline-none focus:border-[#6366F1] placeholder:text-[#475569]"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-[#6366F1] text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 hover:bg-[#4F46E5] transition-colors"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
}
