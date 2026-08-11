"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, BriefcaseBusiness, CirclePlus, Compass, Home, Menu, MessageSquare, Search, UserRound, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Discover", icon: Compass },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/projects", label: "Projects", icon: Compass },
  { href: "/gigs", label: "Gigs", icon: CirclePlus },
]

export default function ModernNavbar() {
  const supabase = createClient(); const pathname = usePathname(); const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null); const [profile, setProfile] = useState<{ full_name?: string | null; username?: string | null; avatar_url?: string | null } | null>(null); const [open, setOpen] = useState(false)
  useEffect(() => { supabase.auth.getUser().then(async ({ data: { user } }) => { setUser(user); if (user) { const { data } = await supabase.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle(); setProfile(data) } }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const homeHref = user ? "/home" : "/"
  const resolveHref = (href: string) => href === "/" ? homeHref : href
  const active = (href: string) => href === "/" ? pathname === homeHref : pathname.startsWith(href)
  const avatar = profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "G"}</span>
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh() }
  return <><header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090d]/80 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4"><Link href="/" className="shrink-0"><Image src="/logo.png" alt="GigWay" width={122} height={34} className="h-auto w-auto" /></Link><nav className="hidden lg:flex items-center gap-1">{links.map(({ href, label }) => <Link key={href} href={resolveHref(href)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active(href) ? "bg-white/8 text-white" : "text-[#9CA3AF] hover:text-white"}`}>{label}</Link>)}</nav><Link href="/explore" className="hidden md:flex ml-auto max-w-sm flex-1 items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-sm text-[#7C8498] hover:bg-white/10"><Search className="h-4 w-4" /> Search people, work and opportunities</Link><div className="ml-auto flex items-center gap-1 md:ml-0">{user ? <><Link aria-label="Create" href="/create" className="hidden sm:flex rounded-lg p-2.5 text-[#FB923C] hover:bg-orange-400/10"><CirclePlus className="h-5 w-5" /></Link><Link aria-label="Messages" href="/messages" className="rounded-lg p-2.5 text-[#A8B0C0] hover:bg-white/8 hover:text-white"><MessageSquare className="h-5 w-5" /></Link><Link aria-label="Notifications" href="/notifications" className="rounded-lg p-2.5 text-[#A8B0C0] hover:bg-white/8 hover:text-white"><Bell className="h-5 w-5" /></Link><button onClick={() => setOpen(!open)} aria-label="Account menu" className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-[#6D5DFB] to-[#F97316] text-sm font-bold text-white">{avatar}</button></> : <Link href="/login" className="rounded-xl bg-[#6256e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7165f0]">Join GigWay</Link>}<button onClick={() => setOpen(!open)} className="lg:hidden rounded-lg p-2 text-[#A8B0C0]" aria-label="Menu">{open ? <X /> : <Menu />}</button></div></div>{open && <div className="border-t border-white/5 bg-[#0d0d13] px-4 py-3 lg:absolute lg:right-4 lg:top-14 lg:w-56 lg:rounded-xl lg:border"><div className="lg:hidden grid gap-1">{links.map(({ href, label }) => <Link key={href} href={resolveHref(href)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-[#CBD5E1]">{label}</Link>)}</div>{user && <div className="mt-2 border-t border-white/5 pt-2"><Link href="/profile" className="block rounded-lg px-3 py-2 text-sm text-white">{profile?.full_name || "My profile"}</Link><Link href="/profile/edit" className="block rounded-lg px-3 py-2 text-sm text-[#CBD5E1]">Edit profile</Link><button onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#FB923C]">Sign out</button></div>}</div>}</header>{user && <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#101016]/95 px-2 py-2 backdrop-blur lg:hidden">{[{href:"/home",label:"Home",icon:Home},{href:"/explore",label:"Discover",icon:Compass},{href:"/create",label:"Create",icon:CirclePlus},{href:"/jobs",label:"Jobs",icon:BriefcaseBusiness},{href:"/profile",label:"Profile",icon:UserRound}].map(item => { const Icon=item.icon; return <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 text-[10px] ${pathname===item.href||pathname.startsWith(item.href+"/") ? "text-[#A99FFF]" : "text-[#8991a3]"}`}><Icon className={`h-5 w-5 ${item.label === "Create" ? "rounded-full bg-[#F97316] p-1 text-white h-7 w-7 -mt-4 shadow-lg shadow-orange-500/30" : ""}`} />{item.label}</Link>})}</nav>}</>
}
