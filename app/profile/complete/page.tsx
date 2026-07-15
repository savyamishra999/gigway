import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import OnboardingForm from "@/components/onboarding/OnboardingForm"

export default async function ProfileCompletePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, user_roles, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  // Only skip onboarding if both profile_completed AND user_roles are filled
  const onboardingDone = profile?.profile_completed === true && (profile?.user_roles ?? []).length > 0
  if (onboardingDone) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" width={140} height={37} alt="GigWay" priority
            className="object-contain" style={{ maxHeight:"37px", width:"auto" }} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to GigWay</h1>
          <p className="text-[#94A3B8]">Set up your profile in 2 quick steps</p>
        </div>

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 sm:p-8">
          <OnboardingForm
            userId={user.id}
            initialName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
            initialAvatar={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? ""}
          />
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          By continuing, you agree to GigWay&apos;s Terms of Service &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}
