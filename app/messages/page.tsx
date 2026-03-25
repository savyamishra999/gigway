import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

interface Conversation {
  otherId: string
  otherName: string
  otherAvatar: string | null
  lastMessage: string
  lastTime: string
  unread: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString()
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch all messages involving this user, newest first
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  // Group into conversations keyed by the other person's ID
  const convMap = new Map<string, {
    lastMessage: string
    lastTime: string
    unread: number
  }>()

  for (const msg of messages ?? []) {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        lastMessage: msg.content,
        lastTime: msg.created_at,
        unread: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0,
      })
    } else {
      // Accumulate unread count
      const existing = convMap.get(otherId)!
      if (!msg.is_read && msg.receiver_id === user.id) {
        existing.unread++
      }
    }
  }

  // Fetch profile info for each conversation partner
  const otherIds = Array.from(convMap.keys())
  const conversations: Conversation[] = []

  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", otherIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

    for (const [otherId, conv] of convMap.entries()) {
      const profile = profileMap.get(otherId)
      conversations.push({
        otherId,
        otherName: profile?.full_name ?? "Unknown User",
        otherAvatar: profile?.avatar_url ?? null,
        ...conv,
      })
    }

    // Sort by last message time (newest first)
    conversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-6 w-6 text-[#FFD700]" />
          <h1 className="text-2xl font-bold text-white">Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No conversations yet.</p>
            <p className="text-gray-600 text-sm mt-1">
              Start a conversation by messaging a freelancer or client.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <Link key={conv.otherId} href={`/messages/${conv.otherId}`}>
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#FFD700]/40 hover:bg-white/8 transition-all group">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-lg flex-shrink-0">
                    {conv.otherName[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-medium truncate ${conv.unread > 0 ? "text-white" : "text-gray-300"}`}>
                        {conv.otherName}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {timeAgo(conv.lastTime)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unread > 0 ? "text-gray-300" : "text-gray-500"}`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#FFD700] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
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
