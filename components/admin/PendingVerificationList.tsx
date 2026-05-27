"use client"

import { useState } from "react"
import { CheckCircle, XCircle, ExternalLink, MessageCircle } from "lucide-react"

interface PendingProfile {
  id: string
  full_name: string | null
  phone: string | null
  verification_doc: string | null
  created_at: string
  avatar_url: string | null
}

interface PendingVerificationListProps {
  pending: PendingProfile[]
}

function parseDoc(doc: string | null): { type: string; value: string; label: string } {
  if (!doc) return { type: "unknown", value: "", label: "No document" }
  const [type, ...rest] = doc.split(":")
  const value = rest.join(":")
  if (type === "linkedin") return { type, value, label: `LinkedIn: ${value}` }
  if (type === "aadhaar") return { type, value, label: `Aadhaar last 4: ****${value}` }
  return { type, value, label: doc }
}

function whatsappLink(phone: string | null, name: string | null, userId: string): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  const num = digits.startsWith("91") ? digits : `91${digits}`
  const msg = encodeURIComponent(
    `Hi ${name || "there"}! 🎉 Your GigWay Verified Badge has been approved! ✅\n\nYour profile now shows a verified badge — clients can trust you immediately.\n\nView your profile: https://gigway.in/freelancers/${userId}\n\nTeam GigWay`
  )
  return `https://wa.me/${num}?text=${msg}`
}

export default function PendingVerificationList({ pending: initialPending }: PendingVerificationListProps) {
  const [items, setItems] = useState(initialPending)
  const [processing, setProcessing] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, "approved" | "rejected">>({})
  const [error, setError] = useState<Record<string, string>>({})

  const act = async (userId: string, action: "approve" | "reject") => {
    setProcessing(userId)
    setError(prev => ({ ...prev, [userId]: "" }))
    try {
      const res = await fetch("/api/admin/verify-freelancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(prev => ({ ...prev, [userId]: data.error || "Failed" }))
      } else {
        setDone(prev => ({ ...prev, [userId]: action === "approve" ? "approved" : "rejected" }))
        setItems(prev => prev.filter(p => p.id !== userId))
      }
    } catch {
      setError(prev => ({ ...prev, [userId]: "Network error" }))
    }
    setProcessing(null)
  }

  if (items.length === 0 && Object.keys(done).length === 0) {
    return (
      <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl">
        <CheckCircle className="h-12 w-12 text-[#4ADE80] mx-auto mb-3" />
        <p className="text-white font-semibold text-lg">All caught up!</p>
        <p className="text-[#94A3B8] text-sm mt-1">No pending verifications</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Completed actions banner */}
      {Object.entries(done).map(([uid, result]) => (
        <div key={uid} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          result === "approved"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {result === "approved" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          User {uid.slice(0, 8)}… was {result}
        </div>
      ))}

      {items.map(profile => {
        const doc = parseDoc(profile.verification_doc)
        const waLink = whatsappLink(profile.phone, profile.full_name, profile.id)
        const initial = profile.full_name?.[0]?.toUpperCase() || "?"
        const isPending = processing === profile.id

        return (
          <div key={profile.id} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] font-bold text-lg flex-shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="w-full h-full object-cover" />
                  : initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white font-bold">{profile.full_name || "Unknown"}</p>
                    <p className="text-[#6B7280] text-xs mt-0.5">
                      Requested {new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <a
                    href={`/freelancers/${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#818CF8] hover:underline text-xs flex items-center gap-1"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Document */}
                <div className="mt-3 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3">
                  <p className="text-[#6B7280] text-xs mb-1 font-medium uppercase tracking-wider">Document</p>
                  {doc.type === "linkedin" ? (
                    <a
                      href={doc.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#818CF8] hover:underline text-sm flex items-center gap-2 break-all"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      {doc.value}
                    </a>
                  ) : (
                    <p className="text-white text-sm">{doc.label}</p>
                  )}
                </div>

                {error[profile.id] && (
                  <p className="text-red-400 text-xs mt-2">{error[profile.id]}</p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <button
                    onClick={() => act(profile.id, "approve")}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isPending ? "Processing…" : "Approve ✅"}
                  </button>

                  <button
                    onClick={() => act(profile.id, "reject")}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {isPending ? "Processing…" : "Reject"}
                  </button>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-sm font-medium px-4 py-2 rounded-xl transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
