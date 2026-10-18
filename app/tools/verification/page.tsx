import {redirect} from "next/navigation"
import {getViewer} from "@/lib/auth/server"
import {utilityMode} from "@/lib/utility/server"
import Verification from "@/components/utility/Verification"
export default async function Page(){
 if(!await getViewer())redirect("/login?next=/tools/verification")
 return <main className="min-h-screen bg-brand-ivory px-4 py-10 pb-28"><div className="mx-auto max-w-2xl"><h1 className="mb-5 text-3xl font-extrabold text-brand-midnight">GigWay Verified Professional</h1><Verification mode={utilityMode()}/></div></main>
}
