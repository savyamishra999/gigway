import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditProfileForm from "@/components/profile/EditProfileForm"
import WorkModesEditor from "@/components/identity/WorkModesEditor"

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If onboarding not done, send them there first
  const onboardingDone = profile?.profile_completed === true && !!profile?.username
  if (!onboardingDone) redirect("/profile/complete")

  const [{ data: intents }, { data: memberships }] = await Promise.all([
    supabase.from("profile_intents").select("intent_type").eq("profile_id", profile.id).eq("is_active", true),
    supabase.from("organization_members").select("member_role, organizations(name, username, logo_url)").eq("profile_id", profile.id).eq("status", "active"),
  ])
  const activeModes = (intents ?? []).map(intent => intent.intent_type)
  const organizations = (memberships ?? [])
    .map(m => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
      return org ? { name: org.name as string, username: org.username as string, logoUrl: org.logo_url as string | null, role: m.member_role as string } : null
    })
    .filter((o): o is { name: string; username: string; logoUrl: string | null; role: string } => !!o)

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-10 pb-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8"><p className="text-xs font-bold tracking-[.16em] text-[#A99FFF]">YOUR PROFESSIONAL IDENTITY</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Edit your profile</h1><p className="mt-2 text-sm text-[#98A1B3]">Make it easy for the right people and opportunities to find you.</p></div>
        <div className="mb-6 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/8"><WorkModesEditor initialModes={activeModes} /></div>
        <div className="rounded-3xl bg-[#15151d] p-4 sm:p-7 ring-1 ring-white/8"><EditProfileForm profile={profile} userId={user.id} activeModes={activeModes} organizations={organizations} /></div>
      </div>
    </div>
  )
}
