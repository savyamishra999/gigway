import { redirect } from "next/navigation"
import { getViewer } from "@/lib/auth/server"
import ResumeAnalyzer from "@/components/ai/ResumeAnalyzer"
import { utilityMode } from "@/lib/utility/server"
export default async function Page(){
 if(!await getViewer())redirect("/login?next=/tools/resume-analyzer")
 return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-28"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold tracking-widest text-brand-coral">RESUME SCORE & REVIEW</p><h1 className="mt-2 text-3xl font-extrabold text-brand-midnight">Know what to improve.</h1><p className="mt-3 text-brand-slate">Free score and preview. Full analysis + PDF for ₹49 per report. Reports are in English.</p><div className="mt-7"><ResumeAnalyzer mode={utilityMode()}/></div></div></main>
}
