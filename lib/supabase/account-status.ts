import "server-only"
import { createClient } from "@supabase/supabase-js"
import { boundedFetch } from "@/lib/async"

// Compatibility for the unapplied owner-view migration. Called by mutationGuard
// only after Supabase getUser verifies this identity, never with a request-body ID.
// This client is separate from the cookie-bound client and cannot change its session.
export async function readLegacyAccountStatus(verifiedUserId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { data: null, error: { message: "Account status is unavailable." } }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: boundedFetch },
  })
  // Fixed projection and equality filter; no profile/document/balance payload.
  return db.from("profiles").select("is_banned").eq("id", verifiedUserId).maybeSingle()
}
