import { CheckCircle2, LucideIcon, Sparkles, Star } from "lucide-react"

export type StatusTone =
  | "verified" | "freelance" | "fulltime" | "hiring"
  | "featured" | "new" | "remote"

interface ToneMeta { label: string; className: string; icon?: LucideIcon; dot?: string }

const TONES: Record<StatusTone, ToneMeta> = {
  verified:  { label: "Verified",                   className: "text-brand-indigo bg-brand-indigo/10 border-brand-indigo/20", icon: CheckCircle2 },
  freelance: { label: "Available for Freelance",     className: "text-violet-700 bg-violet-50 border-violet-200",              dot: "bg-violet-500" },
  fulltime:  { label: "Open to Full-time Work",      className: "text-blue-700 bg-blue-50 border-blue-200",                    dot: "bg-blue-500" },
  hiring:    { label: "Hiring",                      className: "text-brand-coral bg-brand-coral/10 border-brand-coral/20",    dot: "bg-brand-coral" },
  featured:  { label: "Featured",                    className: "text-amber-700 bg-amber-50 border-amber-200",                 icon: Star },
  new:       { label: "New",                         className: "text-emerald-700 bg-emerald-50 border-emerald-200",          icon: Sparkles },
  remote:    { label: "Remote",                      className: "text-brand-slate bg-slate-50 border-slate-200" },
}

export default function StatusBadge({ tone, label, className = "" }: { tone: StatusTone; label?: string; className?: string }) {
  const meta = TONES[tone]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption font-semibold ${meta.className} ${className}`}>
      {Icon ? <Icon className="h-3 w-3" /> : meta.dot ? <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> : null}
      {label ?? meta.label}
    </span>
  )
}
