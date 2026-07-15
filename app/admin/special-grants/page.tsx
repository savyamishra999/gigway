import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Gift } from "lucide-react"
import SpecialGrantsClient from "@/components/admin/SpecialGrantsClient"

export const metadata: Metadata = { title: "Admin — Special Grants — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SpecialGrantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const { data: history } = await adminDb
    .from("admin_grants")
    .select("id, grant_type, note, granted_at, profiles:user_id(full_name, email)")
    .order("granted_at", { ascending: false })
    .limit(50)

  type GrantRow = {
    id: string; grant_type: string; note: string | null; granted_at: string
    profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
  }

  const grants = ((history ?? []) as unknown as GrantRow[]).map(g => {
    const p = Array.isArray(g.profiles) ? g.profiles[0] : g.profiles
    return { ...g, user_name: p?.full_name ?? null, user_email: p?.email ?? null }
  })

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Special Grants</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">Grant badges, boosts, and access directly to users</p>
          </div>
        </div>

        <SpecialGrantsClient history={grants} adminId={user.id} />
      </div>
    </div>
  )
}
