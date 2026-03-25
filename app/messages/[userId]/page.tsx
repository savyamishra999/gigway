import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ChatWindow from "@/components/messages/ChatWindow"

export default async function ChatPage(props: { params: Promise<{ userId: string }> }) {
  const { userId: otherId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  if (otherId === user.id) redirect("/messages")

  // Fetch other user's profile
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, is_verified")
    .eq("id", otherId)
    .single()

  if (!otherProfile) return notFound()

  // Fetch message history
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })

  // Mark incoming messages as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", otherId)
    .eq("is_read", false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-16 z-30 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 max-w-2xl py-3 flex items-center gap-4">
          <Link
            href="/messages"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold flex-shrink-0">
              {otherProfile.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{otherProfile.full_name}</p>
              {otherProfile.tagline && (
                <p className="text-gray-500 text-xs truncate">{otherProfile.tagline}</p>
              )}
            </div>
          </div>

          <Link
            href={`/freelancers/${otherId}`}
            className="text-[#FFD700] text-xs hover:underline flex-shrink-0"
          >
            View Profile →
          </Link>
        </div>
      </div>

      {/* Chat Window (client component handles input + real-time) */}
      <ChatWindow
        currentUserId={user.id}
        otherId={otherId}
        otherName={otherProfile.full_name ?? "User"}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
