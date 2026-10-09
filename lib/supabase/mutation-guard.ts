import type { SupabaseClient } from "@supabase/supabase-js"

// Application defense only. Direct browser REST/storage still require audited RLS.
// Lifetime is the request-scoped server client; no cross-user/global cache.
export function mutationGuard(db: SupabaseClient, baseFetch: typeof fetch): typeof fetch {
  const originalGetUser = db.auth.getUser.bind(db.auth)
  let identity: ReturnType<typeof originalGetUser> | undefined
  const verifiedIdentity = async () => {
    const result = await originalGetUser()
    if (!result.data.user || result.error) return result
    const profile = await db.from("own_profiles").select("is_banned").eq("id", result.data.user.id).maybeSingle()
    if (profile.error || profile.data?.is_banned === true) {
      return { data: { user: null }, error: { name: "AccountAccessDenied", message: "This account cannot perform this action.", status: profile.error ? 503 : 403 } } as unknown as Awaited<ReturnType<typeof originalGetUser>>
    }
    return result
  }
  db.auth.getUser = ((jwt?: string) => jwt ? originalGetUser(jwt) : (identity ??= verifiedIdentity())) as typeof db.auth.getUser
  return async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase()
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(method) && (url.pathname.startsWith("/rest/v1/") || url.pathname.startsWith("/storage/v1/object/"))
    if (!mutation) return baseFetch(input, init)
    const deny = (message: string, status: number) => Response.json({ message, code: "mutation_denied" }, { status })
    try {
      const { data: { user }, error } = await db.auth.getUser()
      if (error || !user) return deny(error?.message || "Sign in to perform this action.", error?.name === "AccountAccessDenied" ? error.status || 403 : 401)
      // Fresh stored status for every write, never user-editable JWT metadata.
      const profile = await db.from("own_profiles").select("is_banned").eq("id", user.id).maybeSingle()
      if (profile.error) return deny("Account status could not be verified. Please try again.", 503)
      if (profile.data?.is_banned === true) return deny("This account cannot perform this action.", 403)
      // An account without its initial profile can complete identity setup.
      // Existing RLS remains authoritative about which profile/avatar it can write.
      const identitySetup = url.pathname === "/rest/v1/profiles" && method === "POST" || url.pathname.startsWith("/storage/v1/object/avatars/")
      if (!profile.data && !identitySetup) return deny("Complete your professional profile before performing this action.", 403)
      return baseFetch(input, init)
    } catch { return deny("Account status could not be verified. Please try again.", 503) }
  }
}
