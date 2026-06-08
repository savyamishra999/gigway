import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, CheckCircle2 } from "lucide-react"
import AadhaarUploadForm from "@/components/verify/AadhaarUploadForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload Documents — GigWay Verification",
  description: "Upload your Aadhaar card to complete verification.",
}

export default async function VerifyMePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status, verification_paid_at, is_verified")
    .eq("id", user.id)
    .single()

  // Not paid yet → send to pricing
  if (!profile?.verification_paid_at) {
    redirect("/pricing")
  }

  // Docs already submitted — under review
  if (profile.verification_status === "pending") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FBBF24]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-[#FBBF24]" />
          </div>
          <h2 className="text-white font-black text-xl mb-2">Documents Under Review</h2>
          <p className="text-[#94A3B8] text-sm">
            Your Aadhaar has been submitted. We&apos;ll verify within 24 hours and notify you.
          </p>
        </div>
      </div>
    )
  }

  // Already verified
  if (profile.is_verified) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#4ADE80]" />
          </div>
          <h2 className="text-white font-black text-xl mb-2">Already Verified ✅</h2>
          <p className="text-[#94A3B8] text-sm">Your GigWay profile is verified.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-[#818CF8]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Upload Your Aadhaar</h1>
          <p className="text-[#94A3B8] text-sm">
            Payment received ✅ — now upload front &amp; back of your Aadhaar card to complete verification.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 justify-center flex-wrap">
          {[
            { label: "Pay ₹299", done: true },
            { label: "Upload Aadhaar", done: false, active: true },
            { label: "Admin Review", done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                s.done    ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                : s.active ? "bg-[#4F46E5]/20 text-[#818CF8] border border-[#4F46E5]/30"
                : "text-[#475569]"
              }`}>
                {s.done && "✓ "}{s.label}
              </span>
              {i < 2 && <span className="text-[#334155] text-xs">→</span>}
            </div>
          ))}
        </div>

        {/* Upload form */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <AadhaarUploadForm />
        </div>

        <p className="text-[#475569] text-xs text-center mt-5">
          Documents are stored securely and reviewed only by GigWay admins.
          We never share your Aadhaar with employers or freelancers.
        </p>
      </div>
    </div>
  )
}
