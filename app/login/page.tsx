"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Loader2, ArrowRight, ChevronLeft, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Briefcase, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const VALUE_POINTS = [
  { icon: Sparkles,  text: "One professional identity — freelance, full-time, or hiring" },
  { icon: Briefcase, text: "Real opportunities across jobs, projects, and services" },
  { icon: Users,     text: "0% platform commission, always" },
]

// Supabase auth errors can be technical/implementation-specific — never show
// error.message directly, map to a short, friendly message instead.
function friendlyAuthError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes("token") || msg.includes("otp") || msg.includes("code")) {
    if (msg.includes("expired") || msg.includes("invalid")) return "That code is incorrect or has expired. Please try again or resend."
  }
  if (msg.includes("rate limit") || msg.includes("security purposes") || msg.includes("too many")) {
    return "You're trying too often — please wait a moment and try again."
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Connection issue. Please check your internet and try again."
  }
  return "Something went wrong. Please try again."
}

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
    if (error) { setMsg({ type: "error", text: friendlyAuthError(error.message) }) }
    else        { setStep("otp") }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" })
    if (error) { setMsg({ type: "error", text: friendlyAuthError(error.message) }); setLoading(false); return }
    window.location.href = "/auth/post-login"
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setMsg({ type: "error", text: friendlyAuthError(error.message) }); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Left panel — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-brand-ivory flex-col justify-between p-12">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-indigo/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-coral/8 blur-3xl pointer-events-none" />

        <Link href="/" className="relative z-10">
          <Image src="/logo.png" alt="GigWay" width={140} height={47} className="h-10 w-auto" priority />
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-white border border-brand-indigo/20 text-brand-indigo text-caption font-semibold mb-5 shadow-soft">
              The Professional Platform for Work, Talent &amp; Opportunity
            </div>
            <h1 className="text-h1 font-extrabold text-brand-midnight leading-tight mb-4">
              Your career,{" "}
              <span className="text-brand-indigo">your terms.</span>
            </h1>
            <p className="text-brand-slate text-body-lg leading-relaxed max-w-md">
              Build your professional identity, discover opportunities, and connect with the world.
            </p>
          </div>

          <div className="space-y-3.5">
            {VALUE_POINTS.map(point => {
              const Icon = point.icon
              return (
                <div key={point.text} className="flex items-center gap-3 bg-white border border-brand-borderLight rounded-2xl px-4 py-3.5 shadow-soft">
                  <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-brand-indigo" />
                  </div>
                  <p className="text-brand-midnight text-body-sm font-medium">{point.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-brand-slate/60 text-caption relative z-10">© {new Date().getFullYear()} GigWay</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Logo — mobile only (desktop shows it in the left panel) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <Image src="/logo.png" alt="GigWay" width={140} height={47} className="h-9 w-auto" priority />
            </Link>
          </div>

          {step === "entry" ? (
            <>
              <div className="mb-7">
                <h2 className="text-h2 font-extrabold text-brand-midnight mb-1.5">Welcome back</h2>
                <p className="text-brand-slate text-body-sm">Continue building your professional identity and discover your next opportunity.</p>
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-brand-borderLight text-brand-midnight font-semibold px-5 py-3.5 rounded-xl transition-colors mb-4 text-sm disabled:opacity-60 disabled:pointer-events-none">
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
                <div className="flex-1 h-px bg-brand-borderLight" />
                <span className="text-brand-slate text-caption font-medium">or continue with email</span>
                <div className="flex-1 h-px bg-brand-borderLight" />
              </div>

              {/* Email OTP form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white border border-brand-borderLight focus:border-brand-indigo rounded-xl pl-10 pr-4 py-3.5 text-brand-midnight text-sm placeholder:text-brand-slate/70 outline-none transition-colors focus:ring-4 focus:ring-brand-indigo/10"
                  />
                </div>

                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold px-5 py-3.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:shadow-[0_6px_18px_-4px_rgba(79,70,229,.55)] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</>
                    : <><span>Send login code</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </form>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-1.5 mt-5 text-brand-slate text-caption">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Secure OTP · No password needed · Free forever</span>
              </div>
            </>
          ) : (
            <>
              {/* OTP step */}
              <button onClick={() => { setStep("entry"); setOtp(""); setMsg(null) }}
                className="flex items-center gap-1.5 text-brand-slate hover:text-brand-midnight text-sm mb-8 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <div className="mb-7">
                <h2 className="text-h2 font-extrabold text-brand-midnight mb-1.5">Check your inbox</h2>
                <p className="text-brand-slate text-body-sm">
                  We sent a 6-digit code to{" "}
                  <span className="text-brand-indigo font-semibold">{email}</span>
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
                  className="w-full bg-white border border-brand-borderLight focus:border-brand-indigo rounded-xl px-4 py-4 text-brand-midnight text-2xl font-mono tracking-[0.5em] text-center outline-none transition-colors focus:ring-4 focus:ring-brand-indigo/10 placeholder:text-slate-300 placeholder:tracking-[0.5em]"
                  maxLength={6}
                  autoFocus
                />

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-brand-indigo hover:bg-brand-indigoDark text-white font-semibold px-5 py-3.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_-4px_rgba(79,70,229,.5)] hover:shadow-[0_6px_18px_-4px_rgba(79,70,229,.55)] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                    : <><span>Verify &amp; Continue</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <button type="button" onClick={handleSendOtp} disabled={loading}
                  className="w-full text-brand-slate hover:text-brand-indigo text-xs py-2 transition-colors disabled:opacity-50 disabled:pointer-events-none">
                  Didn&apos;t receive it? Resend code
                </button>
              </form>
            </>
          )}

          {/* Error / success message */}
          {msg && (
            <div role="alert" className={cn(
              "mt-4 p-3.5 rounded-xl text-sm border flex items-start gap-2",
              msg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            )}>
              {msg.type === "success"
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Bottom note */}
          <p className="text-center text-brand-slate/70 text-caption mt-8 leading-relaxed">
            By continuing, you agree to GigWay&apos;s Terms of Service.<br />
            Choose your username and what you&apos;re open to after signing in.
          </p>

          {/* Lightweight footer */}
          <div className="flex items-center justify-center gap-4 mt-6 text-caption">
            <Link href="/privacy" className="text-brand-slate hover:text-brand-indigo transition-colors">Privacy</Link>
            <span className="text-brand-borderLight">·</span>
            <Link href="/terms" className="text-brand-slate hover:text-brand-indigo transition-colors">Terms</Link>
            <span className="text-brand-borderLight">·</span>
            <Link href="/contact" className="text-brand-slate hover:text-brand-indigo transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
