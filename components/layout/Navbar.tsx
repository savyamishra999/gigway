"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Bell, User, LogOut, ChevronDown, Menu, X,
  MessageSquare, Edit, Bookmark, Headphones, Crown,
  Briefcase, Users, Package, Layers, FileText, Search,
  Building2, FolderOpen, PlusCircle, ShieldCheck,
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
  find_work_type?: string | null
  hire_talent_type?: string | null
  verification_status?: string | null
}

interface NavLink { href: string; label: string; icon?: React.ReactNode; post?: boolean }

// ── Link sets per role ────────────────────────────────────────────────────────

const FREELANCER_LINKS: NavLink[] = [
  { href: "/gigs",     label: "Gigs",     icon: <Package className="h-4 w-4" /> },
  { href: "/projects", label: "Projects", icon: <Layers  className="h-4 w-4" /> },
]

const JOB_SEEKER_LINKS: NavLink[] = [
  { href: "/jobs",      label: "Jobs",            icon: <Briefcase className="h-4 w-4" /> },
  { href: "/dashboard", label: "My Applications", icon: <FileText  className="h-4 w-4" /> },
]

const FIND_WORK_BOTH_LINKS: NavLink[] = [
  { href: "/gigs",      label: "Gigs",         icon: <Package   className="h-4 w-4" /> },
  { href: "/projects",  label: "Projects",     icon: <Layers    className="h-4 w-4" /> },
  { href: "/jobs",      label: "Jobs",         icon: <Briefcase className="h-4 w-4" /> },
  { href: "/dashboard", label: "Applications", icon: <FileText  className="h-4 w-4" /> },
]

const INDIVIDUAL_HIRE_LINKS: NavLink[] = [
  { href: "/projects/new", label: "Post Project",      icon: <PlusCircle  className="h-4 w-4" />, post: true },
  { href: "/freelancers",  label: "Browse Freelancers",icon: <Users       className="h-4 w-4" /> },
  { href: "/dashboard",    label: "My Projects",       icon: <FolderOpen  className="h-4 w-4" /> },
]

