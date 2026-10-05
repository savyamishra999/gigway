import { completionForCurrent, getViewer, loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { withDeadline, AUTH_CHECK_TIMEOUT_MS } from "@/lib/async"
import CreatePostComposer from "@/components/social/CreatePostComposer"

export default async function CreateSocialPostPage() {
  const user = await getViewer()
  if (!user) redirect(await loginForCurrent("/social/create"))
  const db = await createClient()
  const { data: profile, error } = await withDeadline(db.from("profiles")
    .select("id,full_name,avatar_url").eq("id", user.id).maybeSingle(), AUTH_CHECK_TIMEOUT_MS)
  if (error) throw new Error("Your profile could not be loaded. Please retry.")
  if (!profile) redirect(await completionForCurrent())
  return <main className="min-h-screen bg-brand-ivory px-3 py-3 pb-24 sm:px-4 sm:py-10"><div className="mx-auto min-w-0 max-w-2xl"><CreatePostComposer profile={{ id: user.id, name: profile.full_name || "My profile", avatar: profile.avatar_url }} organizations={[]} loadWorkplaces /></div></main>
}
