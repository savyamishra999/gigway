"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuthUi } from "@/components/layout/AuthUiProvider"
import { boundedFetch } from "@/lib/async"
type Activity = { messages: number; notifications: number; recentMessages: { id: string; sender_id: string; sender_name: string; created_at: string }[] }
const Context = createContext<Activity | null>(null)
export const useActivity = () => useContext(Context)
export const refreshActivity = () => window.dispatchEvent(new Event("gigway:activity"))
export default function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUi()
  const [state, setState] = useState<{ owner: string; data: Activity } | null>(null)
  useEffect(() => {
    if (!user) return
    let active = true, busy = false
    const controller = new AbortController()
    const refresh = async () => {
      if (busy || document.visibilityState !== "visible") return
      busy = true
      try {
        const response = await boundedFetch("/api/activity", { signal: controller.signal })
        if (!response.ok) throw Error()
        const data = await response.json()
        if (active) setState({ owner: user.id, data })
      } catch { if (active) setState(null) }
      finally { busy = false }
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 30000)
    window.addEventListener("gigway:activity", refresh)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener("gigway:activity", refresh); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh) }
  }, [user?.id])
  return <Context.Provider value={state?.owner === user?.id ? state?.data || null : null}>{children}</Context.Provider>
}
export function ActivityBadge({ kind }: { kind: "messages" | "notifications" }) {
  const data = useActivity(), count = data ? data[kind] + (kind === "notifications" ? data.messages : 0) : 0
  return count ? <span aria-label={`${count} unread ${kind === "notifications" ? "updates" : "messages"}`} className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-coral px-1 text-[9px] font-bold text-white">{count > 9 ? "9+" : count}</span> : null
}
