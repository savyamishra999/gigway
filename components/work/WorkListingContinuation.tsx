"use client"
import { useEffect, useRef, useState } from "react"
import { withDeadline } from "@/lib/async"

type Query<T> = { range(from: number, to: number): Query<T>; abortSignal(signal: AbortSignal): Query<T> } & PromiseLike<{ data: T[] | null; error: unknown }>
// Scan bounded batches without discarding matches beyond the former first-page cap.
export async function workListingBatch<T>(query: () => Query<T>, matches: (item: T) => boolean, offset: number, size: number, signal: AbortSignal) {
  let next = offset, items: T[] = [], hasMore = true
  for (let scan = 0; scan < 4 && !items.length && hasMore; scan++) {
    const result = await withDeadline(query().range(next, next + size).abortSignal(signal))
    if (signal.aborted) throw new Error("Request cancelled")
    if (result.error) throw new Error("Listings could not be loaded")
    const rows = result.data || []
    hasMore = rows.length > size
    const batch = rows.slice(0, size)
    items = batch.filter(matches)
    next += batch.length
  }
  return { items, nextOffset: next, hasMore }
}
export function useWorkListings<T extends { id: string }>(initial: T[], initialHasMore: boolean, key: string, query: () => Query<T>, matches: (item: T) => boolean, size: number) {
  const [items, setItems] = useState(initial), [loading, setLoading] = useState(false), [error, setError] = useState("")
  const [more, setMore] = useState(initialHasMore), [offset, setOffset] = useState(initial.length)
  const active = useRef<AbortController | null>(null), generation = useRef(0)
  const load = async (reset = false) => {
    if (!reset && (active.current || !more)) return
    active.current?.abort(); const controller = new AbortController(), token = ++generation.current
    active.current = controller; setLoading(true); setError("")
    try {
      const page = await workListingBatch(query, matches, reset ? 0 : offset, size, controller.signal)
      if (token !== generation.current || controller.signal.aborted) return
      setItems(current => [...new Map([...(reset ? [] : current), ...page.items].map(item => [item.id, item])).values()])
      setOffset(page.nextOffset); setMore(page.hasMore)
    } catch { if (token === generation.current && !controller.signal.aborted) setError("Listings could not be loaded. Please try again.") }
    finally { if (token === generation.current) { active.current = null; setLoading(false) } }
  }
  useEffect(() => {
    generation.current++; active.current?.abort(); active.current = null
    setLoading(false); setError("")
    if (!key) { setItems(initial); setOffset(initial.length); setMore(initialHasMore) }
    else { setItems([]); setMore(true); setOffset(0); void load(true) }
    return () => { generation.current++; active.current?.abort(); active.current = null }
  }, [key, initial, initialHasMore]) // eslint-disable-line react-hooks/exhaustive-deps
  return { items, loading, error, hasMore: more, loadMore: () => load(false), retry: () => load(!items.length) }
}
export function WorkListingContinuation({ loading, error, hasMore, loadMore, retry }: { loading: boolean; error: string; hasMore: boolean; loadMore: () => unknown; retry: () => unknown }) {
  return <div className="mt-5 space-y-3">{error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" onClick={() => void retry()} className="underline">Retry</button></p>}{hasMore && <><p className="text-xs text-brand-slate">Showing loaded listings. More matches may be in older batches.</p><button type="button" disabled={loading} onClick={() => void loadMore()} className="w-full rounded-xl bg-brand-indigo px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Loading…" : "Load more listings"}</button></>}</div>
}
