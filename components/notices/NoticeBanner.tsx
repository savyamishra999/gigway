"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Bell, AlertTriangle, Megaphone, Sparkles } from "lucide-react"

type NoticeType = "info" | "warning" | "announcement" | "new_feature"

interface Notice {
  id: string
  title: string
  content: string
  type: NoticeType
}

const TYPE_CONFIG: Record<NoticeType, {
  icon: React.ElementType
  bg: string
  border: string
  iconColor: string
  textColor: string
}> = {
  info:         { icon: Bell,          bg: "bg-blue-500/10",   border: "border-blue-500/30",   iconColor: "text-blue-400",   textColor: "text-blue-100"   },
  warning:      { icon: AlertTriangle, bg: "bg-amber-500/10",  border: "border-amber-500/30",  iconColor: "text-amber-400",  textColor: "text-amber-100"  },
  announcement: { icon: Megaphone,     bg: "bg-purple-500/10", border: "border-purple-500/30", iconColor: "text-purple-400", textColor: "text-purple-100" },
  new_feature:  { icon: Sparkles,      bg: "bg-green-500/10",  border: "border-green-500/30",  iconColor: "text-green-400",  textColor: "text-green-100"  },
}

export default function NoticeBanner({ notices }: { notices: Notice[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = notices.filter(n => !dismissed.has(n.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {visible.map(notice => {
        const cfg = TYPE_CONFIG[notice.type] ?? TYPE_CONFIG.info
        const Icon = cfg.icon
        return (
          <div key={notice.id} className={`${cfg.bg} border ${cfg.border} rounded-2xl px-4 py-3 flex items-start gap-3`}>
            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${cfg.textColor}`}>{notice.title}</p>
              <p className="text-[#94A3B8] text-xs mt-0.5 line-clamp-2">{notice.content}</p>
              <Link href="/notices" className="text-xs font-semibold underline underline-offset-2 mt-1 inline-block opacity-70 hover:opacity-100 transition-opacity text-[#94A3B8]">
                View all →
              </Link>
            </div>
            <button
              onClick={() => setDismissed(d => new Set([...d, notice.id]))}
              className="text-[#475569] hover:text-white transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
