import {utilityDb} from "@/lib/utility/server"
export default async function ProfessionalBadge({ownerId}:{ownerId:string}){
 try{
  const db=utilityDb()
  const[{data:review,error:a},{data:order,error:b}]=await Promise.all([
   db.from("utility_verifications").select("status").eq("owner_id",ownerId).eq("status","approved").maybeSingle(),
   db.from("utility_orders").select("expires_at").eq("owner_id",ownerId).eq("product","professional_verified").eq("mode","live").eq("status","paid").gt("expires_at",new Date().toISOString()).limit(1).maybeSingle()
  ])
  if(a||b||!review||!order)return null
  return <span title="Professional profile and work evidence reviewed by GigWay" className="mt-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">✓ GigWay Verified Professional</span>
 }catch{return null}
}
