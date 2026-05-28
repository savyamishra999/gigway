import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AffiliateDashboardClient from "@/components/affiliate/AffiliateDashboardClient"

export const metadata: Metadata = {
  title: "Affiliate Dashboard — GigWay",
  description: "Track your referrals, earnings, and withdraw commissions.",
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/affiliate/dashboard")

  // Fetch affiliate row by user_id
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // Not applied at all
  if (!affiliate) redirect("/affiliate/join")

  // Applied but pending/rejected
  if (affiliate.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 text-center">
          {affiliate.status === "pending" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[#FBBF24]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h2 className="text-white font-black text-xl mb-2">Application Under Review</h2>
              <p className="text-[#94A3B8] text-sm">
                We review all applications within 24 hours. We&apos;ll WhatsApp you at{" "}
                <span className="text-white font-semibold">{affiliate.phone}</span> once approved.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-white font-black text-xl mb-2">Application Not Approved</h2>
              <p className="text-[#94A3B8] text-sm mb-4">
                Your affiliate application was not approved. Contact us for more information.
              </p>
              <a href="mailto:support@gigway.in"
                className="text-[#818CF8] text-sm hover:text-white transition-colors">
                support@gigway.in
              </a>
            </>
          )}
        </div>
      </div>
    )
  }

  // Fetch stats
  const [
    { count: totalClicks },
    { data: conversions },
    { data: payouts },
  ] = await Promise.all([
    supabase.from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("ref_code", affiliate.ref_code),
    supabase.from("affiliate_conversions")
      .select("sale_amount, commission, created_at")
      .eq("ref_code", affiliate.ref_code)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("affiliate_payouts")
      .select("amount, upi_id, status, paid_at, created_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const totalSales = (conversions ?? []).length
  const totalEarned = affiliate.total_earnings ?? 0
  const paidOut = (payouts ?? [])
    .filter(p => p.status === "paid")
    .reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const available = Math.max(0, totalEarned - paidOut)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthEarned = (conversions ?? [])
    .filter(c => new Date(c.created_at) >= monthStart)
    .reduce((s: number, c: { commission: number }) => s + c.commission, 0)

  return (
    <AffiliateDashboardClient
      affiliate={affiliate}
      stats={{ totalClicks: totalClicks ?? 0, totalSales, totalEarned, thisMonthEarned, available, paidOut }}
      conversions={conversions ?? []}
      payouts={payouts ?? []}
    />
  )
}
