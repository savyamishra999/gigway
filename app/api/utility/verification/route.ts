import { utilityDb,utilityOwner,utilityBody,utilityJson,utilityError,UtilityError,paidAccess } from "@/lib/utility/server"
export async function GET(){
 try{
  const db=utilityDb(),owner=await utilityOwner(db)
  const{data,error}=await db.from("utility_verifications").select("status,reason,evidence").eq("owner_id",owner.id).maybeSingle()
  if(error)throw new UtilityError("Verification requests are unavailable.",503)
  return utilityJson({request:data,access:await paidAccess(db,owner.id,"professional_verified")})
 }catch(e){return utilityError(e)}
}
export async function POST(req:Request){
 try{
  const db=utilityDb(),owner=await utilityOwner(db),b=await utilityBody(req)
  const evidence=typeof b.evidence==="string"?b.evidence.trim():""
  if(evidence.length<80||evidence.length>4000||!evidence.includes("https://"))throw new UtilityError("Add a public professional work link and at least 80 characters explaining your work.")
  const current=await db.from("utility_verifications").select("status").eq("owner_id",owner.id).maybeSingle()
  if(current.error)throw new UtilityError("Verification requests are unavailable.",503)
  if(current.data&&current.data.status!=="rejected")throw new UtilityError("Your request has already been submitted.",409)
  const {error}=current.data
   ? await db.from("utility_verifications").update({evidence,status:"pending",reason:null,reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString()}).eq("owner_id",owner.id).eq("status","rejected")
   : await db.from("utility_verifications").insert({owner_id:owner.id,evidence})
  if(error)throw new UtilityError("Your request could not be saved.",503)
  return utilityJson({success:true})
 }catch(e){return utilityError(e)}
}
