import { getViewer } from "@/lib/auth/server"
import { utilityDb,utilityBody,utilityJson,utilityError,UtilityError,uuid } from "@/lib/utility/server"
async function admin(){
 const user=await getViewer(),emails=(process.env.ADMIN_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean)
 if(!user||!emails.includes((user.email||"").toLowerCase()))throw new UtilityError("Forbidden",403)
 return user
}
export async function GET(){
 try{
  await admin();const db=utilityDb(),{data,error}=await db.from("utility_verifications").select("*").order("updated_at",{ascending:false}).limit(100)
  if(error)throw new UtilityError("Requests unavailable.",503)
  const ids=(data||[]).map(item=>item.owner_id)
  const profiles=ids.length?await db.from("profiles").select("id,username,full_name").in("id",ids):{data:[],error:null}
  if(profiles.error)throw new UtilityError("Applicant profiles unavailable.",503)
  return utilityJson({items:(data||[]).map(item=>({...item,profile:profiles.data?.find(p=>p.id===item.owner_id)}))})
 }catch(e){return utilityError(e)}
}
export async function PATCH(req:Request){
 try{
  const user=await admin(),b=await utilityBody(req)
  if(!uuid(b.ownerId)||!["approved","rejected"].includes(String(b.status)))throw new UtilityError("Invalid review.")
  const reason=typeof b.reason==="string"?b.reason.trim().slice(0,1000):""
  if(reason.length<10)throw new UtilityError("Record a review reason of at least 10 characters.")
  const {data,error}=await utilityDb().from("utility_verifications").update({status:b.status,reason,reviewed_by:user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("owner_id",b.ownerId).select("owner_id").maybeSingle()
  if(error||!data)throw new UtilityError("Review could not be saved.",503)
  return utilityJson({success:true})
 }catch(e){return utilityError(e)}
}
