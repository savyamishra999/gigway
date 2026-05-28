"use client"

import { useState } from "react"
import { CheckCircle, XCircle, MessageCircle, ExternalLink } from "lucide-react"

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919643693090"

type Tab = "pending" | "approved" | "payouts"

interface PendingAffiliate {
  id: string; name: string; email: string; phone: string
  platform_link: string | null; how_promote: string; ref_code: string; created_at: string
}

interface ApprovedAffiliate {
  id: string; name: string; email: string; ref_code: string
  total_earnings: number; commission_rate: number; created_at: string
}

interface Payout {
  id: string; amount: number; upi_id: string | null; status: string
  created_at: string; paid_at: string | null
  affiliates: { name: string; email: string } | null
}

interface Props {
  pending: PendingAffiliate[]
  approved: ApprovedAffiliate[]
  payouts: Payout[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
}

export default function AdminAffiliatesClient({ pending: initialPending, approved, payouts: initialPayouts }: Props) {
  const [tab, setTab] = useState<Tab>("pending")
  const [pending, setPending] = useState(initialPending)
  const [payouts, setPayouts] = useState(initialPayouts)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (affiliateId: string, action: "approve" | "reject") => {
    setLoading(affiliateId + action)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliate_id: affiliateId, action }),
      })
      if (res.ok) {
        setPending(p => p.filter(a => a.id !== affiliateId))
      }
    } catch { /* ignore */ }
    setLoading(null)
  }

  const handleMarkPaid = async (payoutId: string) => {
    setLoading(payoutId)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payoutId, action: "mark_paid" }),
      })
      if (res.ok) {
        setPayouts(p => p.map(x => x.id === payoutId ? { ...x, status: "paid", paid_at: new Date().toISOString() } : x))
      }
    } catch { /* ignore */ }
    setLoading(null)
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "pending",  label: "Pending",  count: pending.length },
    { key: "approved", label: "Approved", count: approved.length },
    { key: "payouts",  label: "Payouts",  count: payouts.filter(p => p.status === "pending").length },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[#4F46E5] text-white"
                : "bg-[#12121A] border border-[#1E1E2E] text-[#6B7280] hover:text-white hover:border-[#334155]"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? "bg-white/20" : "bg-[#4F46E5]/20 text-[#818CF8]"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-10 text-center">
              <p className="text-[#475569] text-sm">No pending applications</p>
            </div>
          ) : pending.map(aff => (
            <div key={aff.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-white font-bold">{aff.name}</p>
                  <p className="text-[#6B7280] text-xs">{aff.email} · {aff.phone}</p>
                  <p className="text-[#475569] text-xs mt-0.5">{fmt(aff.created_at)}</p>
                </div>
                {aff.platform_link && (
                  <a href={aff.platform_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#818CF8] text-xs hover:text-white transition-colors border border-[#334155] px-3 py-1.5 rounded-xl">
                    <ExternalLink className="h-3 w-3" /> View Platform
                  </a>
                )}
              </div>

              <div className="bg-[#0F172A] border border-[#1E1E2E] rounded-xl p-4">
                <p className="text-[#6B7280] text-xs uppercase font-semibold tracking-wide mb-2">How they&apos;ll promote</p>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{aff.how_promote}</p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleAction(aff.id, "approve")}
                  disabled={loading === aff.id + "approve"}
                  className="flex items-center gap-2 bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#4ADE80]/20 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {loading === aff.id + "approve" ? "Approving…" : "Approve"}
                </button>
                <button
                  onClick={() => handleAction(aff.id, "reject")}
                  disabled={loading === aff.id + "reject"}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  {loading === aff.id + "reject" ? "Rejecting…" : "Reject"}
                </button>
                <a
                  href={`https://wa.me/91${aff.phone}?text=${encodeURIComponent(
                    `Congrats ${aff.name}! Your GigWay affiliate account is approved. Login at gigway.in/affiliate/dashboard to get your referral link. Your code: ${aff.ref_code}`
                  )}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved tab */}
      {tab === "approved" && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          {approved.length === 0 ? (
            <p className="text-[#475569] text-sm text-center py-10">No approved affiliates yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    {["Name", "Ref Code", "Commission %", "Total Earned", "Joined"].map(h => (
                      <th key={h} className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E2E]">
                  {approved.map(aff => (
                    <tr key={aff.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{aff.name}</p>
                        <p className="text-[#475569] text-xs">{aff.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[#818CF8] font-mono text-xs bg-[#4F46E5]/10 px-2 py-1 rounded-lg">{aff.ref_code}</span>
                      </td>
                      <td className="px-5 py-3 text-[#4ADE80] font-bold">{aff.commission_rate}%</td>
                      <td className="px-5 py-3 text-white font-bold">₹{aff.total_earnings ?? 0}</td>
                      <td className="px-5 py-3 text-[#6B7280] text-xs">{fmt(aff.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payouts tab */}
      {tab === "payouts" && (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          {payouts.length === 0 ? (
            <p className="text-[#475569] text-sm text-center py-10">No payout requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    {["Affiliate", "Amount", "UPI ID", "Requested", "Status", "Action"].map(h => (
                      <th key={h} className="text-left text-[#6B7280] font-semibold px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E2E]">
                  {payouts.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{p.affiliates?.name ?? "—"}</p>
                        <p className="text-[#475569] text-xs">{p.affiliates?.email ?? ""}</p>
                      </td>
                      <td className="px-5 py-3 text-white font-bold">₹{p.amount}</td>
                      <td className="px-5 py-3 text-[#94A3B8] text-xs font-mono">{p.upi_id ?? "—"}</td>
                      <td className="px-5 py-3 text-[#6B7280] text-xs">{fmt(p.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          p.status === "paid"
                            ? "bg-[#4ADE80]/10 text-[#4ADE80]"
                            : "bg-[#FBBF24]/10 text-[#FBBF24]"
                        }`}>
                          {p.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {p.status === "pending" && (
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            disabled={loading === p.id}
                            className="text-xs bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] px-3 py-1.5 rounded-xl hover:bg-[#4ADE80]/20 transition-colors font-semibold disabled:opacity-50"
                          >
                            {loading === p.id ? "…" : "Mark Paid"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
