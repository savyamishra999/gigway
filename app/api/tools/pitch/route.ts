import { createHash } from "node:crypto"
import { generateUtility } from "@/lib/utility/ai"
import { validatePitch } from "@/lib/utility/catalog"
import { utilityDb, utilityOwner, utilityBody, utilityJson, utilityError, UtilityError, rpc, accessMode, ownedDocument } from "@/lib/utility/server"
export const maxDuration = 90
export async function POST(req: Request) {
  let reservation: { id:string; created_at:string } | undefined
  let db: ReturnType<typeof utilityDb> | undefined
  try {
    db = utilityDb()
    const owner=await utilityOwner(db), b=await utilityBody(req)
    const jobDescription=typeof b.jobDescription==="string"?b.jobDescription.trim():"", experience=typeof b.experience==="string"?b.experience.trim():""
    if(jobDescription.length<100||jobDescription.length>16000||experience.length<100||experience.length>12000)throw new UtilityError("Add a job description (100–16,000 characters) and your experience (100–12,000 characters).")
    if(!process.env.OPENAI_API_KEY)throw new UtilityError("Pitch generation is temporarily unavailable.",503)
    const doc=await rpc(db,"utility_reserve_document",{p_owner:owner.id,p_kind:"pitch",p_hash:createHash("sha256").update(JSON.stringify({jobDescription,experience})).digest("hex"),p_title:"Application pitch",p_mode:accessMode()})
    let result=doc.result
    if(doc.generate){
      reservation=doc;result=await generateUtility("pitch",{jobDescription,experience})
      const {data,error}=await db.from("utility_documents").update({result,title:(result as {title:string}).title,status:"ready"}).eq("id",doc.id).eq("status","generating").eq("created_at",doc.created_at).select("id").maybeSingle()
      if(error||!data)throw new UtilityError("Your pitch could not be saved.",503)
    }
    return utilityJson({id:doc.id,result,published:doc.published,username:owner.username})
  }catch(e){
    if(reservation&&db)await db.from("utility_documents").update({status:"failed"}).eq("id",reservation.id).eq("created_at",reservation.created_at).eq("status","generating")
    return utilityError(e)
  }
}
export async function PATCH(req: Request) {
  try{
    const db=utilityDb(),owner=await utilityOwner(db),b=await utilityBody(req)
    const doc=await ownedDocument(db,owner.id,b.id)
    if(doc.kind!=="pitch"||typeof b.publish!=="boolean")throw new UtilityError("Invalid pitch update.")
    let result
    try {result=validatePitch(b.result)}catch{throw new UtilityError("Check the title, pitch and cover letter lengths.")}
    await rpc(db,"utility_publish_pitch",{p_owner:owner.id,p_document:doc.id,p_publish:b.publish,p_result:result})
    return utilityJson({success:true,published:b.publish,href:`/u/${owner.username}/pitch`})
  }catch(e){return utilityError(e)}
}
