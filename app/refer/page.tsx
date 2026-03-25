import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Gift, Users, Zap, Copy } from "lucide-react"
import type { Metadata } from "next"
import CopyReferralButton from "@/components/refer/CopyReferralButton"

export const metadata: Metadata = {
  title: "Refer & Earn | GigWay",
  description: "Invite friends to GigWay and earn free connects for every signup.",
}

export default async function ReferPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, referral_code, connects_balance")
    .eq("id", user.id)
    .single()

  const referralCode = profile?.referral_code || user.id.slice(0, 8).toUpperCase()
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://gigway.in"}/signup?ref=${referralCode}`

  const { count: referralCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", referralCode)

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Refer & Earn</h1>
          <p className="text-[#6B7280]">Invite friends to GigWay and earn 10 free connects per signup</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
            <Users className="h-6 w-6 text-[#818CF8] mx-auto mb-2" />
            <p className="text-3xl font-black text-white">{referralCount || 0}</p>
            <p className="text-[#6B7280] text-sm">Successful Referrals</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
            <Zap className="h-6 w-6 text-[#F97316] mx-auto mb-2" />
            <p className="text-3xl font-black text-white">{(referralCount || 0) * 10}</p>
            <p className="text-[#6B7280] text-sm">Connects Earned</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">Your Referral Link</h2>
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 mb-4">
            <p className="text-[#818CF8] text-sm font-mono break-all">{referralLink}</p>
          </div>
          <CopyReferralButton referralLink={referralLink} />
        </div>

        {/* How it works */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <h2 className="text-white font-bold mb-5">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", text: "Share your referral link with friends, colleagues, or on social media" },
              { step: "2", text: "They sign up on GigWay using your link" },
              { step: "3", text: "You earn 10 free connects immediately after their signup" },
              { step: "4", text: "No limit — refer as many people as you want!" },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 border border-[#4F46E5]/30 flex items-center justify-center text-[#818CF8] font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-[#9CA3AF] text-sm mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
