import "server-only"
import { createClient } from "@supabase/supabase-js"
import { normalizeUsername, usernameError } from "@/lib/identity"

export const USERNAME_UNAVAILABLE = "That username is unavailable. Please choose another."

// Check both namespaces, including rows hidden by session RLS. Only availability
// leaves the server. This cannot guarantee atomic uniqueness across two tables.
export async function checkUsernameClaim(value: unknown, current?: { table: "profiles" | "organizations"; id: string }) {
  const username = normalizeUsername(typeof value === "string" ? value : "")
  const invalid = usernameError(username)
  if (invalid) return { username, error: invalid, status: 400 }
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    // Escape LIKE's underscore wildcard so a_b never matches axb.
    const pattern = username.replace(/_/g, "\\_")
    const results = await Promise.all((["profiles", "organizations"] as const).map(async table => {
      let query = db.from(table).select("id").ilike("username", pattern)
      if (current?.table === table) query = query.neq("id", current.id)
      return query.limit(1)
    }))
    if (results.some(result => result.error)) return { username, error: "Could not check username availability. Please try again.", status: 503 }
    if (results.some(result => result.data?.length)) return { username, error: USERNAME_UNAVAILABLE, status: 409 }
    return { username, error: null, status: 200 }
  } catch {
    return { username, error: "Could not check username availability. Please try again.", status: 503 }
  }
}
