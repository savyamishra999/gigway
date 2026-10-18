import Link from "next/link"
import { getViewer } from "@/lib/auth/server"
import ProfileNextActions from "@/components/profile/ProfileNextActions"
import { HomeModule } from "@/components/home/HomeModule"
import { LatestOpportunities } from "@/components/home/DiscoveryPreviews"
export default async function HomeHub() {
  const user = await getViewer()
  if (!user) return <main className="min-h-screen bg-brand-ivory px-4 py-20 text-center"><h1 className="text-h1 font-extrabold">Your next opportunity starts here.</h1><Link href="/login?mode=join&next=/home" className="mt-6 inline-block rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white">Join GigWay</Link></main>
  return <main className="min-h-screen bg-brand-ivory px-4 py-8 pb-28"><div className="mx-auto max-w-5xl">
    <header><p className="text-xs font-bold tracking-widest text-brand-coral">YOUR NEXT STEP</p><h1 className="mt-2 text-3xl font-extrabold text-brand-midnight sm:text-4xl">Get ready. Get work.</h1><p className="mt-3 text-brand-slate">Choose what you need today.</p></header>
    <ProfileNextActions />
    <section className="flex flex-col gap-4 rounded-2xl border border-brand-borderLight bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-brand-midnight">Make your next application count.</h2><p className="mt-1 text-sm text-brand-slate">Create a job-tailored pitch. Your first pitch is free.</p></div><Link href="/tools/pitch" className="shrink-0 rounded-xl border border-brand-indigo px-4 py-3 text-sm font-bold text-brand-indigo">Create my pitch →</Link></section>
    <HomeModule name="opportunities" load={() => LatestOpportunities()} />
    <nav aria-label="More on GigWay" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-brand-borderLight pt-5 text-sm font-semibold text-brand-indigo"><Link href="/work">Find work</Link><Link href="/network">My network</Link><Link href="/community">Community feed</Link><Link href="/profile">My profile</Link><Link href="/tools/verification">Get verified</Link></nav>
  </div></main>
}