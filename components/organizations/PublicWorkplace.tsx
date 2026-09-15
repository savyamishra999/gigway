import Link from "next/link"
import { Building2, CheckCircle2, MapPin } from "lucide-react"
import { socialDb } from "@/lib/social/server"
import { publicWorkplaceDb, workplacePeopleCount, workplacePeople, workplaceOpportunities, workplaceWebsite, WORKPLACE_SECTIONS, type WorkplaceSection, type PublicRows, type Person, type Opportunity } from "@/lib/organizations/public"
import OrganizationFollowButton from "@/components/organizations/OrganizationFollowButton"
import OrganizationSocialFeed from "@/components/social/OrganizationSocialFeed"

export type WorkplaceIdentity = {
  id: string; name: string; username: string; logo_url: string | null; cover_url: string | null;
  tagline: string | null; description: string | null; website: string | null; industry: string | null;
  company_size: string | null; founded_year: number | null; location: string | null; country: string | null;
  entity_type: string | null; is_verified: boolean | null;
}
const action = "inline-flex items-center justify-center rounded-xl border border-brand-borderLight px-4 py-2.5 text-sm font-semibold text-brand-indigo"
const panel = "min-w-0 rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-6"
function Empty({ error, children }: { error: boolean; children: React.ReactNode }) {
  return <p role={error ? "alert" : undefined} className="py-4 text-sm text-brand-slate">{error ? "This section could not be loaded. Please try again." : children}</p>
}
function People({ rows }: { rows: PublicRows<Person> }) {
  if (rows.error || !rows.items.length) return <Empty error={rows.error}>No team members are listed yet.</Empty>
  return <div className="grid gap-3 sm:grid-cols-2">{rows.items.map(person => <Link key={person.id} href={`/u/${person.username}`} className="flex min-w-0 items-start gap-3 rounded-xl border border-brand-borderLight p-3 hover:border-brand-indigo/40">
    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-indigo/10 text-brand-indigo">{person.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : person.full_name?.[0] || "P"}</div>
    <div className="min-w-0"><h3 className="break-words font-bold text-brand-midnight">{person.full_name || person.username}</h3><p className="text-sm capitalize text-brand-slate">{person.role}</p><p className="break-all text-xs text-brand-slate">@{person.username}</p>{person.tagline && <p className="mt-1 line-clamp-2 break-words text-sm text-brand-slate">{person.tagline}</p>}<span className="mt-2 block text-xs font-semibold text-brand-indigo">View Profile</span></div>
  </Link>)}</div>
}
function Opportunities({ rows, kind }: { rows: PublicRows<Opportunity>; kind: "jobs" | "projects" }) {
  if (rows.error || !rows.items.length) return <Empty error={rows.error}>{kind === "jobs" ? "No open jobs right now." : "No active projects right now."}</Empty>
  return <div className="grid gap-3 sm:grid-cols-2">{rows.items.map(item => <Link key={item.id} href={`/${kind}/${item.id}`} className="min-w-0 rounded-xl border border-brand-borderLight p-4 hover:border-brand-indigo/40">
    <p className="text-xs font-semibold text-brand-indigo">{kind === "jobs" ? "Open job" : "Open project"}</p><h3 className="mt-2 break-words font-bold text-brand-midnight">{item.title}</h3>
    <p className="mt-2 break-words text-sm capitalize text-brand-slate">{[item.location, item.job_type, item.category, item.project_type].filter(Boolean).join(" / ")}</p>
    {item.budget != null && <p className="mt-2 text-sm text-brand-midnight">Budget: INR {Number(item.budget).toLocaleString("en-IN")}</p>}
    {!!item.skills_required?.length && <p className="mt-2 break-words text-xs text-brand-slate">{item.skills_required.slice(0, 4).join(" / ")}</p>}
    <p className="mt-3 text-xs text-brand-slate">Posted <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></p>
  </Link>)}</div>
}
export default async function PublicWorkplace({ organization: org, viewerId, section, page }: { organization: WorkplaceIdentity; viewerId?: string; section: WorkplaceSection; page: number }) {
  const db = publicWorkplaceDb(), authority = socialDb(), home = section === "home"
  const [{ count: followers, error: followersError }, membership, following, people, jobs, projects, peopleCount] = await Promise.all([
    authority.from("organization_follows").select("organization_id", { count: "exact", head: true }).eq("organization_id", org.id),
    viewerId ? authority.from("organization_members").select("member_role").eq("organization_id", org.id).eq("profile_id", viewerId).eq("status", "active").maybeSingle() : Promise.resolve({ data: null }),
    viewerId ? authority.from("organization_follows").select("organization_id").eq("organization_id", org.id).eq("follower_user_id", viewerId).maybeSingle() : Promise.resolve({ data: null }),
    home || section === "people" ? workplacePeople(db, org.id, home ? 4 : 12, home ? 1 : page) : Promise.resolve(null),
    home || section === "jobs" ? workplaceOpportunities(db, "jobs", org.id, home ? 3 : 12, home ? 1 : page) : Promise.resolve(null),
    home || section === "projects" ? workplaceOpportunities(db, "projects", org.id, home ? 3 : 12, home ? 1 : page) : Promise.resolve(null),
    workplacePeopleCount(db, org.id),
  ])
  const isAdmin = !!membership.data && ["owner", "admin"].includes(membership.data.member_role)
  const base = `/u/${org.username}`, href = (tab: string) => `${base}?section=${tab}#workplace-sections`
  const website = workplaceWebsite(org.website), location = [org.location, org.country].filter(Boolean).join(", ")
  const aboutRows = [["Industry", org.industry], ["Type", org.entity_type === "company" ? "Company" : org.entity_type === "organization" ? "Organization" : null], ["Company size", org.company_size], ["Founded", org.founded_year], ["Location", org.location], ["Country", org.country]].filter(([, value]) => value)
  const header = (title: string, tab: string, create?: { label: string; href: string }) => <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="min-w-0 [overflow-wrap:anywhere] text-xl font-bold text-brand-midnight">{title}</h2><div className="flex flex-wrap gap-3">{home && <Link prefetch={false} href={href(tab)} className="text-sm font-semibold text-brand-indigo">View All<span className="sr-only"> {title}</span></Link>}{isAdmin && create && <Link href={create.href} className="text-sm font-semibold text-brand-indigo">{create.label}</Link>}</div></div>
  const pagination = (rows: { hasMore: boolean; error: boolean }) => !home && !rows.error && <nav aria-label="Section pages" className="mt-5 flex flex-wrap gap-3">{page > 1 && <Link prefetch={false} className={action} href={`${base}?section=${section}&page=${page - 1}#workplace-sections`}>Previous</Link>}{rows.hasMore && page < 1000 && <Link prefetch={false} className={action} href={`${base}?section=${section}&page=${page + 1}#workplace-sections`}>Next</Link>}</nav>
  return <main className="min-h-screen bg-brand-ivory pb-28">
    <div className="h-36 bg-gradient-to-r from-brand-midnight to-brand-indigo sm:h-52">{org.cover_url && <img src={org.cover_url} alt="" className="h-full w-full object-cover" />}</div>
    <div className="mx-auto max-w-5xl px-4">
      <header className={`${panel} relative -mt-10 shadow-soft`}>
        <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-ivory text-brand-indigo ring-4 ring-white">{org.logo_url ? <img src={org.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10" />}</div>
          <div className="w-full min-w-0 max-w-full flex-1"><p className="text-xs font-bold uppercase tracking-widest text-brand-indigo">Workplace</p><div className="mt-2 flex flex-wrap items-center gap-2"><h1 className="min-w-0 [overflow-wrap:anywhere] text-2xl font-extrabold text-brand-midnight sm:text-3xl">{org.name}</h1>{org.is_verified && <CheckCircle2 aria-label="Verified Workplace" className="h-5 w-5 shrink-0 text-brand-indigo" />}</div><p className="mt-1 break-all text-sm text-brand-slate">@{org.username}</p><p className="mt-2 [overflow-wrap:anywhere] text-sm font-semibold text-brand-midnight">{[org.entity_type === "company" ? "Company" : null, org.industry].filter(Boolean).join(" / ")}</p>{location && <p className="mt-2 flex items-start gap-1 text-sm text-brand-slate"><MapPin className="h-4 w-4 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{location}</span></p>}{org.tagline && <p className="mt-3 [overflow-wrap:anywhere] text-sm leading-6 text-brand-slate">{org.tagline}</p>}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-brand-midnight">
          {!followersError && <p>{(followers || 0).toLocaleString("en-IN")} Followers</p>}
          {peopleCount !== null && <p>{peopleCount.toLocaleString("en-IN")} {peopleCount === 1 ? "person" : "people"}</p>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{viewerId ? <OrganizationFollowButton organizationId={org.id} initialFollowing={!!following.data} /> : <Link className={action} href={`/login?next=${encodeURIComponent(base)}`}>Follow</Link>}<Link className={action} href={href("jobs")}>View Jobs</Link>{website && <a className={action} href={website} target="_blank" rel="noopener noreferrer">Visit Website</a>}{isAdmin && <Link className={action} href={`/organizations/${org.username}/edit`}>Manage Workplace</Link>}</div>
      </header>
      <nav id="workplace-sections" aria-label="Workplace sections" className="my-5 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-brand-borderLight bg-white p-1 [scroll-margin-top:5rem]">{WORKPLACE_SECTIONS.map(tab => <Link key={tab} prefetch={false} href={href(tab)} aria-current={section === tab ? "page" : undefined} className={`shrink-0 rounded-lg px-4 py-3 text-sm font-semibold capitalize ${section === tab ? "bg-brand-indigo text-white" : "text-brand-slate hover:bg-brand-ivory"}`}>{tab}</Link>)}</nav>
      <div className="space-y-5">
        {(home || section === "about") && <section className={panel}>{header(`About ${org.name}`, "about")}{org.description ? <p className={`${home ? "line-clamp-3" : "whitespace-pre-line"} break-words text-sm leading-7 text-brand-slate`}>{org.description}</p> : home && <p className="text-sm text-brand-slate">Explore our people, opportunities and latest updates.</p>}{!home && <dl className="mt-5 grid gap-4 sm:grid-cols-2">{aboutRows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-brand-slate">{label}</dt><dd className="mt-1 [overflow-wrap:anywhere] text-sm text-brand-midnight">{value}</dd></div>)}{website && <div><dt className="text-xs font-semibold text-brand-slate">Website</dt><dd className="mt-1 break-all text-sm text-brand-indigo"><a href={website} target="_blank" rel="noopener noreferrer">{new URL(website).hostname}</a></dd></div>}</dl>}</section>}
        {people && <section className={panel}>{header("People", "people")}<People rows={people} />{pagination(people)}</section>}
        {jobs && <section className={panel}>{header("Open Jobs", "jobs", { label: "Post a Job", href: `/jobs/new?organization=${org.id}` })}<Opportunities rows={jobs} kind="jobs" />{pagination(jobs)}</section>}
        {projects && <section className={panel}>{header("Projects", "projects", { label: "Post a Project", href: `/projects/new?organization=${org.id}` })}<Opportunities rows={projects} kind="projects" />{pagination(projects)}</section>}
        {(home || section === "content") && <section className={panel}>{header(home ? "Recent Workplace Content" : "Content", "content", { label: "Create Post", href: `/social/create?organization=${org.id}` })}<OrganizationSocialFeed key={`${org.id}:${section}`} organizationId={org.id} isAdmin={isAdmin} preview={home} /></section>}
      </div>
    </div>
  </main>
}
