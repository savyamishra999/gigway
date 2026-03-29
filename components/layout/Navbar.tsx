"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, User, LogOut, ChevronDown, Menu, X, LayoutDashboard, MessageSquare, Edit, Zap, Bookmark, Sparkles, Gift } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Profile { full_name: string | null; avatar_url?: string | null }

const NAV_LINKS = [
  { href: "/gigs",        label: "Gigs"        },
  { href: "/projects",    label: "Projects"    },
  { href: "/jobs",        label: "Jobs"        },
  { href: "/freelancers", label: "Freelancers" },
  { href: "/explore",     label: "Explore"     },
]

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unread, setUnread] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).single()
          .then(({ data }) => setProfile(data))
        supabase.from("notifications").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnread(count ?? 0))
        supabase.from("messages").select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id).eq("is_read", false)
          .then(({ count }) => setUnreadMsgs(count ?? 0))

        // Realtime: new messages
        channel = supabase.channel("navbar-msgs")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
            filter: `receiver_id=eq.${user.id}` }, () => {
            setUnreadMsgs(prev => prev + 1)
          })
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages",
            filter: `receiver_id=eq.${user.id}` }, () => {
            supabase.from("messages").select("id", { count: "exact", head: true })
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
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    router.push("/"); router.refresh()
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
  const firstName = profile?.full_name?.split(" ")[0] || "Account"

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#1E1E2E]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black bg-gradient-to-r from-[#4F46E5] to-[#F97316] bg-clip-text text-transparent flex-shrink-0">
          GigWAY
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(link.href) ? "text-[#818CF8]" : "text-[#6B7280] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
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
                    <Link href="/refer" className="flex items-center gap-2"><Gift className="h-4 w-4" /> Refer & Earn</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                    <Link href="/buy-connects" className="flex items-center gap-2"><Zap className="h-4 w-4" /> Buy Connects</Link>
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
                <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-white hover:bg-white/5">Sign In</Button>
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
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}
            className="text-[#6B7280] hover:text-white hover:bg-white/5">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t border-[#1E1E2E] bg-[#0A0A0F]">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-[#4F46E5]/10 text-[#818CF8]"
                    : "text-[#6B7280] hover:text-white hover:bg-white/5"
                }`}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="border-t border-[#1E1E2E] pt-3 mt-3 space-y-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:text-white hover:bg-white/5 text-sm">
                  <MessageSquare className="h-4 w-4" /> Messages
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
                  <Gift className="h-4 w-4" /> Refer & Earn
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm w-full">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="border-t border-[#1E1E2E] pt-3 mt-3 flex flex-col gap-2">
                <Link href="/login"><Button variant="outline" className="w-full border-[#1E1E2E] text-white hover:bg-white/5">Sign In</Button></Link>
                <Link href="/login"><Button className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white font-bold">Get Started</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
