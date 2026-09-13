import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { safeReturnTo } from "@/lib/auth/return-to"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export default async function PostLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnTo((await searchParams).next, "")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  if (ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    redirect("/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, username, user_roles, find_work_type, hire_talent_type, account_type")
    .eq("id", user.id)
    .maybeSingle()

  const onboardingDone = profile?.profile_completed === true && !!profile?.username
  if (!onboardingDone) {
    redirect(`/profile/complete${next ? `?next=${encodeURIComponent(next)}` : ""}`)
  }

  redirect(next || "/home")
}
