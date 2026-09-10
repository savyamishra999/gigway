import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { accessibleGlimps, accessibleJoxPage, canViewPost, safePost, SOCIAL_POST_FIELDS, socialDb } from "@/lib/social/server";
import type { Post } from "@/components/social/SocialHomeFeed";
import { PostCard } from "@/components/social/SocialHomeFeed";
import JoxOrbitRail from "@/components/social/JoxOrbitRail";
import GlimpsRail from "@/components/social/GlimpsRail";

const tabs = ["all", "people", "posts", "jox", "glimps", "jobs"] as const;
type Tab = typeof tabs[number];

export default async function SocialExplore({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string; tab?: string }> }) {
  const params = await searchParams;
  const query = (params.tag || params.q || "").trim().replace(/^#/, "").slice(0, 80);
  const tab: Tab = tabs.includes(params.tab as Tab) ? params.tab as Tab : "all";
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  const db = socialDb();
  const like = `%${query.replace(/[%_(),]/g, " ")}%`;
  let people = db.from("profiles").select("id,full_name,username,avatar_url,tagline").eq("profile_completed", true).order("created_at", { ascending: false }).limit(12);
  let jobs = db.from("jobs").select("id,title,company_name,location").eq("status", "active").order("created_at", { ascending: false }).limit(12);
  let posts = db.from("posts").select(SOCIAL_POST_FIELDS).eq("status", "published").order("created_at", { ascending: false }).limit(30);
  if (query) {
    people = people.or(`full_name.ilike.${like},username.ilike.${like}`);
    jobs = jobs.or(`title.ilike.${like},company_name.ilike.${like}`);
    posts = posts.ilike("body", like);
  }
  const [peopleRes, jobsRes, postsRes, joxPage, glimpsRows] = await Promise.all([people, jobs, posts, accessibleJoxPage(user?.id, undefined, 8), accessibleGlimps(user?.id, 8)]);
  const visible: Post[] = [];
  for (const post of postsRes.data || []) if (await canViewPost(post as any, user?.id)) visible.push(await safePost(post as any, user?.id) as Post);
  const [rawJox, rawGlimps] = await Promise.all([Promise.all(joxPage.posts.map((post) => safePost(post, user?.id))), Promise.all(glimpsRows.map((post) => safePost(post, user?.id)))]) as [Post[], Post[]];
  const includesQuery = (post: Post) => !query || (post.body || "").toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const jox = rawJox.filter(includesQuery);
  const glimps = rawGlimps.filter(includesQuery);
  const topics = [...new Set(visible.flatMap((post) => post.body?.match(/#[\p{L}\p{N}_]{1,64}/gu) || []))].slice(0, 8);
  const show = (name: Tab) => tab === "all" || tab === name;
  const empty = query && (tab === "people" ? !peopleRes.data?.length : tab === "posts" ? !visible.length : tab === "jox" ? !jox.length : tab === "glimps" ? !glimps.length : tab === "jobs" ? !jobsRes.data?.length : !peopleRes.data?.length && !visible.length && !jox.length && !glimps.length && !jobsRes.data?.length);

  return <main className="min-h-screen bg-brand-ivory px-4 py-6 pb-24"><section className="mx-auto max-w-3xl">
    <header>
      <p className="text-caption font-bold tracking-[.16em] text-brand-coral">EXPLORE GIGWAY</p>
      <h1 className="mt-1 text-h2 font-extrabold text-brand-midnight">Find people, ideas and work.</h1>
      <form className="relative mt-4" action="/social/explore"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-indigo" /><input name="q" defaultValue={params.q || params.tag || ""} placeholder="Search GigWay" className="w-full rounded-xl border border-brand-indigo/25 bg-white py-3 pl-10 pr-4 text-body-sm outline-none focus:border-brand-indigo" /></form>
      <nav className="mt-4 flex gap-4 overflow-x-auto border-b border-brand-borderLight [scrollbar-width:none]">{tabs.map((item) => <Link key={item} href={`/social/explore?${query ? `q=${encodeURIComponent(query)}&` : ""}tab=${item}`} className={`shrink-0 border-b-2 py-2 text-caption font-bold ${tab === item ? "border-brand-indigo text-brand-indigo" : "border-transparent text-brand-slate"}`}>{item.toUpperCase()}</Link>)}</nav>
    </header>
    {query && <p className="mt-4 text-body-sm text-brand-slate">{params.tag ? `Topic #${query}` : `Results for "${query}"`}</p>}
    {!query && show("all") && <section className="mt-6"><h2 className="font-extrabold text-brand-midnight">Topics</h2><div className="mt-2 flex flex-wrap gap-2">{topics.length ? topics.map((topic) => <Link key={topic} href={`/social/explore?tag=${encodeURIComponent(topic.slice(1))}`} className="rounded-lg bg-violet-50 px-3 py-2 text-caption font-semibold text-violet-700">{topic}</Link>) : <p className="text-body-sm text-brand-slate">Topics will appear as professionals share them.</p>}</div></section>}
    {show("people") && <section className="mt-6"><h2 className="font-extrabold text-brand-midnight">{query ? "People" : "People to discover"}</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleRes.data || []).map((person) => <Link key={person.id} href={`/u/${person.username}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-brand-borderLight bg-white p-3"><span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-indigo/10">{person.avatar_url && <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><b className="block truncate text-body-sm text-brand-midnight">{person.full_name}</b><span className="block truncate text-caption text-brand-indigo">@{person.username}</span></span></Link>)}</div></section>}
    {show("jox") && <JoxOrbitRail items={jox} />}
    {show("glimps") && <GlimpsRail items={glimps} />}
    {show("posts") && <section className="mt-6"><h2 className="font-extrabold text-brand-midnight">Posts</h2><div className="mt-3 space-y-3">{visible.map((post) => <PostCard key={post.id} post={post} />)}</div></section>}
    {show("jobs") && <section className="mt-6"><h2 className="font-extrabold text-brand-midnight">{query ? "Jobs" : "Latest opportunities"}</h2><div className="mt-3 space-y-2">{(jobsRes.data || []).map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-xl border border-brand-borderLight bg-white p-3"><b className="block text-brand-midnight">{job.title}</b><span className="text-caption text-brand-slate">{[job.company_name, job.location].filter(Boolean).join(" / ")}</span></Link>)}</div></section>}
    {empty && <p className="mt-8 rounded-xl border border-brand-borderLight bg-white p-4 text-body-sm text-brand-slate">No accessible results for this search yet. Try another word, person, topic, or tab.</p>}
  </section></main>;
}
