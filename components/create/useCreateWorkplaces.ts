"use client"
import { useEffect, useState } from "react"
import { boundedFetch } from "@/lib/async"

export type CreateWorkplace = { id: string; name: string; avatar?: string | null }
export function useCreateWorkplaces(viewerId?: string) {
  const [state, setState] = useState<{ viewerId?: string; organizations: CreateWorkplace[]; loading: boolean; error: string }>({ organizations: [], loading: true, error: "" })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!viewerId) return
    let active = true
    const controller = new AbortController()
    let deadline: ReturnType<typeof setTimeout>
    // StrictMode cleanup cancels the scheduled request before it starts.
    const start = setTimeout(async () => {
      setState({ viewerId, organizations: [], loading: true, error: "" })
      deadline = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await boundedFetch("/api/create/workplaces", { cache: "no-store", signal: controller.signal })
        const data = await response.json()
        if (!response.ok || data.viewerId !== viewerId || !Array.isArray(data.organizations)) throw Error()
        if (active) setState({ viewerId, organizations: data.organizations, loading: false, error: "" })
      } catch {
        if (active) setState({ viewerId, organizations: [], loading: false, error: "Workplaces could not be loaded." })
      } finally { clearTimeout(deadline) }
    }, 0)
    return () => { active = false; clearTimeout(start); clearTimeout(deadline); controller.abort() }
  }, [viewerId, attempt])
  const current = state.viewerId === viewerId ? state : { organizations: [], loading: true, error: "" }
  return { ...current, retry: () => setAttempt(value => value + 1) }
}
