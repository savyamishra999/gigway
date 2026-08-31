import Link from "next/link";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SocialHomeFeed from "@/components/social/SocialHomeFeed";
import { scoreOpportunity } from "@/lib/recommendations";
import { scoreIntentAwareOpportunity, scoreNetworkCandidate } from "@/lib/recommendations/intentRanking";
import { accessibleGlimpsPage, safePost } from "@/lib/social/server";
import type { Post } from "@/components/social/SocialHomeFeed";

const CANONICAL_INTENTS = new Set(["looking_for_work", "looking_for_project", "offering_services", "hiring_talent", "grow_network"]);

function compareRanked(a: { finalScore: number; created_at?: string | null; id: string }, b: { finalScore: number; created_at?: string | null; id: string }) {
  return b.finalScore - a.finalScore || (b.created_at || "").localeCompare(a.created_at || "") || a.id.localeCompare(b.id);
}

function networkBaseScore(profile: { skills?: string[] | null }, candidate: { skills?: string[] | null }) {
  const profileSkills = new Set((profile.skills || []).map((skill) => skill.trim().toLowerCase()));
  const matchingSkills = (candidate.skills || []).filter((skill) => profileSkills.has(skill.trim().toLowerCase()));
  return { baseScore: matchingSkills.length * 30, hasRelevantProfileSignal: matchingSkills.length > 0 };
}

export default async function HomeHub() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return <main className="min-h-screen bg-brand-ivory px-4 py-20 text-center"><h1 className="text-h1 font-extrabold text-brand-midnight">Your next opportunity starts here.</h1><Link href="/login" className="mt-6 inline-block rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white">Join GigWay</Link></main>;

  const [{ data: profile }, { data: jobs }, { data: projects }, { data: services }, { data: people }, { data: organizations }, { data: follows }, { data: entityFollows }, { data: intents }, { count: unread }, { count: applications }, { count: proposals }] = await Promise.all([
    db.from("profiles").select("full_name,skills,location,job_function").eq("id", user.id).maybeSingle(),
    db.from("jobs").select("id,title,company_name,location,category,skills_required,created_at,client_id").eq("status", "active").order("created_at", { ascending: false }).limit(60),
    db.from("projects").select("id,title,category,skills_required,created_at,client_id").eq("status", "open").order("created_at", { ascending: false }).limit(60),
    db.from("gigs").select("id,title,price,category,rating,image_url,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(12),
    db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills,created_at").neq("id", user.id).not("username", "is", null).order("created_at", { ascending: false }).limit(60),
    db.from("organizations").select("id,name,username,logo_url,tagline,industry,entity_type,created_at").not("username", "is", null).order("created_at", { ascending: false }).limit(60),
    db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", user.id),
    db.from("organization_follows").select("organization_id").eq("follower_user_id", user.id),
    db.from("profile_intents").select("intent_type").eq("profile_id", user.id).eq("is_active", true),
    db.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
    db.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
    db.from("proposals").select("id", { count: "exact", head: true }).eq("freelancer_id", user.id),
  ]);

  const activeIntents = new Set((intents || []).map((intent) => intent.intent_type).filter((intent) => CANONICAL_INTENTS.has(intent)));
  const signals = !!(profile?.skills?.length || profile?.location || profile?.job_function);
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

  const followed = new Set((follows || []).map((item) => item.followed_profile_id));
  const followedEntities = new Set((entityFollows || []).map((item) => item.organization_id));
  const rankedNetwork = [
    ...(people || []).filter((item) => !followed.has(item.id)).map((item) => { const relevance = networkBaseScore(currentProfile, item); return { item, kind: "person" as const, ...scoreNetworkCandidate({ ...relevance, kind: "person", intents: activeIntents }) }; }),
    ...(organizations || []).filter((item) => !followedEntities.has(item.id)).map((item) => { const kind = item.entity_type === "company" ? "company" as const : "organization" as const; return { item, kind, ...scoreNetworkCandidate({ baseScore: 0, hasRelevantProfileSignal: false, kind, intents: activeIntents }) }; }),
  ].sort((a, b) => compareRanked({ ...a, id: a.item.id, created_at: a.item.created_at }, { ...b, id: b.item.id, created_at: b.item.created_at })).slice(0, 12);
  const network = rankedNetwork.map(({ item, kind }) => kind === "person" ? { id: item.id, actorId: item.id, kind, name: item.full_name || "Professional", subtitle: item.tagline || item.skills?.slice(0, 2).join(" · "), href: `/u/${item.username}`, image: item.avatar_url } : { id: item.id, actorId: item.id, kind, name: item.name, subtitle: item.tagline || item.industry || (kind === "company" ? "Company" : "Organization"), href: `/u/${item.username}`, image: item.logo_url });

  const first = profile?.full_name?.split(" ")[0] || "there";
  const glimpsPage = await accessibleGlimpsPage(user.id, undefined, 8), glimps = await Promise.all(glimpsPage.posts.map((post) => safePost(post, user.id))) as Post[];
  return <main className="min-h-screen max-w-full overflow-x-clip bg-brand-ivory pb-24 lg:pb-16"><div className="mx-auto max-w-7xl px-4 py-8 sm:py-10"><header className="mx-auto max-w-3xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">GIGWAY NETWORK</p><h1 className="mt-2 text-h2 font-extrabold text-brand-midnight sm:text-h1">Welcome back, {first}.</h1><p className="mt-2 text-body-sm text-brand-slate sm:text-body-lg">Professional conversations and opportunities, in one place.</p><form action="/explore" className="relative mt-6 w-full"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-indigo"/><input name="q" placeholder="Search people, jobs, projects, services..." className="w-full rounded-pill border-2 border-brand-indigo/20 bg-white py-3.5 pl-12 pr-24 text-body-sm"/><button className="absolute right-2 top-2 rounded-pill bg-brand-indigo px-4 py-1.5 text-body-sm font-bold text-white">Search</button></form></header>{!signals && <p className="mx-auto mt-4 max-w-3xl rounded-xl border border-brand-indigo/20 bg-white p-3 text-sm text-brand-slate">Add skills or location to improve recommendations. <Link href="/profile/edit" className="font-bold text-brand-indigo">Edit profile</Link></p>}<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_260px]"><SocialHomeFeed opportunities={opportunities} network={network} glimps={glimps}/><aside className="mt-8 space-y-4"><section className="rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft"><h2 className="font-extrabold text-brand-midnight">Your activity</h2><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Link href="/messages" className="rounded-xl bg-brand-ivory p-2"><b>{unread || 0}</b><span className="block text-[10px] text-brand-slate">Unread</span></Link><Link href="/profile" className="rounded-xl bg-brand-ivory p-2"><b>{applications || 0}</b><span className="block text-[10px] text-brand-slate">Applied</span></Link><Link href="/profile" className="rounded-xl bg-brand-ivory p-2"><b>{proposals || 0}</b><span className="block text-[10px] text-brand-slate">Proposals</span></Link></div></section><section className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/[.04] p-4"><CheckCircle2 className="h-5 w-5 text-brand-indigo"/><h2 className="mt-2 font-extrabold text-brand-midnight">Build your professional edge.</h2><Link href="/ai-tools" className="mt-3 inline-flex items-center gap-1 text-caption font-bold text-brand-indigo">Explore tools <ArrowRight className="h-3.5 w-3.5"/></Link></section></aside></div></div></main>;
}
