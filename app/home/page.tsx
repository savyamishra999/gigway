import Link from "next/link";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SocialHomeFeed from "@/components/social/SocialHomeFeed";
import { scoreOpportunity } from "@/lib/recommendations";

export default async function HomeHub() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return <main className="min-h-screen bg-brand-ivory px-4 py-20 text-center"><h1 className="text-h1 font-extrabold text-brand-midnight">Your next opportunity starts here.</h1><Link href="/login" className="mt-6 inline-block rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white">Join GigWay</Link></main>;

  const [
    { data: profile }, { data: jobs }, { data: projects }, { data: services }, { data: people }, { data: organizations }, { data: follows }, { data: entityFollows }, { data: intents }, { count: unread }, { count: applications }, { count: proposals },
  ] = await Promise.all([
    db.from("profiles").select("full_name,skills,location,job_function").eq("id", user.id).maybeSingle(),
    db.from("jobs").select("id,title,company_name,location,category,skills_required,created_at,client_id").eq("status", "active").order("created_at", { ascending: false }).limit(60),
    db.from("projects").select("id,title,category,skills_required,created_at,client_id").eq("status", "open").order("created_at", { ascending: false }).limit(60),
    db.from("gigs").select("id,title,price,category,rating,image_url,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(6),
    db.from("profiles").select("id,full_name,username,avatar_url,tagline,skills,is_verified").neq("id", user.id).not("username", "is", null).order("created_at", { ascending: false }).limit(60),
    db.from("organizations").select("id,name,username,logo_url,tagline,industry").not("username", "is", null).order("created_at", { ascending: false }).limit(60),
    db.from("profile_follows").select("followed_profile_id").eq("follower_user_id", user.id),
    db.from("organization_follows").select("organization_id").eq("follower_user_id", user.id),
    db.from("profile_intents").select("intent_type").eq("profile_id", user.id).eq("is_active", true),
    db.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
    db.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
    db.from("proposals").select("id", { count: "exact", head: true }).eq("freelancer_id", user.id),
  ]);

  const signals = !!(profile?.skills?.length || profile?.location || profile?.job_function);
  const findJobs = (intents || []).some((x) => x.intent_type === "looking_for_work");
  const offer = (intents || []).some((x) => x.intent_type === "offering_services");
  const rank = (rows: any[]) => rows.map((row) => ({ row, ...scoreOpportunity(profile || {}, row) })).sort((a, b) => signals ? b.score - a.score : b.row.created_at.localeCompare(a.row.created_at)).slice(0, 6);
  const jobRows = rank((jobs || []).filter((x) => x.client_id !== user.id));
  const projectRows = rank((projects || []).filter((x) => x.client_id !== user.id));
  const followed = new Set((follows || []).map((x) => x.followed_profile_id));
  const followedEntities = new Set((entityFollows || []).map((x) => x.organization_id));
  const first = profile?.full_name?.split(" ")[0] || "there";

  return <main className="min-h-screen max-w-full overflow-x-clip bg-brand-ivory pb-24 lg:pb-16"><div className="mx-auto max-w-7xl px-4 py-8 sm:py-10"><header className="mx-auto max-w-3xl"><p className="text-caption font-bold tracking-[.16em] text-brand-coral">GIGWAY NETWORK</p><h1 className="mt-2 text-h2 font-extrabold text-brand-midnight sm:text-h1">Welcome back, {first}.</h1><p className="mt-2 text-body-sm text-brand-slate sm:text-body-lg">Professional conversations and opportunities, in one place.</p><form action="/explore" className="relative mt-6 w-full"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-indigo"/><input name="q" placeholder="Search people, jobs, projects, services..." className="w-full rounded-pill border-2 border-brand-indigo/20 bg-white py-3.5 pl-12 pr-24 text-body-sm"/><button className="absolute right-2 top-2 rounded-pill bg-brand-indigo px-4 py-1.5 text-body-sm font-bold text-white">Search</button></form></header>{!signals && <p className="mx-auto mt-4 max-w-3xl rounded-xl border border-brand-indigo/20 bg-white p-3 text-sm text-brand-slate">Add skills or location to improve recommendations. <Link href="/profile/edit" className="font-bold text-brand-indigo">Edit profile</Link></p>}<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_260px]"><SocialHomeFeed jobRailTitle={signals && findJobs ? "Jobs for You" : "Latest Jobs"} projectRailTitle={signals && offer ? "Projects for You" : "Latest Projects"} serviceRailTitle={signals ? "Services for You" : "Latest Services"} jobs={jobRows.map(({ row, skills }) => ({ id: row.id, title: row.title, subtitle: [skills.length ? `Matches ${skills.length} skill${skills.length === 1 ? "" : "s"}` : null, row.company_name, row.location].filter(Boolean).join(" · "), href: `/jobs/${row.id}` }))} projects={projectRows.map(({ row, skills }) => ({ id: row.id, title: row.title, subtitle: [skills.length ? `Matches ${skills.length} skill${skills.length === 1 ? "" : "s"}` : null, row.category || "Open project"].filter(Boolean).join(" · "), href: `/projects/${row.id}` }))} services={(services || []).map((service) => ({ id: service.id, title: service.title, subtitle: [service.price ? `From ₹${Number(service.price).toLocaleString()}` : null, service.category, service.rating ? `${service.rating} rating` : null].filter(Boolean).join(" · "), href: `/gigs/${service.id}`, image: service.image_url }))} people={(people || []).filter((person) => !followed.has(person.id)).slice(0, 6).map((person) => ({ id: person.id, name: person.full_name || "Professional", subtitle: person.tagline || person.skills?.slice(0, 2).join(" · "), href: `/u/${person.username}`, image: person.avatar_url }))} organizations={(organizations || []).filter((organization) => !followedEntities.has(organization.id)).slice(0, 6).map((organization) => ({ id: organization.id, name: organization.name, subtitle: organization.tagline || organization.industry || "Organization", href: `/u/${organization.username}`, image: organization.logo_url }))}/><aside className="mt-8 space-y-4"><section className="rounded-2xl border border-brand-borderLight bg-white p-4 shadow-soft"><h2 className="font-extrabold text-brand-midnight">Your activity</h2><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Link href="/messages" className="rounded-xl bg-brand-ivory p-2"><b>{unread || 0}</b><span className="block text-[10px] text-brand-slate">Unread</span></Link><Link href="/profile" className="rounded-xl bg-brand-ivory p-2"><b>{applications || 0}</b><span className="block text-[10px] text-brand-slate">Applied</span></Link><Link href="/profile" className="rounded-xl bg-brand-ivory p-2"><b>{proposals || 0}</b><span className="block text-[10px] text-brand-slate">Proposals</span></Link></div></section><section className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/[.04] p-4"><CheckCircle2 className="h-5 w-5 text-brand-indigo"/><h2 className="mt-2 font-extrabold text-brand-midnight">Build your professional edge.</h2><Link href="/ai-tools" className="mt-3 inline-flex items-center gap-1 text-caption font-bold text-brand-indigo">Explore tools <ArrowRight className="h-3.5 w-3.5"/></Link></section></aside></div></div></main>;
}
