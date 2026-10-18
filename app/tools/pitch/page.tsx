import { redirect } from "next/navigation"
import { getViewer } from "@/lib/auth/server"
import { utilityMode } from "@/lib/utility/server"
import PitchStudio from "@/components/utility/PitchStudio"
export default async function Page(){
 if(!await getViewer())redirect("/login?next=/tools/pitch")
 return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-28"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold text-brand-midnight">A pitch for your next opportunity.</h1><p className="mt-3 text-brand-slate">Turn your experience and a job description into a cover letter and shareable pitch.</p><div className="mt-7"><PitchStudio mode={utilityMode()}/></div></div></main>
}
