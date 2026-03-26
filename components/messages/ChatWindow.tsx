"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface ChatWindowProps {
  currentUserId: string
  otherId: string
  otherName: string
  initialMessages: Message[]
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function ChatWindow({ currentUserId, otherId, otherName, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${[currentUserId, otherId].sort().join("_")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${currentUserId}`,
      }, payload => {
        const newMsg = payload.new as Message
        if (newMsg.sender_id !== otherId) return
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Mark as read
        supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id)
          .then(() => null, () => null)
        scrollToBottom()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput("")

    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherId,
      content: text,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimistic])

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: otherId, content: text }),
    })

    if (!res.ok) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(text)
    } else {
      const { message } = await res.json()
      setMessages(prev => prev.map(m =>
        m.id === optimistic.id ? { ...optimistic, id: message.id, created_at: message.created_at } : m
      ))
    }
    setSending(false)
    inputRef.current?.focus()
  }, [input, sending, currentUserId, otherId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  let lastDate = ""

  return (
    <div className="flex flex-col flex-1 container mx-auto px-4 max-w-2xl py-4 h-[calc(100vh-9rem)]">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1E2E]">
        {messages.length === 0 && (
          <div className="text-center text-[#4B5563] text-sm py-12">
            No messages yet. Say hi to {otherName}!
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId
          const msgDate = new Date(msg.created_at).toDateString()
          const showDate = msgDate !== lastDate
          lastDate = msgDate

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-[#1E1E2E]" />
                  <span className="text-xs text-[#4B5563] whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-px bg-[#1E1E2E]" />
                </div>
              )}
              <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-br-sm"
                    : "bg-[#12121A] border border-[#1E1E2E] text-[#E5E7EB] rounded-bl-sm"
                } ${msg.id.startsWith("opt_") ? "opacity-60" : ""}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMine ? "text-white/50" : "text-[#4B5563]"}`}>
                    {formatTime(msg.created_at)}
                    {isMine && msg.is_read && <span className="ml-1">✓✓</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1E1E2E] pt-4">
        <div className="flex items-end gap-3 bg-[#12121A] border border-[#1E1E2E] rounded-2xl px-4 py-3 focus-within:border-[#4F46E5]/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherName}...`}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder:text-[#4B5563] text-sm outline-none resize-none max-h-32 leading-relaxed"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-[#4F46E5]/20"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-[#4B5563] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
