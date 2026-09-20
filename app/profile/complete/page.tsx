import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import IdentityOnboarding from "@/components/identity/IdentityOnboarding"
import { getViewer } from "@/lib/auth/server"
import { safeReturnTo, loginHref } from "@/lib/auth/return-to"
import { resolveRoles } from "@/lib/roles"

export default async function ProfileCompletePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnTo((await searchParams).next, "")
  const supabase = await createClient()
  const user = await getViewer()

  if (!user) redirect(loginHref(next))

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_completed, username, full_name, avatar_url, tagline, location, skills, user_roles, find_work_type, hire_talent_type, account_type")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) throw new Error("Your profile could not be checked. Please try again.")

  // Legacy destinations require a work role; do not bounce a completed identity
  // straight back into their role gate. General onboarding rules stay unchanged.
  const requiresWorkRole = /^\/(?:dashboard|verify)(?:[/?#]|$)/.test(next) && !resolveRoles(profile).isConfigured
  const onboardingDone = profile?.profile_completed === true && !!profile?.username
  if (onboardingDone && !requiresWorkRole) redirect(next || "/home")

  const { data: intents } = await supabase.from("profile_intents").select("intent_type").eq("profile_id", user.id).eq("is_active", true)

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" width={168} height={56} alt="GigWay" priority
            className="object-contain" style={{ maxHeight:"37px", width:"auto" }} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-midnight mb-2">Welcome to GigWay</h1>
          <p className="text-brand-slate">Set up your professional identity</p>
        </div>

        <div className="bg-white border border-brand-borderLight rounded-2xl p-6 shadow-soft sm:p-8">
          <IdentityOnboarding username={profile?.username} fullName={profile?.full_name ?? user.user_metadata?.full_name ?? null} initialModes={(intents ?? []).map(x => x.intent_type)} next={next} requiresWorkRole={requiresWorkRole} />
        </div>

        <p className="text-center text-brand-slate text-xs mt-6">
          By continuing, you agree to GigWay&apos;s Terms of Service &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}
