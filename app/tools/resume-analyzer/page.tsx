import { redirect } from "next/navigation"
import ResumeAnalyzer from "@/components/ai/ResumeAnalyzer"
import { createClient } from "@/lib/supabase/server"
export default async function Page(){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/tools/resume-analyzer");return <main className="min-h-screen bg-brand-ivory px-4 py-10"><div className="mx-auto max-w-3xl"><h1 className="text-h1 font-extrabold text-brand-midnight">Resume Intelligence</h1><p className="mt-2 text-brand-slate">Understand the strengths, weaknesses and opportunities in your resume.</p><div className="mt-6"><ResumeAnalyzer/></div></div></main>}
