"use client"

import { useEffect, useState } from "react"
import { ROUTE_RECOVERY_MS } from "@/lib/async"
import RequestFailure from "./RequestFailure"

export default function RouteLoading() {
  const [expired, setExpired] = useState(false)
  useEffect(() => { const timer = setTimeout(() => setExpired(true), ROUTE_RECOVERY_MS); return () => clearTimeout(timer) }, [])
  if (expired) return <RequestFailure message="This is taking longer than expected. You can retry this page." />
  return <section aria-busy="true" className="mx-auto min-h-[40vh] max-w-5xl bg-brand-ivory px-4 py-10 text-brand-midnight"><p role="status" className="text-sm text-brand-slate">Opening your page...</p><div aria-hidden="true" className="mt-5 h-24 rounded-2xl bg-brand-indigo/5" /></section>
}