const COMPANY_LINKS: NavLink[] = [
  { href: "/jobs/new",     label: "Post Job",     icon: <Briefcase  className="h-4 w-4" />, post: true },
  { href: "/projects/new", label: "Post Project", icon: <PlusCircle className="h-4 w-4" />, post: true },
  { href: "/freelancers",  label: "Browse",       icon: <Users      className="h-4 w-4" /> },
  { href: "/dashboard",    label: "Applications", icon: <FileText   className="h-4 w-4" /> },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFindWorkLinks(type: string | null | undefined): NavLink[] {
  if (type === "job_seeker") return JOB_SEEKER_LINKS
  if (type === "both")       return FIND_WORK_BOTH_LINKS
  return FREELANCER_LINKS
}

function getHireTalentLinks(type: string | null | undefined): NavLink[] {
  if (type === "company") return COMPANY_LINKS
  return INDIVIDUAL_HIRE_LINKS
}

function linkCls(link: NavLink, pathname: string, mobile = false) {
  const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"))
  if (mobile) {
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      link.post
        ? active ? "text-[#FCD34D] bg-[#F59E0B]/10" : "text-[#F59E0B] hover:text-[#FCD34D] hover:bg-[#F59E0B]/10"
        : active ? "text-[#818CF8] bg-[#4F46E5]/10" : "text-[#6B7280] hover:text-white hover:bg-white/5"
    }`
  }
  return `text-sm font-medium transition-colors ${
    link.post
      ? active ? "text-[#FCD34D]" : "text-[#F59E0B] hover:text-[#FCD34D] font-semibold"
      : active ? "text-[#818CF8]" : "text-[#6B7280] hover:text-white"
  }`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [user, setUser]               = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [unread, setUnread]           = useState(0)
  const [unreadMsgs, setUnreadMsgs]   = useState(0)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [navTab, setNavTab]           = useState<"find_work" | "hire_talent">("find_work")
  const mobileRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const supabase  = createClient()
  const router    = useRouter()
  const pathname  = usePathname()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) return

      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",").map(e => e.trim().toLowerCase())
      setIsAdmin(adminEmails.includes((user.email ?? "").toLowerCase()))

      supabase.from("profiles")
        .select("full_name,avatar_url,user_roles,find_work_type,hire_talent_type,verification_status")
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

      channel = supabase.channel("navbar-rt")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
          () => setUnreadMsgs(p => p + 1))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
          () => supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false).then(({ count }) => setUnreadMsgs(count ?? 0)))
        .subscribe()
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

  // ── Role resolution ─────────────────────────────────────────────────────────
  const rawRoles      = (profile?.user_roles as string[] | null) ?? []
  const isFindWork    = user ? (rawRoles.includes("find_work") || rawRoles.length === 0) : false
  const isHireTalent  = user ? rawRoles.includes("hire_talent") : false
  const isBoth        = isFindWork && isHireTalent
  const findWorkType  = profile?.find_work_type   // 'freelancer' | 'job_seeker' | 'both'
  const hireTalentType = profile?.hire_talent_type // 'individual' | 'company'

  // ── Active nav links ────────────────────────────────────────────────────────
  const navLinks: NavLink[] = (() => {
    if (!user) return []
    if (isBoth) {
      return navTab === "find_work"
        ? getFindWorkLinks(findWorkType)
        : getHireTalentLinks(hireTalentType)
    }
    if (isHireTalent) return getHireTalentLinks(hireTalentType)
    return getFindWorkLinks(findWorkType)
  })()

  const initial   = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
  const firstName = profile?.full_name?.split(" ")[0] || "Account"

  // ── Tab switcher (both roles) ───────────────────────────────────────────────
  const TabSwitcher = () => (
    <div className="flex items-center bg-[#12121A] border border-[#1E1E2E] rounded-xl p-0.5 gap-0.5">
      <button
        onClick={() => setNavTab("find_work")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          navTab === "find_work"
            ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20"
            : "text-[#6B7280] hover:text-white"
        }`}
      >
        <Search className="h-3 w-3" /> Find Work
      </button>
      <button
        onClick={() => setNavTab("hire_talent")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          navTab === "hire_talent"
            ? "bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20"
            : "text-[#6B7280] hover:text-white"
        }`}
      >
        <Building2 className="h-3 w-3" /> Hire Talent
      </button>
    </div>
  )

  return (
    <>
      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        userName={profile?.full_name ?? undefined}
        userEmail={user?.email ?? undefined}
      />

      <nav className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#1E1E2E]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.png" width={140} height={38} alt="GigWay" priority
              className="object-contain" style={{ maxHeight: "38px", width: "auto" }} />
          </Link>

          {/* Desktop center — tab switcher + links */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
            {user && isBoth && <TabSwitcher />}

            {user ? (
              <div className="flex items-center gap-5">
                {navLinks.map((link, i) => (
                  <Link key={`${link.href}-${i}`} href={link.href} className={linkCls(link, pathname)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-white transition-colors flex items-center gap-1.5">
                  <Search className="h-4 w-4" /> Find Work
                </Link>
                <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-white transition-colors flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Hire Talent
                </Link>
              </div>
            )}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button size="sm" className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold gap-1.5 text-xs px-3 h-8 rounded-lg shadow-lg shadow-[#F97316]/20">
                      <Crown className="h-3.5 w-3.5" /> Admin
                    </Button>
                  </Link>
                )}

                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-white hover:bg-white/5 relative h-9 w-9">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMsgs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadMsgs > 9 ? "9+" : unreadMsgs}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-white hover:bg-white/5 relative h-9 w-9">
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
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-[#6366F1] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {profile?.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : initial}
                      </div>
                      <span className="text-white text-sm max-w-[72px] truncate">{firstName}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-[#12121A] border-[#1E1E2E] text-white">
                    <div className="px-3 py-2 text-xs text-[#6B7280] truncate">{user.email}</div>
                    {/* Role chips */}
                    <div className="px-3 pb-2 flex gap-1 flex-wrap">
                      {isAdmin ? (
                        <span className="text-[10px] bg-[#F97316]/15 text-[#FB923C] border border-[#F97316]/25 rounded-full px-2 py-0.5">
                          👑 Admin
                        </span>
                      ) : (
                        <>
                          {(isFindWork || rawRoles.length === 0) && (
                            <span className="text-[10px] bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/25 rounded-full px-2 py-0.5">
                              🔍 {findWorkType === "job_seeker" ? "Job Seeker" : "Freelancer"}
                            </span>
                          )}
                          {isHireTalent && (
                            <span className="text-[10px] bg-[#F59E0B]/15 text-[#FCD34D] border border-[#F59E0B]/25 rounded-full px-2 py-0.5">
                              👔 {hireTalentType === "company" ? "Company" : "Client"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-[#1E1E2E]" />
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-2"><User className="h-4 w-4" /> My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/profile/edit" className="flex items-center gap-2"><Edit className="h-4 w-4" /> Edit Profile</Link>
                    </DropdownMenuItem>
                    {!isAdmin && profile?.verification_status !== "approved" && (
                      <DropdownMenuItem asChild className="hover:bg-[#4F46E5]/10 cursor-pointer">
                        <Link href="/verify" className="flex items-center gap-2 text-[#818CF8]">
                          <ShieldCheck className="h-4 w-4" /> Get Verified
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                      <Link href="/saved" className="flex items-center gap-2"><Bookmark className="h-4 w-4" /> Saved Items</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSupportOpen(true)}
                      className="hover:bg-white/5 cursor-pointer flex items-center gap-2"
                    >
                      <Headphones className="h-4 w-4" /> Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1E1E2E]" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 cursor-pointer flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
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
                <Button variant="ghost" size="icon" className="relative text-[#6B7280] hover:text-white h-9 w-9">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Button ref={toggleRef} variant="ghost" size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-[#6B7280] hover:text-white h-9 w-9">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div ref={mobileRef} className="md:hidden border-t border-[#1E1E2E] bg-[#0A0A0F]">
            <div className="container mx-auto px-4 py-4 space-y-1">

              {/* Tab switcher mobile */}
              {user && isBoth && (
                <div className="flex gap-2 pb-3">
                  <button
                    onClick={() => setNavTab("find_work")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      navTab === "find_work" ? "bg-[#4F46E5] text-white" : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280]"
                    }`}
                  >
                    <Search className="h-4 w-4" /> Find Work
                  </button>
                  <button
                    onClick={() => setNavTab("hire_talent")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      navTab === "hire_talent" ? "bg-[#F59E0B] text-black" : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280]"
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Hire Talent
                  </button>
                </div>
              )}

              {/* Nav links */}
              {user ? (
                <>
                  {navLinks.map((link, i) => (
                    <Link key={`${link.href}-m-${i}`} href={link.href} className={linkCls(link, pathname, true)}>
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}

                  <div className="border-t border-[#1E1E2E] pt-3 mt-3 space-y-1">
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F97316]/10 text-[#F97316] font-bold text-sm">
                        <Crown className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                      <MessageSquare className="h-4 w-4" />
                      Messages
                      {unreadMsgs > 0 && (
                        <span className="ml-auto bg-[#4F46E5] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadMsgs > 9 ? "9+" : unreadMsgs}
                        </span>
                      )}
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link href="/profile/edit" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                      <Edit className="h-4 w-4" /> Edit Profile
                    </Link>
                    {!isAdmin && profile?.verification_status !== "approved" && (
                      <Link href="/verify" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#818CF8] hover:text-white hover:bg-[#4F46E5]/10 text-sm">
                        <ShieldCheck className="h-4 w-4" /> Get Verified
                      </Link>
                    )}
                    <Link href="/saved" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                      <Bookmark className="h-4 w-4" /> Saved Items
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
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Search className="h-4 w-4" /> Find Work
                  </Link>
                  <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                    <Building2 className="h-4 w-4" /> Hire Talent
                  </Link>
                  <div className="border-t border-[#1E1E2E] pt-3 mt-3 flex flex-col gap-2">
                    <Link href="/login">
                      <Button variant="outline" className="w-full border-[#1E1E2E] text-white hover:bg-white/5">Sign In</Button>
                    </Link>
                    <Link href="/login">
                      <Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold">Get Started</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
