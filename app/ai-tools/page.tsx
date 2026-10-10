import Link from "next/link"
const tools = [
  { name: "Resume Intelligence", description: "Review your resume's strengths and areas to improve.", href: "/tools/resume-analyzer" },
  { name: "Opportunity Match", description: "Understand your fit for a role and the skills to develop next." },
  { name: "Profile Intelligence", description: "Improve your headline, About section and professional presentation." },
  { name: "Job Description Intelligence", description: "Break down role requirements and preparation priorities." },
  { name: "Career Gap Map", description: "Plan practical steps towards your next role." },
  { name: "Portfolio Intelligence", description: "Present the story behind your work." },
  { name: "Smart Application", description: "Prepare an application grounded in your experience." },
  { name: "Smart Proposal", description: "Develop a clear response to a project brief." },
  { name: "Interview Prep", description: "Prepare for conversations about your next role." },
  { name: "Interview Practice", description: "Practice explaining your experience with confidence." },
]
export default function ProfessionalToolsPage() {
  return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-28"><div className="mx-auto max-w-6xl">
    <header className="max-w-2xl"><p className="text-xs font-bold tracking-[.16em] text-brand-coral">GIGWAY PROFESSIONAL TOOLS</p><h1 className="mt-3 text-3xl font-extrabold text-brand-midnight">Make your next move with clarity.</h1><p className="mt-3 text-brand-slate">Explore available previews. Additional tools and one-time report purchases are being prepared; checkout is currently paused.</p></header>
    <section className="mt-7 rounded-2xl border border-indigo-100 bg-white p-5"><p className="text-xs font-bold text-brand-indigo">NEW · GIGCARD STUDIO PREVIEW</p><h2 className="mt-2 text-xl font-bold">A professional introduction worth sharing.</h2><p className="mt-2 text-sm text-brand-slate">Try three card designs with your details. Export a sample image or PDF before deciding what suits you.</p><Link href="/profile/gigcard" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-indigo px-4 font-bold text-white">Design my GigCard</Link></section>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(tool => <article key={tool.name} className="rounded-2xl border border-brand-borderLight bg-white p-5"><p className="text-xs font-semibold text-brand-indigo">{tool.href ? "Preview" : "Coming soon"}</p><h2 className="mt-3 text-lg font-bold text-brand-midnight">{tool.name}</h2><p className="mt-2 text-sm text-brand-slate">{tool.description}</p>{tool.href ? <Link href={tool.href} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand-indigo">Open preview →</Link> : <p className="mt-4 text-xs text-brand-slate">Not available for purchase.</p>}</article>)}</div>
    <p className="mt-7 text-sm text-brand-slate">Basic profiles, posting, following and discovery stay free. No paid plan is needed to participate.</p>
  </div></main>
}
