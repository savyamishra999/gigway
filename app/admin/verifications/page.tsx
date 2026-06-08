import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import VerificationReviewList from "@/components/admin/VerificationReviewList"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Verifications | GigWay" }

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

const BUCKET = "verification-docs"

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) redirect("/dashboard")

  const { data: pending } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,aadhaar_front_url,aadhaar_back_url,verification_paid_at,created_at")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true })

  // Generate signed URLs (1 hour) for each document
  const pendingWithUrls = await Promise.all(
    (pending ?? []).map(async p => {
      let frontUrl: string | null = null
      let backUrl:  string | null = null

      if (p.aadhaar_front_url) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(p.aadhaar_front_url, 3600)
        frontUrl = data?.signedUrl ?? null
      }
      if (p.aadhaar_back_url) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(p.aadhaar_back_url, 3600)
        backUrl = data?.signedUrl ?? null
      }

      return { ...p, frontUrl, backUrl }
    })
  )

  const [{ count: totalPending }, { count: totalVerified }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("is_verified", true),
  ])

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Verifications</h1>
            <p className="text-[#6B7280] text-xs mt-0.5">Review Aadhaar documents and approve or reject</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-[#FBBF24]">{totalPending ?? 0}</p>
            <p className="text-[#6B7280] text-sm mt-1">Pending Review</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-[#4ADE80]">{totalVerified ?? 0}</p>
            <p className="text-[#6B7280] text-sm mt-1">Verified Freelancers</p>
          </div>
        </div>

        {/* Review list */}
        <VerificationReviewList pending={pendingWithUrls} />
      </div>
    </div>
  )
}
