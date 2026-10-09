import { cache } from "react"
import { createServerClient } from "@supabase/ssr"
import { boundedFetch } from "@/lib/async"
import { cookies } from "next/headers"
import { mutationGuard } from "./mutation-guard"

// React cache is scoped to the current server render, never shared across users.
export const createClient = cache(async () => {
  const cookieStore = await cookies()
  let guardedFetch: typeof fetch = boundedFetch
  const requestFetch: typeof fetch = (input, init) => guardedFetch(input, init)
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: requestFetch },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Server components can't set cookies — middleware handles refresh
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch {
            // Server components can't set cookies — middleware handles refresh
          }
        },
      },
    }
  )
  guardedFetch = mutationGuard(db, boundedFetch)
  return db
})
