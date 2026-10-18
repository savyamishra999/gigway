import { redirect } from "next/navigation"
import { getViewer } from "@/lib/auth/server"
import { initialHomePosts } from "@/lib/home/primary"
import SocialHomeFeed from "@/components/social/SocialHomeFeed"
export default async function CommunityPage() {
  const user = await getViewer()
  if (!user) redirect("/login?next=/community")
  const initialPage = await initialHomePosts(user.id)
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-28"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold text-brand-midnight">Community</h1><p className="mt-2 text-brand-slate">Share your work and follow professional conversations.</p><SocialHomeFeed initialPage={initialPage} opportunities={[]} network={[]} glimps={[]} jox={[]} /></div></main>
}