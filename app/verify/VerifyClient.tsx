"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  CheckCircle2, Clock, ShieldX, Upload, FileText, X,
  ShieldCheck, AlertCircle, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  status:    string | null
  paidAt:    string | null
  isCompany: boolean
  userName:  string | null
}

function FilePicker({ label, accept, onFile, file }: {
  label: string; accept?: string;
  onFile: (f: File) => void; file: File | null
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
      <input ref={inputRef} type="file" accept={accept ?? "image/*,application/pdf"} className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  )
}

export default function VerifyClient({ status, paidAt, isCompany, userName }: Props) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile,  setBackFile]  = useState<File | null>(null)
  const [docFile,   setDocFile]   = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState("")

  const hasPaid = !!paidAt

  const handleSubmit = async () => {
    if (isCompany) {
      if (!docFile) { setError("Upload your company registration / GST document"); return }
    } else {
      if (!frontFile || !backFile) { setError("Both front and back of Aadhaar are required"); return }
    }
    setError(""); setUploading(true)

    const fd = new FormData()
    if (isCompany) {
      fd.append("front", docFile!)
      fd.append("back",  docFile!) // same file both sides for company doc
    } else {
      fd.append("front", frontFile!)
      fd.append("back",  backFile!)
    }

    const res = await fetch("/api/verify-me/upload", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) { setDone(true) }
    else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || "Upload failed. Please try again.")
    }
  }

  // ── States ────────────────────────────────────────────────────────────────

  if (status === "approved") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#4ADE80]/20 border-2 border-[#4ADE80]/40 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-10 w-10 text-[#4ADE80]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">You&apos;re Verified! ✓</h1>
        <p className="text-[#94A3B8] mb-6">
          {userName ? `${userName}, your` : "Your"} profile now shows a verified badge. Clients trust you 3× more.
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
          Your documents are being reviewed by our team. Usually takes 24–48 hours.
          We&apos;ll notify you once approved.
        </p>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-sm text-[#6B7280] mb-6">
          <p>📧 You&apos;ll receive a notification in your dashboard when your verification is complete.</p>
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
        {/* Fall through to upload form */}
        {hasPaid && <UploadSection />}
      </div>
    )
  }

  // ── Not paid yet ──────────────────────────────────────────────────────────
  if (!hasPaid) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-[#818CF8]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Get Verified</h1>
          <p className="text-[#94A3B8] text-sm">A verified badge builds instant trust with clients and employers.</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 mb-6 space-y-4">
          {[
            "✅ Verified badge on your profile",
            "🔝 Priority in search results",
            "📞 Direct contact from clients",
            "🏆 Trust Score boost",
          ].map(item => (
            <div key={item} className="flex items-center gap-3 text-sm text-white">{item}</div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#4F46E5]/20 to-[#818CF8]/10 border border-[#4F46E5]/30 rounded-2xl p-6 text-center mb-6">
          <p className="text-[#818CF8] text-xs font-bold uppercase tracking-widest mb-1">One-Time Annual Fee</p>
          <p className="text-4xl font-black text-white mb-1">₹199</p>
          <p className="text-[#6B7280] text-xs">Valid for 1 year · Renew to keep badge</p>
        </div>

        <PayButton />
      </div>
    )
  }

  // ── Paid — show upload form ────────────────────────────────────────────────
  function UploadSection() {
    return (
      <div className="space-y-5">
        <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-[#4ADE80] flex-shrink-0" />
          <p className="text-[#4ADE80] text-sm font-semibold">Payment confirmed — upload your documents below</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {isCompany ? (
          <FilePicker
            label="Company Registration Certificate / GST Certificate"
            file={docFile}
            onFile={setDocFile}
          />
        ) : (
          <>
            <FilePicker label="Aadhaar Card — Front" file={frontFile} onFile={setFrontFile} />
            <FilePicker label="Aadhaar Card — Back"  file={backFile}  onFile={setBackFile}  />
          </>
        )}

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-xs text-[#6B7280] space-y-1">
          <p>• Upload clear photos — blurry/damaged documents will be rejected</p>
          <p>• Files are encrypted and only used for identity verification</p>
          <p>• {isCompany ? "Company reg / GST doc" : "Aadhaar"} must match your registered name</p>
        </div>

        <Button onClick={handleSubmit} disabled={uploading}
          className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base shadow-lg shadow-[#4F46E5]/20 disabled:opacity-50">
          {uploading
            ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</span>
            : <span className="flex items-center gap-2"><Upload className="h-5 w-5" /> Submit for Verification</span>
          }
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#4F46E5]/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-[#818CF8]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Upload Documents</h1>
        <p className="text-[#94A3B8] text-sm">
          {isCompany
            ? "Upload your company registration or GST certificate to get verified."
            : "Upload your Aadhaar card (front + back) to complete verification."}
        </p>
      </div>
      <UploadSection />
    </div>
  )
}

// ── Pay Button ────────────────────────────────────────────────────────────────

function PayButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const handlePay = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verification_yearly" }),
      })
      const order = await res.json()
      if (!res.ok) { setError(order.error || "Failed to create order"); setLoading(false); return }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? ""
      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay({
        key:       keyId,
        amount:    order.amount,
        currency:  order.currency,
        order_id:  order.order_id,
        name:      "GigWay Verification",
        description: "Annual Verified Badge — ₹199",
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
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
          if (verify.ok) { window.location.reload() }
          else { setError("Payment verified but activation failed. Contact support.") }
        },
        prefill: {},
        theme: { color: "#4F46E5" },
      })
      rzp.open()
    } catch {
      setError("Payment failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <Button onClick={handlePay} disabled={loading}
        className="w-full py-6 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-90 text-white font-bold text-base shadow-lg shadow-[#4F46E5]/20 disabled:opacity-50">
        {loading ? "Processing…" : "Pay ₹199 & Get Verified →"}
      </Button>
      <p className="text-center text-[#475569] text-xs">Secure payment via Razorpay · UPI, Card, Net Banking accepted</p>
    </div>
  )
}
