"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // reset() alone only re-renders the boundary from its last known state; a
  // failure thrown by a Server Component's own data fetch needs the segment's
  // cache invalidated too, or "Try again" never re-issues the failed request.
  // Both must run inside the same transition — calling reset() outside it
  // clears the error before the refreshed data has arrived, so the boundary
  // re-renders the same stale/failing tree and the retry never becomes visible.
  const retry = () => startTransition(() => { router.refresh(); reset() })
  return <section role="alert" className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">We couldn’t load this page.</h1><p className="mt-3">Check your connection and try again.</p><button onClick={retry} disabled={pending} className="mt-6 rounded-xl bg-brand-indigo px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Retrying…" : "Try again"}</button><a href="/" className="ml-4 underline">Go to Home</a></section>
}
