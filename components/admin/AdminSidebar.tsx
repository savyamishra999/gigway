import Link from "next/link"
import {
  LayoutDashboard, Users, CheckCircle2, FileText,
  Briefcase, Rocket, TrendingUp, Megaphone, Gift, Headphones, UserCheck, Radio, Bell,
} from "lucide-react"

const NAV = [
  { href: "/admin",                  label: "Dashboard",      icon: LayoutDashboard, exact: true  },
  { href: "/admin/users",            label: "Users",          icon: Users            },
  { href: "/admin/freelancers",      label: "Freelancers",    icon: UserCheck        },
  { href: "/admin/verifications",    label: "Verifications",  icon: CheckCircle2     },
  { href: "/admin/gigs",             label: "Gigs",           icon: FileText         },
  { href: "/admin/jobs",             label: "Jobs",           icon: Briefcase        },
  { href: "/admin/projects",         label: "Projects",       icon: Rocket           },
  { href: "/admin/revenue",          label: "Revenue",        icon: TrendingUp       },
  { href: "/admin/affiliates",       label: "Affiliates",     icon: Megaphone        },
  { href: "/admin/broadcast",        label: "Broadcast",      icon: Radio            },
  { href: "/admin/notices",          label: "Notices",        icon: Bell             },
  { href: "/admin/special-grants",   label: "Special Grants", icon: Gift             },
  { href: "/admin/support",          label: "Support",        icon: Headphones       },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

export default function AdminSidebar({ pathname }: { pathname: string }) {
  const topNav = NAV.slice(0, 5)
  const moreNav = NAV.slice(5)
  const anyMoreActive = moreNav.some(item => isActive(pathname, item.href, item.exact))

  return (
    <>
      {/* ── Desktop sidebar (fixed left) ─────────────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 flex-col bg-[#0D0D14] border-r border-[#1E1E2E] z-40">
        {/* Logo / brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#1E1E2E] flex-shrink-0">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white text-xs font-black">
            G
          </span>
          <div className="leading-tight">
            <p className="text-white font-black text-sm">GigWay</p>
            <p className="text-[#475569] text-[10px] uppercase tracking-widest">Admin</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map(item => {
            const active = isActive(pathname, item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#4F46E5]/15 text-white"
                    : "text-[#6B7280] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[#818CF8]" : ""}`} />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#818CF8] flex-shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1E1E2E]">
          <Link href="/" className="text-[#475569] hover:text-white text-xs transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D14] border-t border-[#1E1E2E]">
        <div className="flex items-center justify-around px-2 py-2">
          {topNav.map(item => {
            const active = isActive(pathname, item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-0 transition-colors ${
                  active ? "text-[#818CF8]" : "text-[#6B7280]"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[9px] font-medium truncate max-w-[48px] text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* "More" — CSS-only dropdown, no JS needed */}
          <div className="relative group">
            <button
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-0 transition-colors ${
                anyMoreActive ? "text-[#818CF8]" : "text-[#6B7280]"
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="19" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span className="text-[9px] font-medium">More</span>
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden shadow-2xl opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-opacity">
              {moreNav.map(item => {
                const active = isActive(pathname, item.href, item.exact)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-[#1E1E2E] last:border-0 ${
                      active ? "text-white bg-[#4F46E5]/10" : "text-[#6B7280] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
