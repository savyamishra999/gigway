import ProfileNextActions from "@/components/profile/ProfileNextActions"
import ProfileReady from "@/components/home/ProfileReady"
import RelevantPeople from "@/components/home/RelevantPeople"
import GigCardInspiration from "@/components/home/GigCardInspiration"
import { productVisibility } from "@/lib/product-visibility";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/server";
import { withDeadline } from "@/lib/async";
import { SectionUnavailable } from "@/components/layout/SectionStatus";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SocialHomeFeed from "@/components/social/SocialHomeFeed";
import { PeoplePreview, FindWorkEntry, LatestOpportunities } from "@/components/home/DiscoveryPreviews";
import { accessibleGlimpsPage, accessibleJoxPage, safePosts, socialPerf } from "@/lib/social/server";
import type { Post } from "@/components/social/SocialHomeFeed";
import IdentityCompletionPrompt from "@/components/home/IdentityCompletionPrompt";
import HomeActionGuide from "@/components/home/HomeActionGuide";

import JoxOrbitRail from "@/components/social/JoxOrbitRail";
import GlimpsRail from "@/components/social/GlimpsRail";
import { initialHomePosts } from "@/lib/home/primary";
import { HomeModule } from "@/components/home/HomeModule";

const getHomeProfile = cache(async (userId: string) => {
  const db = await createClient();
  const result = await db.from("profiles").select("full_name,username,avatar_url,tagline,bio,skills,location,job_function,portfolio_links,experience_description").eq("id", userId).maybeSingle();
  if (result.error) throw result.error;
  return result;
});
const getHomeIntents = cache(async (userId: string) => {
  const db = await createClient();
  const result = await db.from("profile_intents").select("intent_type").eq("profile_id", userId).eq("is_active", true);
  if (result.error) throw result.error;
  return result;
});
async function Opportunities() { return LatestOpportunities(); }
async function Network({ user }: { user: User }) {
  return PeoplePreview({viewerId: user.id, kind: "workplaces"});
}
async function Primary({ user }: { user: User }) {
  const page = await initialHomePosts(user.id);
  return <SocialHomeFeed opportunities={[]} network={[]} glimps={[]} jox={[]} initialPage={page} />;
}
async function Jox({ user }: { user: User }) {
  const page = await accessibleJoxPage(user.id, undefined, 10);
  return <JoxOrbitRail items={await safePosts(page.posts, user.id) as Post[]} />;
}
async function Glimps({ user }: { user: User }) {
  const page = await accessibleGlimpsPage(user.id, undefined, 8);
  return <GlimpsRail items={await safePosts(page.posts, user.id) as Post[]} />;
}
async function Activity({ user }: { user: User }) {
  try {
    const db = await createClient()
    const results = await withDeadline(Promise.all([
      db.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      db.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
      db.from("proposals").select("id", { count: "exact", head: true }).eq("freelancer_id", user.id),
    ]))
    if (results.some(result => result.error)) throw Error()
    return <div className="mt-3 grid grid-cols-3 gap-2 text-center">{["Unread", "Applied", "Proposals"].map((label, index) => <Link key={label} href={index ? "/profile" : "/messages"} className="rounded-xl bg-brand-ivory p-2"><b>{results[index].count || 0}</b><span className="block text-[10px] text-brand-slate">{label}</span></Link>)}</div>
  } catch { return <SectionUnavailable href="/home" label="Activity counts could not be loaded." /> }
}
export default async function HomeHub() {
  const startedAt = performance.now();
  const user = await getViewer();
  socialPerf("home_auth", startedAt);
  socialPerf("home_shell", startedAt)
  if (!user) return <main className="min-h-screen bg-brand-ivory px-4 py-20 text-center"><h1 className="text-h1 font-extrabold text-brand-midnight">Your next opportunity starts here.</h1><Link href="/login?mode=join&next=/home" className="mt-6 inline-block rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white">Join GigWay</Link></main>
  return <main className="min-h-screen max-w-full overflow-x-clip bg-brand-ivory pb-24 lg:pb-16"><div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
    <header className="mx-auto max-w-3xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">HOME</p><h1 className="mt-1 text-h2 font-extrabold text-brand-midnight sm:text-h1">Welcome back.</h1><p className="mt-1 text-body-sm text-brand-slate sm:text-body-lg">Professional conversations and opportunities, in one place.</p></header>

    <section aria-label="Professional tools" className="mx-auto max-w-5xl">
      <ProfileNextActions />
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-borderLight bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold text-brand-midnight">Make your next application count.</h2><p className="mt-1 text-sm text-brand-slate">Create a job-tailored pitch. Your first pitch is free.</p></div>
        <Link href="/tools/pitch" className="shrink-0 rounded-xl border border-brand-indigo px-4 py-3 text-sm font-bold text-brand-indigo">Create my pitch</Link>
      </div>
      <section aria-label="Professional verification" className="mb-5 rounded-2xl border border-brand-indigo/20 bg-white p-5">
        <h2 className="text-lg font-bold text-brand-midnight">Build trust with a verified profile</h2>
        <p className="mt-2 text-sm text-brand-slate">Show clients that GigWay has reviewed your professional details and public work evidence. After approval and payment, your public profile displays a Verified Professional badge for 365 days.</p>
        <p className="mt-2 text-xs text-brand-slate">Pay after approval. No automatic renewal. Verification does not guarantee jobs, clients or earnings.</p>
        <Link href="/tools/verification" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand-indigo px-4 py-2 text-sm font-bold text-white">Apply for verification - &#8377;299/year</Link>
      </section>
    </section>

    <div className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="w-full min-w-0"><HomeModule name="identity" load={() => ProfileReady({ userId: user.id })} />
      <HomeModule name="completion" load={() => IdentityCompletionPrompt({ userId: user.id, loadProfile: () => getHomeProfile(user.id), loadIntents: () => getHomeIntents(user.id) })} />
      <HomeModule name="primary" load={() => Primary({ user })} />
      <HomeModule name="opportunities" load={() => Opportunities()} />
      <HomeModule name="suggestions" load={() => RelevantPeople({ userId: user.id })} />
      <HomeModule name="network" load={() => Network({ user })} />
      <details className="my-4 rounded-xl border border-brand-borderLight bg-white p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold text-brand-indigo">Explore more ways to use GigWay</summary><HomeActionGuide key={user.id} userId={user.id} /></details>
      <details className="my-4 rounded-xl border border-brand-borderLight bg-white p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold text-brand-indigo">Find work</summary><FindWorkEntry /></details>
      <details className="my-4 rounded-xl border border-brand-borderLight bg-white p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold text-brand-indigo">Create your GigCard</summary><GigCardInspiration /></details>
      {productVisibility.joxCurrentProduct && <HomeModule name="jox" load={() => Jox({ user })} />}
      {productVisibility.glimpsCurrentProduct && <HomeModule name="glimps" load={() => Glimps({ user })} />}
      </div><aside className="mt-8 min-w-0 space-y-4"><section className="rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft"><h2 className="font-extrabold text-brand-midnight">Your activity</h2><HomeModule name="activity" load={() => Activity({ user })} /></section><section className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/[.04] p-4"><CheckCircle2 className="h-5 w-5 text-brand-indigo"/><h2 className="mt-2 font-extrabold text-brand-midnight">Get to know GigWay.</h2><Link href="/how-it-works" className="mt-3 inline-flex items-center gap-1 text-caption font-bold text-brand-indigo">How GigWay works <ArrowRight className="h-3.5 w-3.5"/></Link></section></aside></div>
  </div></main>
}
