import { Metadata } from "next"
import AffiliateJoinForm from "@/components/affiliate/AffiliateJoinForm"
import { CheckCircle2, TrendingUp, IndianRupee, RefreshCw } from "lucide-react"

export const metadata: Metadata = {
  title: "Earn with GigWay — Affiliate Program",
  description: "Promote GigWay and earn 20% on every sale. ₹40 per Boost · ₹60 per Verified Badge. Recurring monthly income.",
}

const PERKS = [
  { icon: IndianRupee, label: "₹40 per Boost sale",        sub: "Every ₹199 Boost you refer" },
  { icon: CheckCircle2, label: "₹60 per Verified Badge",   sub: "Every ₹299 Verified sale" },
  { icon: RefreshCw,   label: "Recurring monthly income",  sub: "Earn ₹40 every renewal month" },
  { icon: TrendingUp,  label: "Track everything live",     sub: "Clicks · Sales · Earnings" },
]

export default function AffiliateJoinPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            💸 Affiliate Program
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Earn with GigWay
          </h1>
          <p className="text-[#94A3B8] text-lg max-w-md mx-auto mb-2">
            Promote GigWay → earn <span className="text-white font-bold">20%</span> on every sale
          </p>
          <p className="text-[#6B7280] text-sm">
            Recurring income — earn every month on renewals. No cap.
          </p>
        </div>

        {/* Perk cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {PERKS.map(perk => (
            <div key={perk.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
                <perk.icon className="h-5 w-5 text-[#4ADE80]" />
              </div>
              <p className="text-white font-bold text-sm">{perk.label}</p>
              <p className="text-[#6B7280] text-xs mt-1">{perk.sub}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout: how it works + form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* How it works */}
          <div className="space-y-6">
            <h2 className="text-white font-black text-xl">How it works</h2>
            {[
              { step: "1", title: "Apply below",         desc: "Fill in your details and how you plan to promote GigWay." },
              { step: "2", title: "Get approved",        desc: "We review within 24 hours and WhatsApp you your unique referral link." },
              { step: "3", title: "Share your link",     desc: "Post on Instagram, YouTube, LinkedIn, blog — anywhere your audience is." },
              { step: "4", title: "Earn every sale",     desc: "20% commission per transaction, credited to your dashboard instantly." },
              { step: "5", title: "Withdraw anytime",    desc: "Request payout to your UPI ID. Minimum ₹500. Paid within 48 hours." },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}

            <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/20 rounded-2xl p-5 mt-4">
              <p className="text-[#4ADE80] font-bold text-sm mb-2">Commission breakdown</p>
              <div className="space-y-1.5 text-xs text-[#94A3B8]">
                <div className="flex justify-between"><span>Boost sold (₹199)</span><span className="text-white font-semibold">You earn ₹40</span></div>
                <div className="flex justify-between"><span>Verified sold (₹299)</span><span className="text-white font-semibold">You earn ₹60</span></div>
                <div className="flex justify-between"><span>Monthly renewal</span><span className="text-white font-semibold">₹40 every month</span></div>
              </div>
            </div>
          </div>

          {/* Application form */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 sm:p-8">
            <h2 className="text-white font-black text-xl mb-6">Apply Now</h2>
            <AffiliateJoinForm />
          </div>
        </div>

      </div>
    </div>
  )
}
