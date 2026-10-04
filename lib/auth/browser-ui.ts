import type { SupabaseClient, User } from "@supabase/supabase-js"
import { withDeadline } from "@/lib/async"

export type AuthUiState = {
  user: User | null
  profile: { full_name?: string | null; username?: string | null; avatar_url?: string | null } | null
}

// One owner per mounted provider, never a module-level session cache. This is
// optional display state only; server routes/APIs still authorize every request.
export function observeAuthUi(db: SupabaseClient, publish: (state: AuthUiState) => void, identityChanged: (signedIn: boolean) => void) {
  let active = true, revision = 0
  let identity: string | null | undefined, pendingId: string | undefined
  let verifiedUser: User | null = null, profileRevision = 0
  const loadProfile = async (user: User, run: number) => {
    const profileRun = ++profileRevision
    try {
      const result = await withDeadline(db.from("profiles").select("full_name,username,avatar_url").eq("id", user.id).maybeSingle())
      if (active && run === revision && profileRun === profileRevision && !result.error) publish({ user, profile: result.data })
    } catch { /* Optional chrome retains the last same-account display on failure. */ }
  }
  let scheduled: ReturnType<typeof setTimeout> | undefined
  const clear = () => { verifiedUser = null; profileRevision++; revision++; clearTimeout(scheduled); publish({ user: null, profile: null }) }
  const load = async (run: number, expectedId?: string) => {
    try {
      const { data: { user }, error } = await withDeadline(db.auth.getUser())
      if (!active || run !== revision) return
      if ((error && error.name !== "AuthSessionMissingError") || (expectedId && user?.id !== expectedId)) throw Error("Account UI unavailable")
      verifiedUser = user
      identity = user?.id || null
      pendingId = undefined
      publish({ user, profile: null })
      if (user) await loadProfile(user, run)
    } catch {
      if (active && run === revision) pendingId = undefined
      // Optional identity UI must not gate useful content or retain another user.
    }
  }
  const schedule = (expectedId?: string) => {
    const run = ++revision
    clearTimeout(scheduled)
    pendingId = expectedId
    // Outside the SDK auth lock; also coalesces StrictMode setup/cleanup replay.
    scheduled = setTimeout(() => { if (active) void load(run, expectedId) }, 0)
  }
  const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
    if (!active) return
    if (event === "INITIAL_SESSION") {
      // Establish an event baseline only. Display identity still comes from
      // getUser; restoring a session is not an account switch.
      if (identity === undefined) identity = session?.user.id || null
    } else if (event === "SIGNED_OUT") {
      clear(); identity = null; pendingId = undefined
      identityChanged(false)
    } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
      const id = session?.user.id
      if (!id || (event === "SIGNED_IN" && (id === identity || id === pendingId))) return
      // SDK session recovery can emit SIGNED_IN before the initial getUser
      // settles. Redirecting then restarts recovery on every document load.
      const changed = identity !== undefined && identity !== id
      identity = id
      clear()
      if (changed) identityChanged(true)
      schedule(id)
    }
    // Display state is covered by the authoritative initial read. Token
    // refresh/same-account sign-in does not change the identity being displayed.
  })
  schedule()
  const dispose = () => { active = false; revision++; clearTimeout(scheduled); subscription.unsubscribe() }
  return Object.assign(dispose, {
    // A successful same-account profile save invalidates only display data.
    // The account guard also ignores late save responses from another account.
    refreshProfile(userId: string) {
      if (active && verifiedUser?.id === userId) return loadProfile(verifiedUser, revision)
    },
  })
}
