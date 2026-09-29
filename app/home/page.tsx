import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/server";
import { withDeadline } from "@/lib/async";
import { SectionUnavailable } from "@/components/layout/SectionStatus";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SocialHomeFeed, { OpportunityRail, NetworkRail } from "@/components/social/SocialHomeFeed";
import { scoreOpportunity } from "@/lib/recommendations";
import { scoreIntentAwareOpportunity, scoreNetworkCandidate } from "@/lib/recommendations/intentRanking";
import { accessibleGlimpsPage, accessibleJoxPage, safePosts, socialPerf } from "@/lib/social/server";
import type { Post } from "@/components/social/SocialHomeFeed";
import { compactIntentLabels } from "@/lib/identity";
import IdentityCompletionPrompt from "@/components/home/IdentityCompletionPrompt";

import JoxOrbitRail from "@/components/social/JoxOrbitRail";
import GlimpsRail from "@/components/social/GlimpsRail";
import { initialHomePosts } from "@/lib/home/primary";
import { HomeModule } from "@/components/home/HomeModule";

const CANONICAL_INTENTS = new Set(["looking_for_work", "looking_for_project", "offering_services", "hiring_talent", "grow_network"]);

function compareRanked(a: { finalScore: number; created_at?: string | null; id: string }, b: { finalScore: number; created_at?: string | null; id: string }) {
  return b.finalScore - a.finalScore || (b.created_at || "").localeCompare(a.created_at || "") || a.id.localeCompare(b.id);
}

