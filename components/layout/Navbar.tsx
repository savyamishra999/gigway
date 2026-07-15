"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Bell, User, LogOut, ChevronDown, Menu, X,
  LayoutDashboard, MessageSquare, Edit, Zap,
  Bookmark, Sparkles, Gift, Crown, Headphones,
  Briefcase, Users, Package, Layers,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import SupportModal from "@/components/support/SupportModal"

interface Profile {
  full_name: string | null
  avatar_url?: string | null
  user_roles?: string[] | null
}

interface NavLink {
  href: string
  label: string
  highlight?: boolean
  ai?: boolean
  earn?: boolean
  post?: boolean
}

// ── Role-based nav link sets ─────────────────────────────────────────────────

const GUEST_LINKS: NavLink[] = [
  { href: "/login", label: "🔍 Find Work" },
  { href: "/login", label: "👔 Hire Talent" },
  { href: "/pricing", label: "Pricing", highlight: true },
]

const FIND_WORK_LINKS: NavLink[] = [
  { href: "/gigs",     label: "Gigs" },
  { href: "/projects", label: "Projects" },
  { href: "/jobs",     label: "Jobs" },
  { href: "/ai-tools", label: "✨ AI", ai: true },
  { href: "/pricing",  label: "Pricing", highlight: true },
]

const HIRE_TALENT_LINKS: NavLink[] = [
  { href: "/jobs/new",     label: "Post Job",           post: true },
  { href: "/freelancers",  label: "Browse Freelancers" },
  { href: "/dashboard",    label: "My Posts" },
  { href: "/pricing",      label: "Pricing", highlight: true },
]

const BOTH_LINKS: NavLink[] = [
  { href: "/gigs",         label: "Gigs" },
  { href: "/projects",     label: "Projects" },
  { href: "/jobs",         label: "Jobs" },
  { href: "/jobs/new",     label: "Post Job",           post: true },
  { href: "/freelancers",  label: "Freelancers" },
  { href: "/ai-tools",     label: "✨ AI", ai: true },
  { href: "/pricing",      label: "Pricing", highlight: true },
]

