import { getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Compatibility entry for saved links and the mobile Profile tab.
export default async function ProfilePage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/profile"))
  const db = await createClient()
  const { data: profile, error } = await db.from("profiles").select("username").eq("id", user.id).maybeSingle()
  if (error) throw new Error("Your profile could not be loaded. Please try again.")
  redirect(profile?.username ? '/u/' + encodeURIComponent(profile.username) : "/profile/complete")
}
