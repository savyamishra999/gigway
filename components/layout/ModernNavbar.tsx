"use client"

import { isCurrentProductCategory } from "@/lib/product-visibility";
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, Building2, Compass, CirclePlus, Home, LifeBuoy, Menu, MessageSquare, Package, Plus, Search, Sparkles, UserRound, UsersRound, Video, Volume2, X } from "lucide-react"
import { authenticatedRootDestination, loginHref } from "@/lib/auth/return-to"
import { withDeadline } from "@/lib/async"
import { createClient } from "@/lib/supabase/client"
import { useAuthUi } from "@/components/layout/AuthUiProvider"
import type { Moment } from "@/lib/moments"
import { MomentHeader } from "@/components/moments/MomentExperience"

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/network", label: "Network", icon: Compass },
  { href: "/social/vijox", label: "VIJOX", icon: Volume2 },
  { href: "/social/glimps", label: "GLIMPS", icon: Video },
  { href: "/work", label: "Work", icon: Package },
].filter(item => isCurrentProductCategory(item.href.split("/").at(-1)!))

const MOBILE_TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/network", label: "Network", icon: UsersRound },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/work", label: "Work", icon: BriefcaseBusiness },
  { href: "/profile", label: "Account", icon: UserRound },
]

const MENU_ITEMS = [
  { href: "/profile/edit", label: "Edit Professional Identity", icon: UserRound },
  { href: "/workplaces", label: "My Workplaces", icon: Building2 },
  { href: "/organizations/new", label: "+ Create Workplace", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Package },
  { href: "/profile", label: "My Account", icon: UserRound },
  { href: "/how-it-works", label: "How GigWay works", icon: LifeBuoy },
  { href: "/contact", label: "Help & Support", icon: LifeBuoy },
]

// Only standard creation routes select Create; work detail pages do not.
const CREATE_ROUTES = ["/create", "/social/create", "/jobs/new", "/projects/new", "/gigs/new"]
export function isMobileTabActive(pathname: string, href: string) {
  const within = (route: string) => pathname === route || pathname.startsWith(route + "/")
  const creating = CREATE_ROUTES.some(within)
  if (href === "/create") return creating
  if (creating) return false
  return within(href)
}

