import "server-only"
import { createClient } from "@supabase/supabase-js"
import { boundedFetch } from "@/lib/async"

// Public content never inherits a viewer's session or service-role privileges.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: boundedFetch },
  })
}
