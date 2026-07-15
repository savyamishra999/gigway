import { createClient } from "@/lib/supabase/server"
import { redirect }     from "next/navigation"
import VerifyClient, { type VerifyRole } from "./VerifyClient"

function getVerifyRole(profile: {
  user_roles?:       string[] | null
  find_work_type?:   string | null
  hire_talent_type?: string | null
  account_type?:     string | null
} | null): VerifyRole {
  if (!profile) return "freelancer"
  const roles  = (profile.user_roles as string[] | null) ?? []
  const isFW   = roles.includes("find_work") || roles.length === 0
  const htType = profile.hire_talent_type
  const fwType = profile.find_work_type

  if (profile.account_type === "company" || htType === "company") return "company"
  if (isFW && fwType === "job_seeker") return "job_seeker"
  if (!isFW && htType === "individual") return "individual"
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

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12 px-4">
      <VerifyClient
        status={profile?.verification_status ?? null}
        paidAt={profile?.verification_paid_at ?? null}
        verifyRole={getVerifyRole(profile)}
        userName={profile?.full_name ?? null}
      />
    </div>
  )
}
