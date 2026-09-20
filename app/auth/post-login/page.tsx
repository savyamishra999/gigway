import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getViewer } from "@/lib/auth/server"
import { safeReturnTo, loginHref } from "@/lib/auth/return-to"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tellitorg1@gmail.com")
  .split(",").map(e => e.trim().toLowerCase())

export default async function PostLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnTo((await searchParams).next, "")
  const supabase = await createClient()
  const user = await getViewer()

  if (!user) redirect(loginHref(next))

  if (ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    redirect("/admin")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_completed, username, user_roles, find_work_type, hire_talent_type, account_type")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) throw new Error("Your profile could not be checked. Please try again.")

  const onboardingDone = profile?.profile_completed === true && !!profile?.username
  if (!onboardingDone) {
    redirect(`/profile/complete${next ? `?next=${encodeURIComponent(next)}` : ""}`)
  }

  redirect(next || "/home")
}
