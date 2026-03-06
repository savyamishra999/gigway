"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Loader2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "OTP sent to your email!" })
      setStep("otp")
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      window.location.href = "/dashboard"
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMessage({ type: "error", text: error.message })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-lg text-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            gigWAY
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            Zero commission freelance platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/20">
              <TabsTrigger value="email" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">Email OTP</TabsTrigger>
              <TabsTrigger value="google" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10 py-6 text-base bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 text-black"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      OTP sent to <strong className="text-[#FFD700]">{email}</strong>
                    </p>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={loading}
                      className="py-6 text-base text-center tracking-widest bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700]/90 hover:to-[#FFA500]/90 text-black"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep("email")}
                    className="w-full text-[#FFD700]"
                  >
                    Use different email
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="google">
              <div className="space-y-4">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-6 text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {message && (
            <div
              className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                message.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              )}
            >
              {message.text}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm border-t border-white/10 pt-6">
          {/* Team Hire Offer Section */}
          <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 p-4 rounded-lg border border-[#FFD700]/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-[#FFD700]" />
              <h3 className="font-semibold text-[#FFD700]">Hire a Great Team from Us!</h3>
            </div>
            <p className="text-xs text-gray-300">
              Get exclusive access to top-tier freelancers and teams. 
              Subscribe now to unlock team hiring offers and grow your business faster.
            </p>
            <Button
              variant="link"
              className="mt-2 text-[#FFD700] hover:text-[#FFD700]/80 text-xs"
              onClick={() => window.location.href = "/subscription"} // Baad mein link karenge
            >
              Learn More & Subscribe →
            </Button>
          </div>

          {/* Existing Role Change Message */}
          <p className="text-xs text-gray-400">
            You can choose your role (Freelancer/Client/Both) in{' '}
            <Link href="/profile/edit" className="text-[#FFD700] underline underline-offset-2 hover:text-[#FFD700]/80 transition">
              Profile Settings
            </Link> after logging in.
          </p>
          <p className="text-xs text-gray-500">We'll send you a secure code to log in instantly.</p>
        </CardFooter>
      </Card>
    </div>
  )
}