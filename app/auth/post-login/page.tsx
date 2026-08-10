import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export default async function PostLoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  if (ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    redirect("/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, username")
    .eq("id", user.id)
    .maybeSingle()

  const onboardingDone = profile?.profile_completed === true && !!profile?.username
  if (!onboardingDone) {
    redirect("/profile/complete")
  }

  redirect("/dashboard")
}
