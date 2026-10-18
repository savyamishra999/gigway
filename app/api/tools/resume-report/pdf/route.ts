import { utilityDb,utilityOwner,ownedDocument,paidAccess,UtilityError,utilityError } from "@/lib/utility/server"
import { validateReport } from "@/lib/utility/catalog"
import { resumePdf } from "@/lib/utility/pdf"
export async function GET(req:Request){
  try{
    const db=utilityDb(),owner=await utilityOwner(db),doc=await ownedDocument(db,owner.id,new URL(req.url).searchParams.get("id"))
    if(doc.kind!=="resume"||!await paidAccess(db,owner.id,"resume_report",doc.id))throw new UtilityError("Unlock this report to download its PDF.",403)
    return new Response(resumePdf(validateReport(doc.result),doc.title),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="gigway-resume-report.pdf"',"Cache-Control":"private, no-store"}})
  }catch(e){return utilityError(e)}
}
