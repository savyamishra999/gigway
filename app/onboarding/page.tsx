import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingForm from "@/components/onboarding/OnboardingForm"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has a user_type (if yes, redirect to dashboard)
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (profile?.user_type) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-4">
          Welcome to <span className="text-[#FFD700]">GigWAY</span>
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Tell us how you want to use GigWAY
        </p>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}