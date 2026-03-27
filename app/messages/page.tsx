"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function MessagesPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [conversations, setConversations] = useState<{
    userId: string
    lastMessage: string
    lastTime: string
    unread: number
    profile: { full_name: string | null; avatar_url: string | null } | null
  }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }
      setUser(authUser)

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, created_at, is_read, sender_id, receiver_id")
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order("created_at", { ascending: false })

      console.log("Messages:", { data, error })

      if (data) {
        const convMap: Record<string, { userId: string; lastMessage: string; lastTime: string; unread: number }> = {}
        data.forEach(msg => {
          const otherId = msg.sender_id === authUser.id ? msg.receiver_id : msg.sender_id
          if (!convMap[otherId]) {
            convMap[otherId] = { userId: otherId, lastMessage: msg.content, lastTime: msg.created_at, unread: 0 }
          }
          if (msg.receiver_id === authUser.id && !msg.is_read) {
            convMap[otherId].unread++
          }
        })

        const convList = Object.values(convMap)
        const withProfiles = await Promise.all(
          convList.map(async (conv) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", conv.userId)
              .single()
            return { ...conv, profile: profile ?? null }
          })
        )
        setConversations(withProfiles)
      }
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-[#94A3B8]">Loading messages...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <p className="text-[#94A3B8] text-lg">Please login to view messages</p>
        <Link href="/login" className="bg-[#6366F1] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#4F46E5] transition-colors">
          Login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[#F8FAFC] text-2xl font-bold mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#94A3B8] text-lg mb-2">No conversations yet</p>
            <p className="text-[#475569] text-sm">Start a conversation from a freelancer profile</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <Link key={conv.userId} href={`/messages/${conv.userId}`} className="no-underline">
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-3 hover:border-[#6366F1]/40 transition-colors cursor-pointer">
                  <div className="w-11 h-11 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                    {conv.profile?.avatar_url
                      ? <img src={conv.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (conv.profile?.full_name?.[0] ?? "?").toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F8FAFC] font-semibold mb-0.5">{conv.profile?.full_name ?? "Unknown User"}</p>
                    <p className="text-[#94A3B8] text-sm truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-[#6366F1] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
