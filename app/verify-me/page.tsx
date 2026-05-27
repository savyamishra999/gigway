import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import VerifyMeForm from "@/components/verify/VerifyMeForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Verified | GigWay",
  description: "Submit your identity document to get the GigWay verified badge.",
}

export default async function VerifyMePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status, is_verified")
    .eq("id", user.id)
    .single()

  // If they haven't paid yet, send them back
  if (!profile?.verification_status || profile.verification_status === "rejected") {
    redirect("/dashboard")
  }

  // If already verified, send them to their profile
  if (profile.is_verified || profile.verification_status === "verified") {
    redirect(`/freelancers/${user.id}`)
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-[#818CF8]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">One Last Step</h1>
          <p className="text-[#94A3B8] text-sm">
            Payment received! Submit one document to complete your verification.
          </p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
          <VerifyMeForm />
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          Reviewed by GigWay team within 24 hours · 100% private
        </p>
      </div>
    </div>
  )
}
