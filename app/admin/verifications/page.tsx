import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PendingVerificationList from "@/components/admin/PendingVerificationList"
import { ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Verifications | GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase())

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) redirect("/dashboard")

  const { data: pending } = await supabase
    .from("profiles")
    .select("id, full_name, phone, verification_doc, avatar_url, created_at")
    .eq("verification_status", "pending")
    .not("verification_doc", "is", null)
    .order("created_at", { ascending: true })

  const { count: totalVerified } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)

  const { count: totalPending } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "pending")

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#818CF8]" />
          </div>
          <h1 className="text-2xl font-black text-white">Verification Admin</h1>
        </div>
        <p className="text-[#6B7280] text-sm mb-8">
          Approve or reject freelancer identity verification requests
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">{totalPending ?? 0}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Pending Review</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[#4ADE80]">{totalVerified ?? 0}</p>
            <p className="text-[#94A3B8] text-sm mt-1">Verified Freelancers</p>
          </div>
        </div>

        {/* Pending list */}
        <h2 className="text-white font-bold text-lg mb-4">
          Pending ({pending?.length ?? 0})
        </h2>
        <PendingVerificationList pending={pending ?? []} />
      </div>
    </div>
  )
}
