"use client"
import { PROFILE_TABS, type ProfileTab } from "@/lib/profile/tabs"
import { boundedFetch } from "@/lib/async"
import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { BriefcaseBusiness, Loader2, Package, Repeat2, Building2 } from "lucide-react"
import { PostCard, type FeedItem, type MarketplaceShare, type Post } from "@/components/social/SocialHomeFeed"

export default function ProfileSocialFeed({ profileId, name, isOwner = false, initialTab = "gigthoughts", workPreview }: { profileId: string; name: string; isOwner?: boolean; initialTab?: ProfileTab; workPreview?: ReactNode }) {
  type ContentTab = "gigthoughts" | "reposts"
  type Page = { items: FeedItem[]; nextCursor: string | null; loaded: boolean; failed?: boolean }
  const blank = (): Page => ({ items: [], nextCursor: null, loaded: false })
  const fresh = () => ({ profileId, pages: { gigthoughts: blank(), reposts: blank() } })
  const [tab, setTab] = useState<ProfileTab>(initialTab)
  const [cache, setCache] = useState(fresh)
  const [loading, setLoading] = useState(false), [error, setError] = useState(false)
  const request = useRef<AbortController | null>(null), generation = useRef(0)
  const activeTab = cache.profileId === profileId ? tab : initialTab
  const page = activeTab === "work" || cache.profileId !== profileId ? blank() : cache.pages[activeTab]
  const load = async (reset = false) => {
    if (activeTab === "work" || request.current || (!reset && page.loaded && !page.nextCursor)) return
    const contentTab: ContentTab = activeTab, controller = new AbortController(), token = ++generation.current
    request.current = controller; setLoading(true); setError(false)
    try {
      const cursor = reset ? null : page.nextCursor
      const response = await boundedFetch(`/api/social/profiles/${profileId}/posts?currentProduct=1&tab=${contentTab}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { signal: controller.signal })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.items)) throw Error("Invalid posts response")
      if (token !== generation.current) return
      setCache(current => current.profileId !== profileId ? current : ({ ...current, pages: { ...current.pages, [contentTab]: { items: reset ? data.items : [...current.pages[contentTab].items, ...data.items], nextCursor: data.nextCursor || null, loaded: true } } }))
    } catch {
      if (token !== generation.current || controller.signal.aborted) return
      setError(true)
      setCache(current => current.profileId !== profileId ? current : ({ ...current, pages: { ...current.pages, [contentTab]: { ...current.pages[contentTab], loaded: true, failed: true } } }))
    } finally { if (token === generation.current) { request.current = null; setLoading(false) } }
  }
  useEffect(() => { setCache(fresh()); setTab(initialTab) }, [profileId, initialTab]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setError(!!page.failed); setLoading(false)
    if (activeTab !== "work" && !page.loaded) void load()
    return () => { generation.current++; request.current?.abort(); request.current = null }
  }, [profileId, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps
  const tabs = PROFILE_TABS, items = page.items, active = tabs.find(item => item.value === activeTab)!
  const createHref = activeTab === "gigthoughts" ? "/social/create" : null
  const renderPost = (post: Post) => <PostCard post={post} onRefresh={() => void load(true)} />
  return <section className="mt-6"><div role="tablist" aria-label="Profile content" className="grid grid-cols-3 gap-1 rounded-xl bg-white/[.06] p-1">{tabs.map(item => <button key={item.value} type="button" role="tab" id={`profile-tab-${item.value}`} aria-selected={activeTab === item.value} aria-controls={`profile-panel-${item.value}`} tabIndex={activeTab === item.value ? 0 : -1} onKeyDown={event => { const index = tabs.findIndex(candidate => candidate.value === activeTab); const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1; if (next < 0) return; event.preventDefault(); setTab(tabs[next].value); event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus() }} onClick={() => setTab(item.value)} className={`min-h-11 min-w-0 rounded-lg px-1 py-2 text-xs sm:text-sm font-bold transition-colors ${activeTab === item.value ? "bg-[#6D5DFB] text-white" : "text-[#CBD5E1] hover:bg-white/[.05]"}`}>{item.label}</button>)}</div><div role="tabpanel" id={`profile-panel-${activeTab}`} aria-labelledby={`profile-tab-${activeTab}`} className="mt-4 space-y-4">{activeTab === "work" ? workPreview : <>{items.map(item => { if ("type" in item && item.type === "marketplace_share") { const share = item as MarketplaceShare; const label = `${share.verb === "shared" ? "Shared" : "Reposted"} a ${share.object.type === "service" ? "Service" : share.object.type[0].toUpperCase() + share.object.type.slice(1)}`, Icon = share.object.type === "job" ? BriefcaseBusiness : share.object.type === "project" ? Building2 : Package; return <div key={share.shareId}><p className="mb-2 flex items-center gap-1.5 text-xs text-[#9EA6B8]"><Repeat2 className="h-3.5 w-3.5" />{name} {label.toLowerCase()}</p><Link prefetch={false} href={share.object.href} className="block max-w-full rounded-2xl bg-white/[.035] p-4 ring-1 ring-white/8 hover:bg-white/[.06]"><div className="flex min-w-0 gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6D5DFB]/15 text-[#B9B3FF]"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-bold text-white">{share.object.title}</p><p className="mt-1 line-clamp-2 text-xs text-[#B8C0D0]">{share.object.subtitle}</p></div></div><p className="mt-3 text-xs font-bold text-[#B9B3FF]">{share.object.cta}</p></Link></div> } const repost = "type" in item ? item : null, post = (repost ? repost.originalPost : item) as Post; return <div key={repost ? `r-${repost.repostedAt}-${post.id}` : post.id}>{repost && <p className="mb-2 flex items-center gap-1 text-xs text-[#9EA6B8]"><Repeat2 className="h-3.5 w-3.5" />{name} reposted</p>}{renderPost(post)}</div> })}{loading && <Loader2 className="mx-auto animate-spin text-[#A99FFF]" />}{error && <div role="alert" className="text-sm text-[#B8C0D0]">Posts could not be loaded. <button onClick={() => void load(true)} className="underline">Try again</button></div>}{!loading && !error && !items.length && <div className="rounded-xl bg-white/[.035] p-4 text-sm text-[#B8C0D0]"><p>{active.empty}</p>{isOwner && createHref && <Link href={createHref!} className="mt-2 inline-block font-bold text-[#B9B3FF]">Share your first GigThought</Link>}</div>}{!loading && page.nextCursor && <button type="button" onClick={() => void load()} className="w-full rounded-xl bg-white/[.06] py-3 text-sm font-bold text-[#B9B3FF] hover:bg-white/[.1]">Load more</button>}</>}</div></section>
}