function networkBaseScore(profile: { skills?: string[] | null }, candidate: { skills?: string[] | null }) {
  const profileSkills = new Set((profile.skills || []).map((skill) => skill.trim().toLowerCase()));
  const matchingSkills = (candidate.skills || []).filter((skill) => profileSkills.has(skill.trim().toLowerCase()));
  return { baseScore: matchingSkills.length * 30, hasRelevantProfileSignal: matchingSkills.length > 0 };
}

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
// Two candidates per possible rail slot retain ranking headroom; services already cap at 12.
async function Opportunities({ user }: { user: User }) {
  const db = await createClient();
  const results = await Promise.all([
    getHomeProfile(user.id),
    db.from("jobs").select("id,title,company_name,location,category,skills_required,created_at,client_id").eq("status", "active").order("created_at", { ascending: false }).limit(24),
    db.from("projects").select("id,title,category,skills_required,created_at,client_id").eq("status", "open").order("created_at", { ascending: false }).limit(24),
    db.from("gigs").select("id,title,price,category,rating,image_url,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(12),
    getHomeIntents(user.id)
  ]);
  if (results.some(result => result.error)) throw Error("Home query failed");
  const [{ data: profile }, { data: jobs }, { data: projects }, { data: services }, { data: intents }] = results;
  const activeIntents = new Set((intents || []).map(intent => intent.intent_type).filter(intent => CANONICAL_INTENTS.has(intent)));
  const currentProfile = profile || {};
  const rankedOpportunities = [
    ...(jobs || []).filter((item) => item.client_id !== user.id).map((row) => { const relevance = scoreOpportunity(currentProfile, row); return { row, kind: "job" as const, ...relevance, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "job", intents: activeIntents }) }; }),
    ...(projects || []).filter((item) => item.client_id !== user.id).map((row) => { const relevance = scoreOpportunity(currentProfile, row); return { row, kind: "project" as const, ...relevance, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "project", intents: activeIntents }) }; }),
    ...(services || []).map((row) => { const relevance = scoreOpportunity(currentProfile, row); return { row, kind: "service" as const, ...relevance, ...scoreIntentAwareOpportunity({ baseScore: relevance.score, kind: "service", intents: activeIntents }) }; }),
  ].sort((a, b) => compareRanked({ ...a, id: a.row.id, created_at: a.row.created_at }, { ...b, id: b.row.id, created_at: b.row.created_at })).slice(0, 12);
  const opportunities = rankedOpportunities.map(({ row, kind, skills }) => {
    if (kind === "job") return { id: row.id, kind, title: row.title, subtitle: [skills.length ? `Matches ${skills.length} skill${skills.length === 1 ? "" : "s"}` : null, row.company_name, row.location].filter(Boolean).join(" · "), href: `/jobs/${row.id}`, cta: "View Job / Apply" };
    if (kind === "project") return { id: row.id, kind, title: row.title, subtitle: [skills.length ? `Matches ${skills.length} skill${skills.length === 1 ? "" : "s"}` : null, row.category || "Open project"].filter(Boolean).join(" · "), href: `/projects/${row.id}`, cta: "View Project / Send Proposal" };
    return { id: row.id, kind, title: row.title, subtitle: [row.price ? `From ₹${Number(row.price).toLocaleString()}` : null, row.category, row.rating ? `${row.rating} rating` : null].filter(Boolean).join(" · "), href: `/gigs/${row.id}`, image: row.image_url, cta: "View Service" };
  });

  return <>{!(profile?.skills?.length || profile?.location || profile?.job_function) && <p className="mx-auto mt-4 max-w-3xl rounded-xl border border-brand-indigo/20 bg-white p-3 text-sm text-brand-slate">Add skills or location to improve recommendations. <Link href="/profile/edit" className="font-bold text-brand-indigo">Edit profile</Link></p>}<OpportunityRail items={opportunities} /></>;
}
async function Network({ user }: { user: User }) {
  const db = await createClient();
  const results = await Promise.all([
    getHomeProfile(user.id),
    db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills,created_at").neq("id", user.id).not("username", "is", null).order("created_at", { ascending: false }).limit(24),
    db.from("organizations").select("id,name,username,logo_url,tagline,industry,entity_type,created_at").not("username", "is", null).order("created_at", { ascending: false }).limit(24),
    db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", user.id),
    db.from("organization_follows").select("organization_id").eq("follower_user_id", user.id),
    getHomeIntents(user.id)
  ]);
  if (results.some(result => result.error)) throw Error("Home query failed");
  const [{ data: profile }, { data: people }, { data: organizations }, { data: follows }, { data: entityFollows }, { data: intents }] = results;
  const activeIntents = new Set((intents || []).map(intent => intent.intent_type).filter(intent => CANONICAL_INTENTS.has(intent)));
  const currentProfile = profile || {};
  const followed = new Set((follows || []).map((item) => item.followed_profile_id));
  const followedEntities = new Set((entityFollows || []).map((item) => item.organization_id));
  const rankedNetwork = [
    ...(people || []).filter((item) => !followed.has(item.id)).map((item) => { const relevance = networkBaseScore(currentProfile, item); return { item, kind: "person" as const, ...scoreNetworkCandidate({ ...relevance, kind: "person", intents: activeIntents }) }; }),
    ...(organizations || []).filter((item) => !followedEntities.has(item.id)).map((item) => { const kind = item.entity_type === "company" ? "company" as const : "organization" as const; return { item, kind, ...scoreNetworkCandidate({ baseScore: 0, hasRelevantProfileSignal: false, kind, intents: activeIntents }) }; }),
  ].sort((a, b) => compareRanked({ ...a, id: a.item.id, created_at: a.item.created_at }, { ...b, id: b.item.id, created_at: b.item.created_at })).slice(0, 12);
  // Intent labels do not affect ranking. Fetch them only for people we will show.
  const peopleIds = rankedNetwork.filter(candidate => candidate.kind === "person").map(candidate => candidate.item.id)
  const { data: peopleIntents, error: intentsError } = peopleIds.length
    ? await db.from("profile_intents").select("profile_id,intent_type").in("profile_id", peopleIds).eq("is_active", true)
    : { data: [] as { profile_id: string; intent_type: string }[], error: null }
  if (intentsError) throw intentsError;
  const intentsByProfile = new Map<string, string[]>()
  for (const intent of peopleIntents || []) intentsByProfile.set(intent.profile_id, [...(intentsByProfile.get(intent.profile_id) || []), intent.intent_type])

  const network = rankedNetwork.map(({ item, kind }) => kind === "person" ? { id: item.id, actorId: item.id, kind, name: item.full_name || "Professional", subtitle: [item.tagline || item.skills?.slice(0, 2).join(" · "), compactIntentLabels(intentsByProfile.get(item.id)).join(" · ")].filter(Boolean).join(" · "), href: `/u/${item.username}`, image: item.avatar_url } : { id: item.id, actorId: item.id, kind, name: item.name, subtitle: item.tagline || item.industry || (kind === "company" ? "Workplace / Company" : "Workplace"), href: `/u/${item.username}`, image: item.logo_url });

  return <NetworkRail items={network} />;
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
  if (!user) return <main className="min-h-screen bg-brand-ivory px-4 py-20 text-center"><h1 className="text-h1 font-extrabold text-brand-midnight">Your next opportunity starts here.</h1><Link href="/login?next=/home" className="mt-6 inline-block rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white">Join GigWay</Link></main>
  return <main className="min-h-screen max-w-full overflow-x-clip bg-brand-ivory pb-24 lg:pb-16"><div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
    <header className="mx-auto max-w-3xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">GIGWAY NETWORK</p><h1 className="mt-1 text-h2 font-extrabold text-brand-midnight sm:text-h1">Welcome back.</h1><p className="mt-1 text-body-sm text-brand-slate sm:text-body-lg">Professional conversations and opportunities, in one place.</p></header>

    <div className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="w-full min-w-0"><HomeModule name="primary" load={() => Primary({ user })} />
      <HomeModule name="opportunities" load={() => Opportunities({ user })} />
      <HomeModule name="network" load={() => Network({ user })} />
      <HomeModule name="jox" load={() => Jox({ user })} />
      <HomeModule name="glimps" load={() => Glimps({ user })} />
      <HomeModule name="completion" load={() => IdentityCompletionPrompt({ userId: user.id, loadProfile: () => getHomeProfile(user.id), loadIntents: () => getHomeIntents(user.id) })} /></div><aside className="mt-8 min-w-0 space-y-4"><section className="rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft"><h2 className="font-extrabold text-brand-midnight">Your activity</h2><HomeModule name="activity" load={() => Activity({ user })} /></section><section className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/[.04] p-4"><CheckCircle2 className="h-5 w-5 text-brand-indigo"/><h2 className="mt-2 font-extrabold text-brand-midnight">Build your professional edge.</h2><Link href="/ai-tools" className="mt-3 inline-flex items-center gap-1 text-caption font-bold text-brand-indigo">Explore tools <ArrowRight className="h-3.5 w-3.5"/></Link></section></aside></div>
  </div></main>
}
