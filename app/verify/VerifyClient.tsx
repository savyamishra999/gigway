"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  Clock, ShieldX, Upload, FileText, X,
  ShieldCheck, AlertCircle, CreditCard, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type VerifyRole = "freelancer" | "job_seeker" | "individual" | "company"

interface Props {
  status:     string | null
  paidAt:     string | null
  verifyRole: VerifyRole
  userName:   string | null
}

const BADGE_NAMES: Record<VerifyRole, string> = {
  freelancer: "Verified Freelancer",
  job_seeker: "Verified Candidate",
  individual: "Verified Client",
  company:    "Verified Company",
}

const BENEFITS: Record<VerifyRole, string[]> = {
  freelancer: [
    "✅ 'Verified Freelancer' badge on your profile",
    "🔝 Priority in gig and project search results",
    "📞 Direct client inquiries",
    "🏆 3× higher proposal acceptance rate",
  ],
  job_seeker: [
    "✅ 'Verified Candidate' badge on your profile",
    "📄 Verified stamp on your CV & applications",
    "🔝 Shortlisted faster by employers",
    "🏆 Higher interview callback rate",
  ],
  individual: [
    "✅ 'Verified Client' badge on your profile",
    "🤝 Freelancers trust verified clients more",
    "🔝 Get more proposals from top freelancers",
    "⚡ Priority support for project posts",
  ],
  company: [
    "✅ 'Verified Company' badge on all job posts",
    "📋 Verified tag on every job listing",
    "🏆 Top talent applies to verified companies first",
    "🔝 Priority in employer search results",
  ],
}

// ── FilePicker ────────────────────────────────────────────────────────────────

