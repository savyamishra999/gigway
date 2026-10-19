import Link from "next/link"
const tools = [
 {title: "Check Resume Score", copy: "Free score and preview. Full analysis and PDF for Rs 49 per report.", href: "/tools/resume-analyzer", cta: "Check my resume"},
 {title: "Job-Tailored Pitch", copy: "First pitch free. GigWay Pro costs Rs 149 for 30 days; usage limits apply. No auto-renewal.", href: "/tools/pitch", cta: "Create my pitch"},
 {title: "Verified Professional", copy: "Professional work review, then Rs 299 for a 365-day public profile badge after approval.", href: "/tools/verification", cta: "Apply for verification"},
 {title: "GigCard Studio", copy: "Design your professional visiting card. Download and sharing options are shown in the studio.", href: "/profile/gigcard", cta: "Design my card"},
 {title: "Profile Intelligence", copy: "Explore your profile score and strengths. Preview available; full report coming soon.", href: "/tools/profile-intelligence", cta: "Open free preview"},
 {title: "Opportunity Match", copy: "Compare your profile with an opportunity. Preview available; full report coming soon.", href: "/tools/opportunity-match", cta: "Open free preview"},
]
export default function Page() {
 return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-28"><div className="mx-auto max-w-5xl">
  <h1 className="text-3xl font-extrabold text-brand-midnight">Professional Tools</h1><p className="mt-2 text-brand-slate">Choose a tool for your next opportunity.</p>
  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((t, index) => <article key={t.href} className={`flex flex-col rounded-2xl border p-5 ${index === 0 ? "border-brand-indigo bg-brand-indigo text-white shadow-elevated" : "border-brand-borderLight bg-white text-brand-midnight"}`}><h2 className="text-xl font-bold">{t.title}</h2><p className={`my-4 text-sm leading-6 ${index === 0 ? "text-white/80" : "text-brand-slate"}`}>{t.copy}</p><Link href={t.href} className={`mt-auto inline-flex min-h-11 items-center font-bold ${index === 0 ? "text-white" : "text-brand-indigo"}`}>{t.cta}</Link></article>)}</div>
  <section aria-label="Coming soon" className="mt-8"><h2 className="text-xl font-bold text-brand-midnight">Coming Soon</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{["Profile Intelligence Full Report", "Opportunity Match Full Report"].map(title => <article key={title} className="rounded-2xl border border-brand-borderLight bg-slate-50 p-5"><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">Coming Soon</span><h3 className="mt-4 text-lg font-bold text-brand-midnight">{title}</h3><p className="mt-2 text-sm text-brand-slate">Full-report unlock is not available yet. You can use the preview above.</p><button disabled className="mt-4 min-h-11 cursor-not-allowed rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-500">Not available yet</button></article>)}</div></section>
  <p className="mt-6 text-sm text-brand-slate">Profiles, work discovery and community participation stay free.</p>
 </div></main>
}
