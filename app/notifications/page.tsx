import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, ExternalLink } from "lucide-react"
import AutoMarkRead from "@/components/notifications/MarkAllReadButton"

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

  return (
    <div className="min-h-screen bg-brand-ivory py-8 sm:py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center"><Bell className="h-5 w-5 text-brand-indigo" /></div><div><h1 className="text-h2 font-extrabold text-brand-midnight">Notifications</h1><p className="text-caption text-brand-slate">Your account and work activity.</p></div></div>
          <AutoMarkRead />
        </div>

        {/* List */}
        {!notifications || notifications.length === 0 ? (
          <div className="bg-white border border-brand-borderLight rounded-card p-16 text-center shadow-soft">
            <Bell className="h-10 w-10 text-brand-slate/40 mx-auto mb-3" /><p className="text-brand-midnight font-bold">You&apos;re all caught up.</p><p className="text-brand-slate text-sm mt-1">No notifications yet.</p>
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
                    ? "bg-brand-indigo/[.045] border-brand-indigo/30 hover:border-brand-indigo/50"
                    : "bg-white border-brand-borderLight hover:border-brand-indigo/30"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-brand-ivory flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${isUnread ? "text-brand-midnight" : "text-brand-slate"}`}>
                      {heading}
                    </p>
                    {sub && (
                      <p className="text-brand-slate text-xs mt-1 leading-relaxed">{sub}</p>
                    )}
                    <p className="text-brand-slate text-xs mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUnread && <span className="w-2 h-2 rounded-full bg-brand-indigo" />}{n.link && <ExternalLink className="h-3.5 w-3.5 text-brand-slate" />}
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
