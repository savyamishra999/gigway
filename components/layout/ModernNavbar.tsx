"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, Building2, Compass, CirclePlus, Home, LifeBuoy, Menu, MessageSquare, Package, Search, UserRound, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Discover", icon: Compass },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/gigs", label: "Gigs", icon: Package },
]

const MOBILE_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Discover", icon: Compass },
  { href: "/create", label: "Create", icon: CirclePlus },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/profile", label: "Profile", icon: UserRound },
]

const MENU_ITEMS = [
  { href: "/profile", label: "View Profile", icon: UserRound },
  { href: "/profile/edit", label: "Edit Profile", icon: UserRound },
  { href: "/profile", label: "My Organizations", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Package },
  { href: "/contact", label: "Help & Support", icon: LifeBuoy },
]

export default function ModernNavbar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string | null; username?: string | null; avatar_url?: string | null } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle()
        setProfile(data)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const homeHref = user ? "/home" : "/"
  const resolveHref = (href: string) => (href === "/" ? homeHref : href)
  const active = (href: string) => (href === "/" ? pathname === homeHref : pathname.startsWith(href))
  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"
  const avatar = profile?.avatar_url
    ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
    : <span>{initial}</span>
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh() }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-borderLight bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="GigWay" width={122} height={34} className="h-auto w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link key={href} href={resolveHref(href)}
                className={`rounded-lg px-3 py-2 text-body-sm font-semibold transition-colors ${
                  active(href) ? "bg-brand-indigo/10 text-brand-indigo" : "text-brand-slate hover:text-brand-midnight"
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          <Link href="/explore"
            className="hidden md:flex ml-auto max-w-sm flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-body-sm text-brand-slate hover:bg-slate-200 transition-colors">
            <Search className="h-4 w-4" /> Search people, work and opportunities
          </Link>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {user ? (
              <>
                <Link aria-label="Create" href="/create" className="hidden sm:flex rounded-lg p-2.5 text-brand-coral hover:bg-brand-coral/10">
                  <CirclePlus className="h-5 w-5" />
                </Link>
                <Link aria-label="Messages" href="/messages" className="rounded-lg p-2.5 text-brand-slate hover:bg-slate-100 hover:text-brand-midnight">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link aria-label="Notifications" href="/notifications" className="rounded-lg p-2.5 text-brand-slate hover:bg-slate-100 hover:text-brand-midnight">
                  <Bell className="h-5 w-5" />
                </Link>
                <button onClick={() => setOpen(!open)} aria-label="Account menu"
                  className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-brand-indigo to-brand-coral text-sm font-bold text-white">
                  {avatar}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block rounded-xl px-4 py-2 text-body-sm font-semibold text-brand-slate hover:text-brand-midnight">
                  Log in
                </Link>
                <Link href="/login" className="rounded-xl bg-brand-indigo px-4 py-2 text-body-sm font-semibold text-white hover:bg-brand-indigoDark transition-colors">
                  Join GigWay
                </Link>
              </div>
            )}
            <button onClick={() => setOpen(!open)} className="lg:hidden rounded-lg p-2 text-brand-slate" aria-label="Menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-brand-borderLight bg-white px-4 py-3 lg:absolute lg:right-4 lg:top-14 lg:w-60 lg:rounded-xl lg:border lg:shadow-elevated">
            <div className="lg:hidden grid gap-1 mb-2">
              {links.map(({ href, label }) => (
                <Link key={href} href={resolveHref(href)} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-body-sm text-brand-midnight">
                  {label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="lg:mt-0 mt-2 border-t border-brand-borderLight pt-2 lg:border-t-0 lg:pt-0">
                <p className="px-3 py-1.5 text-body-sm font-semibold text-brand-midnight truncate">{profile?.full_name || "My account"}</p>
                {MENU_ITEMS.map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-body-sm text-brand-slate hover:bg-slate-50 hover:text-brand-midnight">
                    {item.label}
                  </Link>
                ))}
                <button onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-body-sm text-brand-coral hover:bg-brand-coral/5">
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-body-sm font-semibold text-brand-indigo">
                Log in
              </Link>
            )}
          </div>
        )}
      </header>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-brand-borderLight bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
          {MOBILE_TABS.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link key={item.label} href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium ${isActive ? "text-brand-indigo" : "text-brand-slate"}`}>
                <Icon className={item.label === "Create" ? "h-7 w-7 -mt-4 rounded-full bg-brand-coral p-1.5 text-white shadow-lg shadow-brand-coral/30" : "h-5 w-5"} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
