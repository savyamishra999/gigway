"use client"

import { useState } from "react"
import { Mail, Loader2, ArrowRight, ChevronLeft, Zap, Shield, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail]   = useState("")
  const [otp, setOtp]       = useState("")
  const [step, setStep]     = useState<"entry" | "otp">("entry")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setMsg({ type: "error", text: error.message }) }
    else        { setStep("otp") }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" })
    if (error) { setMsg({ type: "error", text: error.message }); setLoading(false); return }
    const u = data.user
    if (u) {
      const { data: existing } = await supabase.from("profiles").select("id").eq("id", u.id).maybeSingle()
      if (!existing) {
        await supabase.from("profiles").insert({
          id: u.id, email: u.email, full_name: null, profile_completed: false, user_roles: [],
        }).then(() => null, () => null)
      }
    }
    window.location.href = "/auth/post-login"
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setMsg({ type: "error", text: error.message }); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col lg:flex-row">

      {/* ── Left panel (hero) — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#0D0D18] flex-col justify-between p-12">
        {/* Gradient orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#4F46E5]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#F97316]/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div>
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#F97316] bg-clip-text text-transparent">
            gigWAY
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-[#818CF8] text-xs font-semibold mb-5">
              <Zap className="h-3 w-3 fill-current" /> India&apos;s Zero-Commission Platform
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4">
              Your career,<br />
              <span className="bg-gradient-to-r from-[#818CF8] to-[#F97316] bg-clip-text text-transparent">
                your terms.
              </span>
            </h1>
            <p className="text-[#6B7280] text-lg leading-relaxed max-w-md">
              Freelance, find jobs, or hire talent — all on one platform. Zero commission. Full freedom.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Freelancers", value: "10K+" },
              { label: "Projects Posted", value: "2K+" },
              { label: "Commission", value: "0%" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-0.5 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 fill-[#F97316] text-[#F97316]" />)}
            </div>
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              &quot;GigWay helped me get my first 3 clients within a week. No middleman, no commission cuts. Pure income.&quot;
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white text-xs font-bold">R</div>
              <div>
                <p className="text-white text-xs font-semibold">Rahul Mehta</p>
                <p className="text-[#6B7280] text-xs">Full Stack Developer, Pune</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[#334155] text-xs relative z-10">© 2025 GigWay · Made in India</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <span className="text-3xl font-black bg-gradient-to-r from-[#818CF8] to-[#F97316] bg-clip-text text-transparent">
            gigWAY
          </span>
          <p className="text-[#6B7280] text-sm mt-1">India&apos;s Zero-Commission Career Platform</p>
        </div>

        <div className="w-full max-w-md">

          {step === "entry" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Welcome back</h2>
                <p className="text-[#6B7280] text-sm">Sign in or create your account in seconds</p>
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-5 py-3.5 rounded-xl transition-colors mb-4 text-sm disabled:opacity-60">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#1E1E2E]" />
                <span className="text-[#4B5563] text-xs font-medium">or sign in with email</span>
                <div className="flex-1 h-px bg-[#1E1E2E]" />
              </div>

              {/* Email OTP form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5563]" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-[#12121A] border border-[#1E1E2E] focus:border-[#4F46E5] rounded-xl pl-10 pr-4 py-3.5 text-[#F8FAFC] text-sm placeholder:text-[#4B5563] outline-none transition-colors"
                  />
                </div>

                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-5 py-3.5 rounded-xl transition-colors text-sm disabled:opacity-50">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</>
                    : <><span>Send login code</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </form>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 mt-5 text-[#4B5563] text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure OTP · No password needed · Free forever</span>
              </div>
            </>
          ) : (
            <>
              {/* OTP step */}
              <button onClick={() => { setStep("entry"); setOtp(""); setMsg(null) }}
                className="flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm mb-8 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Check your inbox</h2>
                <p className="text-[#6B7280] text-sm">
                  We sent a 6-digit code to{" "}
                  <span className="text-[#818CF8] font-semibold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  disabled={loading}
                  className="w-full bg-[#12121A] border border-[#1E1E2E] focus:border-[#4F46E5] rounded-xl px-4 py-4 text-[#F8FAFC] text-2xl font-mono tracking-[0.5em] text-center outline-none transition-colors placeholder:text-[#2A2A3E] placeholder:tracking-[0.5em]"
                  maxLength={6}
                  autoFocus
                />

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-5 py-3.5 rounded-xl transition-colors text-sm disabled:opacity-50">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                    : <><span>Verify & Continue</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <button type="button" onClick={handleSendOtp} disabled={loading}
                  className="w-full text-[#6B7280] hover:text-[#818CF8] text-xs py-2 transition-colors">
                  Didn&apos;t receive it? Resend code
                </button>
              </form>
            </>
          )}

          {/* Error / success message */}
          {msg && (
            <div className={cn(
              "mt-4 p-3.5 rounded-xl text-sm border flex items-start gap-2",
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            )}>
              {msg.text}
            </div>
          )}

          {/* Bottom note */}
          <p className="text-center text-[#334155] text-xs mt-8 leading-relaxed">
            By continuing, you agree to GigWay&apos;s Terms of Service.<br />
            You can set your role (Freelancer / Hirer / Both) after signing in.
          </p>
        </div>
      </div>
    </div>
  )
}
