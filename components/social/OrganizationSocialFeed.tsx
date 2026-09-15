"use client"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { PostCard, type Post } from "@/components/social/SocialHomeFeed"

export default function OrganizationSocialFeed({ organizationId, isAdmin, preview = false }: { organizationId: string; isAdmin: boolean; preview?: boolean }) {
  const [items, setItems] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(false)
    fetch(`/api/social/organizations/${organizationId}/posts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error(); return response.json() })
      .then(data => {
        if (controller.signal.aborted) return
        setItems(previous => cursor ? [...previous, ...data.items.filter((item: Post) => !previous.some(existing => existing.id === item.id))] : data.items)
        setNextCursor(data.nextCursor || null)
      })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [organizationId, cursor, refresh])
  const reload = () => { setCursor(null); setRefresh(value => value + 1) }
  return <div className="min-w-0 space-y-4" aria-busy={loading}>
    {(preview ? items.slice(0, 3) : items).map(post => <PostCard key={post.id} post={post} onRefresh={reload} />)}
    {loading && <Loader2 aria-label="Loading Workplace posts" className="mx-auto h-5 w-5 animate-spin text-brand-indigo" />}
    {error && <div role="alert" className="text-sm text-brand-slate"><p>Workplace posts could not be loaded.</p><button onClick={() => setRefresh(value => value + 1)} className="mt-2 rounded-lg border border-brand-borderLight px-3 py-2 font-semibold text-brand-indigo">Try again</button></div>}
    {!loading && !error && !items.length && <p className="py-4 text-sm text-brand-slate">No Workplace posts yet.</p>}
    {!preview && !loading && !error && nextCursor && <button onClick={() => setCursor(nextCursor)} className="w-full rounded-xl border border-brand-borderLight py-3 text-sm font-semibold text-brand-indigo">Load more</button>}
    {isAdmin && !preview && !loading && !error && !items.length && <p className="text-xs text-brand-slate">Use Create Post and select your Workplace in the author selector.</p>}
  </div>
}
