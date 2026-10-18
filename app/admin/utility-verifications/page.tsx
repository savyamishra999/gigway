import {redirect} from "next/navigation"
import {getViewer} from "@/lib/auth/server"
import VerificationReview from "@/components/utility/VerificationReview"
export default async function Page(){
 const user=await getViewer(),emails=(process.env.ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean)
 if(!user||!emails.includes((user.email||"").toLowerCase()))redirect("/home")
 return <main className="p-6"><h1 className="mb-5 text-2xl font-bold">Professional verification reviews</h1><p className="mb-5">Check the applicant's public professional profile and work evidence before approving. Payment is available only after approval.</p><VerificationReview/></main>
}
