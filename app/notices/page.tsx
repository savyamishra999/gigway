import { createClient as createServiceClient } from "@supabase/supabase-js"
import Link from "next/link"
import { Bell, AlertTriangle, Megaphone, Sparkles, ArrowLeft } from "lucide-react"

type NoticeType = "info" | "warning" | "announcement" | "new_feature"

interface Notice {
  id: string
  title: string
  content: string
  type: NoticeType
  show_until: string | null
  created_at: string
}

const TYPE_CONFIG: Record<NoticeType, {
  icon: React.ElementType
  bg: string
  border: string
  iconBg: string
  iconColor: string
  badge: string
  label: string
}> = {
  info:         { icon: Bell,          bg: "bg-blue-500/10",   border: "border-blue-500/30",   iconBg: "bg-blue-500/20",   iconColor: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300",     label: "Info"        },
  warning:      { icon: AlertTriangle, bg: "bg-amber-500/10",  border: "border-amber-500/30",  iconBg: "bg-amber-500/20",  iconColor: "text-amber-400",  badge: "bg-amber-500/20 text-amber-300",   label: "Warning"     },
  announcement: { icon: Megaphone,     bg: "bg-purple-500/10", border: "border-purple-500/30", iconBg: "bg-purple-500/20", iconColor: "text-purple-400", badge: "bg-purple-500/20 text-purple-300", label: "Announcement"},
  new_feature:  { icon: Sparkles,      bg: "bg-green-500/10",  border: "border-green-500/30",  iconBg: "bg-green-500/20",  iconColor: "text-green-400",  badge: "bg-green-500/20 text-green-300",   label: "New Feature" },
}

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 60 // revalidate every 60 seconds

async function getNotices(): Promise<Notice[]> {
  const now = new Date().toISOString()
  const { data } = await adminDb
    .from("notices")
    .select("id, title, content, type, show_until, created_at")
    .eq("is_active", true)
    .or(`show_until.is.null,show_until.gt.${now}`)
    .order("created_at", { ascending: false })
  return data ?? []
}

export default async function NoticesPage() {
  const notices = await getNotices()

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">GigWay ✅ Notice Board</h1>
              <p className="text-[#6B7280] text-xs mt-0.5">Official announcements and updates from GigWay</p>
            </div>
          </div>
        </div>

        {/* Notices */}
        {notices.length === 0 ? (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-12 text-center">
            <Bell className="h-8 w-8 text-[#475569] mx-auto mb-3" />
            <p className="text-white font-bold">No notices right now</p>
            <p className="text-[#475569] text-sm mt-1">Check back later for updates from GigWay</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(notice => {
              const cfg = TYPE_CONFIG[notice.type] ?? TYPE_CONFIG.info
              const Icon = cfg.icon
              return (
                <div key={notice.id} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[#475569] text-[10px]">
                          {new Date(notice.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                        {notice.show_until && (
                          <span className="text-[#475569] text-[10px]">
                            · expires {new Date(notice.show_until).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold text-sm">{notice.title}</p>
                      <p className="text-[#94A3B8] text-sm mt-1.5 leading-relaxed">{notice.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-[#475569] text-xs mt-8">
          GigWay ✅ — Official Notice Board
        </p>
      </div>
    </div>
  )
}
