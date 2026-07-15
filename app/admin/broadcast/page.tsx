import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Megaphone } from "lucide-react"
import BroadcastClient from "@/components/admin/BroadcastClient"

export const metadata: Metadata = { title: "Admin — Broadcast — GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  // Count users in each target group
  const [
    { count: allCount },
    { count: boostedCount },
  ] = await Promise.all([
    adminDb.from("profiles").select("id", { count: "exact", head: true }),
    adminDb.from("profiles").select("id", { count: "exact", head: true }).eq("is_boosted", true),
  ])

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-[#F97316]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Broadcast Message</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">Send notifications to all or targeted users</p>
          </div>
        </div>

        <BroadcastClient
          counts={{ all: allCount ?? 0, boosted: boostedCount ?? 0 }}
        />
      </div>
    </div>
  )
}