function FilePicker({ label, onFile, file }: {
  label: string; onFile: (f: File) => void; file: File | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <p className="text-white font-medium text-sm mb-2">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          file
            ? "border-[#4ADE80]/40 bg-[#4ADE80]/5"
            : "border-[#1E1E2E] hover:border-[#4F46E5]/50"
        }`}
      >
        {file ? (
          <>
            <FileText className="h-8 w-8 text-[#4ADE80]" />
            <p className="text-[#4ADE80] text-sm font-medium truncate max-w-full px-4">{file.name}</p>
            <p className="text-[#6B7280] text-xs">{(file.size / 1024).toFixed(0)} KB</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[#6B7280]" />
            <p className="text-[#94A3B8] text-sm">Click to upload</p>
            <p className="text-[#475569] text-xs">JPG, PNG, PDF — max 5 MB</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  )
}

// ── UploadFields ──────────────────────────────────────────────────────────────

function UploadFields({
  isCompany, frontFile, backFile, docFile, companyDocType,
  onFront, onBack, onDoc, onDocType,
}: {
  isCompany: boolean
  frontFile: File | null; backFile: File | null; docFile: File | null
  companyDocType: string
  onFront: (f: File) => void; onBack: (f: File) => void; onDoc: (f: File) => void
  onDocType: (t: string) => void
}) {
  return (
    <div className="space-y-4">
      {isCompany ? (
        <>
          <div>
            <p className="text-white font-medium text-sm mb-2">Document Type</p>
            <div className="relative">
              <select
                value={companyDocType}
                onChange={e => onDocType(e.target.value)}
                className="w-full bg-[#12121A] border border-[#1E1E2E] text-white rounded-xl px-4 py-3 text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#4F46E5]/50"
              >
                <option>GST Certificate</option>
                <option>Company Registration Certificate</option>
                <option>MSME Certificate</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
          <FilePicker label={companyDocType} file={docFile} onFile={onDoc} />
        </>
      ) : (
        <>
          <FilePicker label="Aadhaar Card — Front" file={frontFile} onFile={onFront} />
          <FilePicker label="Aadhaar Card — Back"  file={backFile}  onFile={onBack}  />
        </>
      )}

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-xs text-[#6B7280] space-y-1">
        <p>• Upload clear, readable documents — blurry images will be rejected</p>
        <p>• Files are encrypted and used only for identity verification</p>
        <p>• {isCompany ? "Document" : "Aadhaar"} must match your registered name</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VerifyClient({ status, paidAt, verifyRole, userName }: Props) {
  const [frontFile,      setFrontFile]      = useState<File | null>(null)
  const [backFile,       setBackFile]       = useState<File | null>(null)
  const [docFile,        setDocFile]        = useState<File | null>(null)
  const [companyDocType, setCompanyDocType] = useState("GST Certificate")
  const [uploading,      setUploading]      = useState(false)
  const [paying,         setPaying]         = useState(false)
  const [done,           setDone]           = useState(false)
  const [error,          setError]          = useState("")

  const isCompany = verifyRole === "company"
  const hasPaid   = !!paidAt
  const badgeName = BADGE_NAMES[verifyRole]
  const benefits  = BENEFITS[verifyRole]
  const hasFiles  = isCompany ? !!docFile : (!!frontFile && !!backFile)

  const uploadDocs = async () => {
    setError(""); setUploading(true)
    const fd = new FormData()
    if (isCompany) {
      fd.append("front", docFile!)
      fd.append("back",  docFile!)
      fd.append("doc_type", companyDocType)
    } else {
      fd.append("front", frontFile!)
      fd.append("back",  backFile!)
    }
    const res = await fetch("/api/verify-me/upload", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) {
      setDone(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || "Upload failed. Please try again.")
    }
  }

  const handlePayAndSubmit = async () => {
    if (!hasFiles) { setError("Please upload the required documents first"); return }
    setError(""); setPaying(true)
    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verification_yearly" }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) {
        setError(order.error || "Failed to create payment order")
        setPaying(false)
        return
      }

      const rzp = new (window as unknown as {
        Razorpay: new (opts: unknown) => { open: () => void }
      }).Razorpay({
        key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount:   order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name:     "GigWay Verification",
        description: `${badgeName} — ₹199/year`,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id:   string
          razorpay_signature:  string
        }) => {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan_type:           "verification_yearly",
            }),
          })
          if (verify.ok) {
            await uploadDocs()
          } else {
            setError("Payment verified but activation failed. Contact support.")
            setPaying(false)
          }
        },
        prefill: {},
        theme:   { color: "#4F46E5" },
        modal:   { ondismiss: () => setPaying(false) },
      })
      rzp.open()
    } catch {
      setError("Payment failed. Please try again.")
      setPaying(false)
    }
  }

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (status === "approved") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#4ADE80]/20 border-2 border-[#4ADE80]/40 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-10 w-10 text-[#4ADE80]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">You&apos;re Verified! ✅</h1>
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-5">
          <span className="text-blue-400 font-bold text-sm">{badgeName} ✅</span>
        </div>
        <p className="text-[#94A3B8] mb-8">
          {userName ? `${userName}, your` : "Your"} profile now shows a{" "}
          <span className="text-white font-semibold">{badgeName}</span> badge.
        </p>
        <Link href="/dashboard">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-8">Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (status === "pending" || done) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#F59E0B]/20 border-2 border-[#F59E0B]/40 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-[#F59E0B]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Under Review</h1>
        <p className="text-[#94A3B8] mb-6">
          Your documents are being reviewed. Usually 24–48 hours.
          We&apos;ll notify you once your{" "}
          <span className="text-white font-semibold">{badgeName}</span> badge is approved.
        </p>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-sm text-[#6B7280] mb-6">
          <p>📧 You&apos;ll get a dashboard notification when verification is complete.</p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-8">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Verification Rejected</h1>
          <p className="text-[#94A3B8] text-sm">Please re-submit with clear, valid documents.</p>
        </div>

        <div className="space-y-5">
          {hasPaid && (
            <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#4ADE80] flex-shrink-0" />
              <p className="text-[#4ADE80] text-sm font-semibold">No re-payment needed — just re-upload your documents</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          <UploadFields
            isCompany={isCompany}
            frontFile={frontFile} backFile={backFile} docFile={docFile}
            companyDocType={companyDocType}
            onFront={setFrontFile} onBack={setBackFile} onDoc={setDocFile}
            onDocType={setCompanyDocType}
          />

          {hasPaid ? (
            <Button onClick={uploadDocs} disabled={uploading || !hasFiles}
              className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base disabled:opacity-40">
              {uploading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</span>
                : <span className="flex items-center gap-2"><Upload className="h-5 w-5" /> Re-Submit for Verification</span>
              }
            </Button>
          ) : (
            <Button onClick={handlePayAndSubmit} disabled={paying || uploading || !hasFiles}
              className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base disabled:opacity-40">
              {paying || uploading ? "Processing…" : "Pay ₹199 & Re-Submit →"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── Main flow: unverified ─────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-[#818CF8]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Get {badgeName}</h1>
        <p className="text-[#94A3B8] text-sm">
          {isCompany
            ? "Upload your company document to get verified."
            : "Upload your Aadhaar card (front + back) to complete verification."}
        </p>
      </div>

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 mb-6 space-y-3">
        {benefits.map(b => <p key={b} className="text-sm text-white">{b}</p>)}
      </div>

      <div className="bg-gradient-to-br from-[#4F46E5]/20 to-[#818CF8]/10 border border-[#4F46E5]/30 rounded-xl px-5 py-3 flex items-center justify-between mb-6">
        <div>
          <p className="text-[#818CF8] text-xs font-bold uppercase tracking-widest">Annual Fee</p>
          <p className="text-white text-xs">Valid for 1 year · Renew to keep badge</p>
        </div>
        <p className="text-3xl font-black text-white">₹199</p>
      </div>

      {hasPaid && (
        <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
          <CreditCard className="h-5 w-5 text-[#4ADE80] flex-shrink-0" />
          <p className="text-[#4ADE80] text-sm font-semibold">Payment confirmed — upload your documents below</p>
        </div>
      )}

      <div className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        <UploadFields
          isCompany={isCompany}
          frontFile={frontFile} backFile={backFile} docFile={docFile}
          companyDocType={companyDocType}
          onFront={setFrontFile} onBack={setBackFile} onDoc={setDocFile}
          onDocType={setCompanyDocType}
        />

        {hasPaid ? (
          <Button onClick={uploadDocs} disabled={uploading || !hasFiles}
            className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base disabled:opacity-40">
            {uploading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</span>
              : <span className="flex items-center gap-2"><Upload className="h-5 w-5" /> Submit for Verification</span>
            }
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handlePayAndSubmit}
              disabled={paying || uploading || !hasFiles}
              className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base shadow-lg shadow-[#4F46E5]/20 disabled:opacity-40"
            >
              {paying || uploading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</span>
                : <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    {hasFiles ? "Pay ₹199 & Submit for Verification →" : "Upload documents above to continue"}
                  </span>
              }
            </Button>
            {!hasFiles && (
              <p className="text-[#6B7280] text-xs text-center">
                {isCompany ? "Upload your company document above" : "Upload Aadhaar front & back above"} to enable payment
              </p>
            )}
            <p className="text-center text-[#475569] text-xs">Secure payment via Razorpay · UPI, Card, Net Banking accepted</p>
          </div>
        )}
      </div>
    </div>
  )
}