export default function ModernNavbar({ moment }: { moment: Moment | null }) {
  const supabase = createClient()
  const pathname = usePathname()
  const focusedGlimpsCreator = pathname === "/social/glimps/create"
  const homeExperience = pathname === "/home"
  const adminExperience = pathname === "/admin" || pathname.startsWith("/admin/")
  const router = useRouter()
  const { user, profile } = useAuthUi()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [mobileChromeHidden, setMobileChromeHidden] = useState(false)

  useEffect(() => {
    const rootDestination = authenticatedRootDestination(pathname, !!user)
    if (rootDestination) window.location.replace(rootDestination)
  }, [pathname, user])
  const authHref = (join = false) => loginHref(pathname === "/login" ? undefined : pathname, join)
  const preserveLocation = (event: React.MouseEvent<HTMLAnchorElement>, join = false) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    router.push(loginHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, join))
  }
  useEffect(() => {
    let previous = window.scrollY
    const onScroll = () => {
      const current = window.scrollY, focused = document.activeElement?.matches("input,textarea,[contenteditable=true]")
      if (!homeExperience || focused || open || current < 48) { setMobileChromeHidden(false); previous=current; return }
      if (current - previous > 18) setMobileChromeHidden(true)
      if (previous - current > 8) setMobileChromeHidden(false)
      previous=current
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [homeExperience, open])

  const homeHref = user ? "/home" : "/"
  const resolveHref = (href: string) => (href === "/" ? homeHref : href)
  const active = (href: string) => (href === "/" ? pathname === homeHref : pathname.startsWith(href))
  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"
  const avatar = profile?.avatar_url
    ? <img width={40} height={40} decoding="async" src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
    : <span>{initial}</span>
  const logout = async () => {
    if (signingOut) return
    setSigningOut(true)
    setOpen(false)
    try {
      const { error } = await withDeadline(supabase.auth.signOut({ scope: "local" }))
      if (error) throw error
      // The provider handles SIGNED_OUT with one document replacement.
    } catch {
      // On failure, root rechecks cookies rather than asserting a false logout.
      window.location.replace("/")
    }
  }

  return (
    <>
      <header className={`sticky top-0 z-50 border-b border-brand-borderLight bg-white/95 backdrop-blur-xl transition-transform duration-200 ${homeExperience && mobileChromeHidden ? "max-lg:-translate-y-full" : "max-lg:translate-y-0"} ${focusedGlimpsCreator ? "max-lg:hidden" : ""}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-2 sm:gap-4 sm:px-4">
          <Link prefetch={false} href="/" className="shrink-0">
            <Image src="/logo.png" alt="GigWay" width={120} height={40} className="h-auto w-16 sm:h-10 sm:w-auto" />
          </Link>
          <MomentHeader moment={moment} />

          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <Link prefetch={false} key={href} href={resolveHref(href)}
                className={`rounded-lg px-3 py-2 text-body-sm font-semibold transition-colors ${
                  active(href) ? "bg-brand-indigo/10 text-brand-indigoDark" : "text-brand-slate hover:text-brand-midnight"
                }`}>
                {label}
              </Link>
            ))}
          </nav>

  <form onSubmit={(e) => { e.preventDefault(); const value = new FormData(e.currentTarget).get("q")?.toString().trim(); router.push(`/explore${value ? `?q=${encodeURIComponent(value)}` : ""}`) }} className="group hidden md:flex ml-auto max-w-xl flex-1 items-center gap-3 rounded-pill border-2 border-brand-indigo/20 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_0_0_1px_rgba(79,70,229,.04),0_10px_26px_-8px_rgba(79,70,229,.22),0_6px_18px_-10px_rgba(255,107,53,.15)] transition-all duration-200 hover:border-brand-indigo/35">
            <Search className="h-4 w-4 text-brand-indigo flex-shrink-0" />
            <input name="q" className="min-w-0 flex-1 bg-transparent text-body-sm font-medium text-brand-midnight outline-none placeholder:text-brand-slate" placeholder="Search people, Workplaces, jobs, projects or services..." />
            <button aria-label="Submit search" className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-indigo/10 text-brand-indigo transition-colors group-hover:bg-brand-indigo group-hover:text-white">
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link prefetch={false} href="/explore" aria-label="Search"
              className="flex md:hidden rounded-full p-2 sm:p-2.5 text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/15">
              <Search className="h-5 w-5" />
            </Link>
            {user ? (
              <>
                <Link prefetch={false} aria-label="Create" href="/create" className="hidden sm:flex rounded-lg p-2.5 text-brand-coral hover:bg-brand-coral/10">
                  <CirclePlus className="h-5 w-5" />
                </Link>
                <Link prefetch={false} aria-label="Messages" href="/messages" className="rounded-lg p-2 sm:p-2.5 text-brand-slate hover:bg-slate-100 hover:text-brand-midnight">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link prefetch={false} aria-label="Notifications" href="/notifications" className="rounded-lg p-2 sm:p-2.5 text-brand-slate hover:bg-slate-100 hover:text-brand-midnight">
                  <Bell className="h-5 w-5" />
                </Link>
                <button onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open} aria-controls="account-menu"
                  className="h-8 w-8 shrink-0 overflow-hidden rounded-full sm:h-9 sm:w-9 bg-gradient-to-br from-brand-indigo to-brand-coral text-sm font-bold text-white">
                  {avatar}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link prefetch={false} href={authHref()} onClick={event => preserveLocation(event)} className="hidden sm:block rounded-xl px-4 py-2 text-body-sm font-semibold text-brand-slate hover:text-brand-midnight">
                  Log in
                </Link>
                <Link prefetch={false} href={authHref(true)} onClick={event => preserveLocation(event, true)} className="rounded-xl bg-brand-indigo px-4 py-2 text-body-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:bg-brand-indigoDark hover:shadow-[0_6px_18px_-4px_rgba(79,70,229,.55)] transition-all">
                  Join GigWay
                </Link>
              </div>
            )}
            <button onClick={() => setOpen(!open)} className="lg:hidden rounded-lg p-1.5 sm:p-2 text-brand-slate" aria-label="Menu" aria-expanded={open} aria-controls="account-menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {open && (
          <div id="account-menu" className="max-h-[calc(100dvh-9rem)] overflow-y-auto border-t border-brand-borderLight bg-white px-4 py-3 lg:absolute lg:right-4 lg:top-14 lg:w-72 lg:rounded-xl lg:border lg:shadow-elevated">
            {user && (
              <div className="sticky -top-3 z-10 mb-2 flex items-center justify-between gap-3 border-b border-brand-borderLight bg-white py-2">
                <span className="min-w-0 truncate text-body-sm font-semibold text-brand-midnight">{profile?.full_name || "My account"}</span>
                <button type="button" onClick={logout} disabled={signingOut} className="min-h-11 shrink-0 rounded-lg px-4 py-2 text-body-sm font-semibold text-brand-coral hover:bg-brand-coral/5 disabled:opacity-60">
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            )}
            <div className="lg:hidden grid gap-1 mb-2">
              {links.map(({ href, label }) => (
                <Link prefetch={false} key={href} href={resolveHref(href)} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-body-sm text-brand-midnight">
                  {label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="lg:mt-0 mt-2 border-t border-brand-borderLight pt-2 lg:border-t-0 lg:pt-0">
                <p className="px-3 py-1.5 text-body-sm font-semibold text-brand-midnight truncate">{profile?.full_name || "My account"}</p>
                {profile?.username && <p className="truncate px-3 pb-2 text-caption text-brand-slate">@{profile.username}</p>}
                <Link prefetch={false} href={profile?.username ? `/u/${profile.username}` : "/profile/complete"} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-body-sm text-brand-slate hover:bg-slate-50 hover:text-brand-midnight">
                    {profile?.username ? "My Professional Identity" : "Complete Professional Identity"}
                </Link>
                {MENU_ITEMS.map(item => (
                  <Link prefetch={false} key={item.label} href={item.href} onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-body-sm text-brand-slate hover:bg-slate-50 hover:text-brand-midnight">
                    {item.label}
                      {item.href === "/workplaces" && <span className="mt-1 block text-caption">Your company or organization page.</span>}
                  </Link>
                ))}
                <Link prefetch={false} href="/login?switch=1" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-body-sm text-brand-indigo hover:bg-brand-indigo/5">
                  Switch Google account
                </Link>
              </div>
            ) : (
              <Link prefetch={false} href={authHref()} onClick={event => { setOpen(false); preserveLocation(event) }} className="block rounded-lg px-3 py-2 text-body-sm font-semibold text-brand-indigo">
                Log in
              </Link>
            )}
          </div>
        )}
      </header>

      {user && (
        <nav aria-label="Mobile navigation" data-mobile-navigation className={`fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-brand-borderLight bg-white px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-12px_rgba(15,23,42,.18)] lg:hidden ${focusedGlimpsCreator || adminExperience ? "hidden" : ""}`}>
          {MOBILE_TABS.map(item => {
            const Icon = item.icon
            const isActive = isMobileTabActive(pathname, item.href)
            const isCreate = item.href === "/create"
            return (
              <Link prefetch={false} key={item.label} href={item.href}
                aria-label={item.label} aria-current={isActive ? "page" : undefined}
                className={`relative flex h-16 min-w-0 flex-col items-center justify-end gap-1 rounded-lg pb-1 text-[11px] leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:ring-offset-2 ${isActive ? "font-bold text-brand-indigoDark" : "font-medium text-brand-slate"}`}>
                {isCreate ? (
                  <span data-mobile-create className={`absolute -top-4 grid h-14 w-14 place-items-center rounded-full border-4 border-white text-white shadow-[0_4px_14px_-4px_rgba(79,70,229,.55)] transition-colors ${isActive ? "bg-brand-indigoDark ring-2 ring-brand-indigo/30" : "bg-brand-indigo"}`}>
                    <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={2.5} />
                  </span>
                ) : <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.75} />}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
