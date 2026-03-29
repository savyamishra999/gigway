"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle } from "lucide-react"

const CONTACT_PATTERN = /(\+?[0-9]{10,13}|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const [otherId, setOtherId] = useState("")
  const [me, setMe] = useState<{ id: string } | null>(null)
  const [other, setOther] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contactWarning, setContactWarning] = useState<string | null>(null)
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

      const { data: msgs } = await supabase
        .from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${resolvedId}),and(sender_id.eq.${resolvedId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })

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
            setMessages(prev => [...prev, payload.new as Message])
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
          }
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = (value: string) => {
    setText(value)
    if (CONTACT_PATTERN.test(value)) {
      setContactWarning("Sharing phone numbers or emails outside GigWay may expose you to fraud. Stay safe and communicate on-platform.")
    } else {
      setContactWarning(null)
    }
  }

  const send = async () => {
    if (!text.trim() || sending || !me || !otherId) return
    if (me.id === otherId) return // prevent self-messaging

    setSending(true)
    const optimistic: Message = {
      id: Date.now().toString(),
      sender_id: me.id,
      receiver_id: otherId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimistic])
    setText("")
    setContactWarning(null)
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
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <p className="text-[#6B7280]">Loading chat...</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <p className="text-[#6B7280]">Please login to view messages</p>
      </div>
    )
  }

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const dateLabel = formatDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === dateLabel) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date: dateLabel, msgs: [msg] })
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0F]">
      {/* Header */}
      <div className="px-5 py-4 bg-[#12121A] border-b border-[#1E1E2E] flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          {other?.avatar_url
            ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
            : (other?.full_name?.[0] ?? "?").toUpperCase()
          }
        </div>
        <div>
          <span className="text-[#F8FAFC] font-semibold">{other?.full_name ?? "User"}</span>
          <p className="text-[#6B7280] text-xs">GigWay Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <p className="text-center text-[#6B7280] mt-10 text-sm">No messages yet. Say hello!</p>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#1E1E2E]" />
              <span className="text-[#4B5563] text-xs font-medium px-2">{group.date}</span>
              <div className="flex-1 h-px bg-[#1E1E2E]" />
            </div>

            {group.msgs.map((msg, i) => {
              const isMine = msg.sender_id === me.id
              const prevMsg = group.msgs[i - 1]
              const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id

              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}>
                  <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className="px-4 py-2.5 text-sm leading-relaxed text-[#F8FAFC]"
                      style={{
                        background: isMine ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "#1E1E2E",
                        borderRadius: isMine
                          ? isGrouped ? "18px 18px 4px 18px" : "18px 4px 18px 18px"
                          : isGrouped ? "18px 18px 18px 4px" : "4px 18px 18px 18px",
                      }}
                    >
                      {msg.content}
                    </div>
                    {!isGrouped || i === group.msgs.length - 1 ? (
                      <span className="text-[#4B5563] text-[10px] mt-1 px-1">{formatTime(msg.created_at)}</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Contact warning */}
      {contactWarning && (
        <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-400 text-xs">{contactWarning}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-[#12121A] border-t border-[#1E1E2E] flex gap-2 flex-shrink-0">
        <input
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message..."
          className="flex-1 bg-[#1E1E2E] border border-[#2A2A3E] rounded-xl px-4 py-2.5 text-[#F8FAFC] text-sm outline-none focus:border-[#4F46E5] placeholder:text-[#4B5563]"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
}
