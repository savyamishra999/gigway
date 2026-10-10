import { redirect } from "next/navigation"
import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { createClient } from "@/lib/supabase/server"
import GigCardStudio from "@/components/profile/GigCardStudio"

export default async function GigCardStudioPage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/profile/gigcard"))
  const db = await createClient()
  const { data: profile, error } = await db.from("profiles")
    .select("full_name,username,avatar_url,tagline,skills,location").eq("id", user.id).maybeSingle()
  if (error) throw new Error("Your profile could not be loaded. Please retry.")
  if (!profile?.username) redirect("/profile/complete?next=%2Fprofile%2Fgigcard")
  return <GigCardStudio key={user.id} profile={profile} />
}
