import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import ProfileCompleteForm from "@/components/onboarding/ProfileCompleteForm"

export default async function ProfileCompletePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single()

  if (profile?.profile_completed === true) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            width={140}
            height={37}
            alt="GigWay"
            priority
            className="object-contain"
            style={{ maxHeight: "37px", width: "auto" }}
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to GigWay</h1>
          <p className="text-[#94A3B8]">Set up your profile in 2 quick steps</p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 sm:p-8">
          <ProfileCompleteForm userId={user.id} />
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          By continuing, you agree to GigWay&apos;s Terms of Service &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}
