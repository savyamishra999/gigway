import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, ExternalLink } from "lucide-react"
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton"

const TYPE_ICONS: Record<string, string> = {
  broadcast:         "📢",
  new_proposal:      "📝",
  proposal_accepted: "✅",
  proposal_rejected: "❌",
  new_review:        "⭐",
  new_message:       "💬",
  project_update:    "📋",
  plan_activated:    "🚀",
  default:           "🔔",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#818CF8]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[#818CF8] text-xs">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {/* List */}
        {!notifications || notifications.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-16 text-center">
            <Bell className="h-10 w-10 text-[#334155] mx-auto mb-3" />
            <p className="text-white font-bold">All caught up!</p>
            <p className="text-[#4B5563] text-sm mt-1">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const icon = TYPE_ICONS[n.type] || TYPE_ICONS.default
              const isUnread = !n.is_read
              // Support both column shapes: {title,body} and legacy {message}
              const heading = n.title || n.message || ""
              const sub     = n.body ?? null

              const Content = (
                <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  isUnread
                    ? "bg-[#4F46E5]/5 border-[#4F46E5]/25 hover:border-[#4F46E5]/40"
                    : "bg-[#12121A] border-[#1E1E2E] hover:border-[#334155]"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${isUnread ? "text-white" : "text-[#CBD5E1]"}`}>
                      {heading}
                    </p>
                    {sub && (
                      <p className="text-[#6B7280] text-xs mt-1 leading-relaxed">{sub}</p>
                    )}
                    <p className="text-[#4B5563] text-xs mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUnread && <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />}
                    {n.link && <ExternalLink className="h-3.5 w-3.5 text-[#4B5563]" />}
                  </div>
                </div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link}>{Content}</Link>
              ) : (
                <div key={n.id}>{Content}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