// ── Link style helper ────────────────────────────────────────────────────────
function linkClass(link: NavLink, pathname: string, mobile = false): string {
  const isActive = link.href !== "/login" && pathname.startsWith(link.href) && !link.ai
  const base = mobile
    ? "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
    : "text-sm font-medium transition-colors"

  if (link.ai)
    return `${base} text-[#A78BFA] font-bold bg-[#7C3AED]/10 px-3 py-1 rounded-lg border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20`
  if (link.post)
    return `${base} ${isActive ? "text-[#FCD34D]" : "text-[#F59E0B] hover:text-[#FCD34D] font-semibold"}`
  if (link.highlight)
    return `${base} ${isActive ? "text-[#F97316]" : "text-[#F59E0B] hover:text-[#F97316] font-semibold"}`
  if (link.earn)
    return `${base} text-[#4ADE80] hover:text-[#22C55E] font-semibold`
  if (isActive)
    return mobile
      ? `${base} bg-[#4F46E5]/10 text-[#818CF8]`
      : `${base} text-[#818CF8]`
  return mobile
    ? `${base} text-[#6B7280] hover:text-white hover:bg-white/5`
    : `${base} text-[#6B7280] hover:text-white`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [user, setUser]           = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [unread, setUnread]       = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const supabase  = createClient()
  const router    = useRouter()
  const pathname  = usePathname()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
          .split(",").map(e => e.trim().toLowerCase())
        setIsAdmin(adminEmails.includes((user.email ?? "").toLowerCase()))

        supabase.from("profiles")
          .select("full_name, avatar_url, user_roles")
          .eq("id", user.id).single()
          .then(({ data }) => setProfile(data))

        supabase.from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnread(count ?? 0))

        supabase.from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnreadMsgs(count ?? 0))

        channel = supabase.channel("navbar-msgs")
          .on("postgres_changes", {
            event: "INSERT", schema: "public", table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          }, () => setUnreadMsgs(prev => prev + 1))
          .on("postgres_changes", {
            event: "UPDATE", schema: "public", table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          }, () => {
            supabase.from("messages")
              .select("id", { count: "exact", head: true })
              .eq("receiver_id", user.id).eq("is_read", false)
              .then(({ count }) => setUnreadMsgs(count ?? 0))
          })
          .subscribe()
      }
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [pathname]) // eslint-disable-line

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        mobileRef.current && !mobileRef.current.contains(e.target as Node) &&
        toggleRef.current && !toggleRef.current.contains(e.target as Node)
      ) setMobileOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    router.push("/"); router.refresh()
  }

  // ── Derive role-based nav links ─────────────────────────────────────────────
  const rawRoles    = (profile?.user_roles as string[] | null) ?? []
  const isFindWork  = user ? (rawRoles.includes("find_work") || rawRoles.length === 0) : false
  const isHireTalent = user ? rawRoles.includes("hire_talent") : false
  const isBoth      = isFindWork && isHireTalent

  const navLinks: NavLink[] = !user
    ? GUEST_LINKS
    : isBoth
    ? BOTH_LINKS
    : isHireTalent
    ? HIRE_TALENT_LINKS
    : FIND_WORK_LINKS

  const initial   = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
  const firstName = profile?.full_name?.split(" ")[0] || "Account"

  return (
    <>
      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        userName={profile?.full_name ?? undefined}
        userEmail={user?.email ?? undefined}
      />

      <nav className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#1E1E2E]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src="/logo.png" width={160} height={42} alt="GigWay" priority
              className="object-contain" style={{ maxHeight: "42px", width: "auto" }}
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link, i) => (
              <Link key={`${link.href}-${i}`} href={link.href} className={linkClass(link, pathname)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right section */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold gap-1.5 text-sm px-3 h-8 rounded-lg shadow-lg shadow-[#F97316]/20">
                      <Crown className="h-3.5 w-3.5" /> Admin
                    </Button>
                  </Link>
                )}

                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-white hover:bg-white/5 gap-1.5 text-sm">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>

                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-white hover:bg-white/5 relative">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMsgs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadMsgs > 9 ? "9+" : unreadMsgs}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-white hover:bg-white/5 relative">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-white/5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#6366F1] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : initial}
                      </div>
                      <span className="text-white text-sm max-w-[80px] truncate">{firstName}</span>
                      <ChevronDown className="h-4 w-4 text-[#6B7280]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-[#12121A] border-[#1E1E2E] text-white">
                    <div className="px-3 py-2 text-xs text-[#6B7280] truncate">{user.email}</div>
                    {rawRoles.length > 0 && (
                      <div className="px-3 pb-2 flex gap-1">
                        {isFindWork && (
                          <span className="text-[10px] bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30 rounded-full px-2 py-0.5">🔍 Find Work</span>
                        )}
                        {isHireTalent && (
                          <span className="text-[10px] bg-[#F59E0B]/20 text-[#FCD34D] border border-[#F59E0B]/30 rounded-full px-2 py-0.5">👔 Hire</span>
                        )}
                      </div>
                    )}
                    <DropdownMenuSeparator className="bg-[#1E1E2E]" />
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/profile/edit" className="flex items-center gap-2"><Edit className="h-4 w-4" /> Edit Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/saved" className="flex items-center gap-2"><Bookmark className="h-4 w-4" /> Saved</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/ai-tools" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Tools</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/refer" className="flex items-center gap-2"><Gift className="h-4 w-4" /> Refer &amp; Earn</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/buy-connects" className="flex items-center gap-2"><Zap className="h-4 w-4" /> Buy Connects</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSupportOpen(true)}
                      className="hover:bg-white/5 cursor-pointer flex items-center gap-2"
                    >
                      <Headphones className="h-4 w-4" /> Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1E1E2E]" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 cursor-pointer flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-white hover:bg-white/5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold px-5 shadow-lg shadow-[#4F46E5]/20">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-1">
            {user && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative text-[#6B7280] hover:text-white hover:bg-white/5">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Button
              ref={toggleRef}
              variant="ghost" size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-[#6B7280] hover:text-white hover:bg-white/5"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div ref={mobileRef} className="md:hidden border-t border-[#1E1E2E] bg-[#0A0A0F]">
            <div className="container mx-auto px-4 py-4 space-y-1">

              {/* Role-based nav links */}
              {navLinks.map((link, i) => (
                <Link
                  key={`${link.href}-${i}`}
                  href={link.href}
                  className={linkClass(link, pathname, true)}
                >
                  {link.href === "/gigs"        && <Package      className="h-4 w-4" />}
                  {link.href === "/projects"     && <Layers       className="h-4 w-4" />}
                  {link.href === "/jobs"         && <Briefcase    className="h-4 w-4" />}
                  {link.href === "/jobs/new"     && <Briefcase    className="h-4 w-4" />}
                  {link.href === "/freelancers"  && <Users        className="h-4 w-4" />}
                  {link.href === "/ai-tools"     && <Sparkles     className="h-4 w-4" />}
                  {link.label}
                </Link>
              ))}

              {/* Logged-in section */}
              {user ? (
                <div className="border-t border-[#1E1E2E] pt-3 mt-3 space-y-1">
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F97316]/10 text-[#F97316] font-bold text-sm">
                      <Crown className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                    {unreadMsgs > 0 && (
                      <span className="ml-auto bg-[#4F46E5] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadMsgs > 9 ? "9+" : unreadMsgs}
                      </span>
                    )}
                  </Link>
                  <Link href="/saved" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Bookmark className="h-4 w-4" /> Saved
                  </Link>
                  <Link href="/ai-tools" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Sparkles className="h-4 w-4" /> AI Tools
                  </Link>
                  <Link href="/buy-connects" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Zap className="h-4 w-4" /> Buy Connects
                  </Link>
                  <Link href="/refer" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Gift className="h-4 w-4" /> Refer &amp; Earn
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); setSupportOpen(true) }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm w-full"
                  >
                    <Headphones className="h-4 w-4" /> Support
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm w-full"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#1E1E2E] pt-3 mt-3 flex flex-col gap-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-[#1E1E2E] text-white hover:bg-white/5">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
