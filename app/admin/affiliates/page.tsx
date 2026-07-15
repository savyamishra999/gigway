import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ArrowLeft } from "lucide-react"
import AdminAffiliatesClient from "@/components/admin/AdminAffiliatesClient"

export const metadata: Metadata = {
  title: "Admin — Affiliates — GigWay",
  description: "Manage GigWay affiliate applications and payouts",
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com").split(",").map(e => e.trim())

const adminDb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminAffiliatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/")

  const [
    { data: pending },
    { data: approved },
    { data: payoutsRaw },
  ] = await Promise.all([
    adminDb.from("affiliates")
      .select("id,name,email,phone,platform_link,how_promote,ref_code,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminDb.from("affiliates")
      .select("id,name,email,ref_code,total_earnings,commission_rate,created_at")
      .eq("status", "approved")
      .order("total_earnings", { ascending: false }),
    adminDb.from("affiliate_payouts")
      .select("id,amount,upi_id,status,created_at,paid_at,affiliates:affiliate_id(name,email)")
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  // Supabase returns join as array; flatten to single object for type safety
  const payouts = (payoutsRaw ?? []).map(p => ({
    ...p,
    affiliates: Array.isArray(p.affiliates) ? (p.affiliates[0] ?? null) : p.affiliates,
  })) as Array<{ id: string; amount: number; upi_id: string | null; status: string; created_at: string; paid_at: string | null; affiliates: { name: string; email: string } | null }>

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-[#6B7280] hover:text-white text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Affiliates</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">
              {(pending ?? []).length} pending · {(approved ?? []).length} approved
            </p>
          </div>
        </div>

        <AdminAffiliatesClient
          pending={pending ?? []}
          approved={approved ?? []}
          payouts={payouts ?? []}
        />
      </div>
    </div>
  )
}
