import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"
import ChatWindow from "@/components/messages/ChatWindow"

export default async function ChatPage(props: { params: Promise<{ userId: string }> }) {
  const { userId: otherId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  if (otherId === user.id) redirect("/messages")

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, is_verified")
    .eq("id", otherId)
    .single()

  if (!otherProfile) return notFound()

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true })

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", otherId)
    .eq("is_read", false)

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-16 z-30 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-[#1E1E2E]">
        <div className="container mx-auto px-4 max-w-2xl py-3 flex items-center gap-4">
          <Link href="/messages" className="text-[#6B7280] hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {otherProfile.avatar_url ? (
                <img src={otherProfile.avatar_url} alt={otherProfile.full_name ?? ""} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white font-bold">
                  {otherProfile.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#0A0A0F]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold truncate">{otherProfile.full_name}</p>
                {otherProfile.is_verified && <CheckCircle className="h-3.5 w-3.5 text-[#4F46E5] flex-shrink-0" />}
              </div>
              <p className="text-[#10B981] text-xs">Online</p>
            </div>
          </div>

          <Link href={`/freelancers/${otherId}`} className="text-[#818CF8] text-xs hover:underline flex-shrink-0">
            View Profile →
          </Link>
        </div>
      </div>

      <ChatWindow
        currentUserId={user.id}
        otherId={otherId}
        otherName={otherProfile.full_name ?? "User"}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
