import { createClient } from "@/lib/supabase/server"
import { redirect }     from "next/navigation"
import VerifyClient, { type VerifyRole } from "./VerifyClient"
import { resolveRoles, type RoleProfile } from "@/lib/roles"

// Reproduces the exact original priority order for already-configured profiles —
// company > job_seeker > individual > freelancer — including the one quirk that's
// specific to verify: "both" find_work_type maps to freelancer here, not job_seeker
// (unlike showFreelancer/showJobSeeker elsewhere). Preserved on purpose: this is a
// paid, real-KYC flow and must not change behavior for anyone already configured.
function toVerifyRole(profile: RoleProfile): VerifyRole {
  const rawRoles = (profile.user_roles as string[] | null) ?? []
  const isFindWork = rawRoles.includes("find_work")
  const { find_work_type: fwType, hire_talent_type: htType, account_type: accountType } = profile

  if (accountType === "company" || htType === "company") return "company"
  if (isFindWork && fwType === "job_seeker") return "job_seeker"
  if (!isFindWork && htType === "individual") return "individual"
  return "freelancer"
}

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status,verification_paid_at,account_type,full_name,hire_talent_type,find_work_type,user_roles")
    .eq("id", user.id)
    .single()

  // Previously an unconfigured profile silently guessed "freelancer" for the
  // document-type prompt on a paid, real-KYC flow. Route to setup instead.
  if (!resolveRoles(profile).isConfigured) redirect("/profile/complete")

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12 px-4">
      <VerifyClient
        status={profile?.verification_status ?? null}
        paidAt={profile?.verification_paid_at ?? null}
        verifyRole={toVerifyRole(profile ?? {})}
        userName={profile?.full_name ?? null}
      />
    </div>
  )
}
