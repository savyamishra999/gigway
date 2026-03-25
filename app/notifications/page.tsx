import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton"

const TYPE_ICONS: Record<string, string> = {
  new_proposal: "📝",
  proposal_accepted: "✅",
  proposal_rejected: "❌",
  new_review: "⭐",
  new_message: "💬",
  project_update: "📋",
  default: "🔔",
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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-[#FFD700]" />
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#FFD700] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && <MarkAllReadButton />}
        </div>

        {/* Notifications List */}
        {!notifications || notifications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">You&apos;re all caught up! No notifications.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => {
              const icon = TYPE_ICONS[notification.type] || TYPE_ICONS.default
              const isUnread = !notification.is_read

              const Content = (
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isUnread
                      ? "bg-[#FFD700]/5 border-[#FFD700]/20 hover:border-[#FFD700]/40"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "text-white font-medium" : "text-gray-300"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.created_at)}</p>
                  </div>

                  {/* Unread dot + link icon */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                    )}
                    {notification.link && (
                      <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </div>
                </div>
              )

              return notification.link ? (
                <Link key={notification.id} href={notification.link}>
                  {Content}
                </Link>
              ) : (
                <div key={notification.id}>{Content}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
