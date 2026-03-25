"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  MessageSquare,
  Edit,
  Briefcase,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Profile {
  full_name: string | null
  avatar_url: string | null
  user_type: string | null
}

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from("profiles")
          .select("full_name, avatar_url, user_type")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setProfile(data))

        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
          .then(({ count }) => setUnreadCount(count ?? 0))
      }
    })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push("/")
    router.refresh()
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"

  const NAV_LINKS = [
    { href: "/projects", label: "Projects" },
    { href: "/freelancers", label: "Freelancers" },
    { href: "/jobs", label: "Jobs" },
    { href: "/pricing", label: "Pricing" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent flex-shrink-0"
        >
          GigWAY
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "text-[#FFD700]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Dashboard */}
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              {/* Messages */}
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 relative">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>

              {/* Notifications */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFD700] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-white/10">
                    <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-sm">
                      {initial}
                    </div>
                    <span className="text-white text-sm max-w-[100px] truncate">
                      {profile?.full_name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-[#111111] border-white/10 text-white"
                >
                  <div className="px-3 py-2 text-xs text-gray-500 truncate">{user.email}</div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link href="/profile/edit" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" /> Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold px-5"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Right */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FFD700] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t border-white/10 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <div className="border-t border-white/10 pt-3 mt-3 space-y-1">
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </Link>
                  <Link href="/jobs" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm">
                    <Briefcase className="h-4 w-4" /> Jobs
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm w-full"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
