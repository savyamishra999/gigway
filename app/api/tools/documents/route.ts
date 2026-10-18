import { utilityDb, utilityOwner, utilityJson, utilityError, paidAccess, ownedDocument, UtilityError } from "@/lib/utility/server"
import { reportPreview, validateReport } from "@/lib/utility/catalog"
export async function GET(req: Request) {
  try {
    const db = utilityDb(), owner = await utilityOwner(db), params = new URL(req.url).searchParams, id = params.get("id")
    if (id) {
      const d = await ownedDocument(db,owner.id,id)
      const full = d.kind === "pitch" || !!await paidAccess(db,owner.id,"resume_report",d.id)
      return utilityJson({ id:d.id, kind:d.kind, title:d.title, published:d.published, result:full?d.result:reportPreview(validateReport(d.result)), locked:!full })
    }
    const kind = params.get("kind")
    if (kind !== "resume" && kind !== "pitch") throw new UtilityError("Invalid document type.")
    const {data,error}=await db.from("utility_documents").select("id,title,created_at,published").eq("owner_id",owner.id).eq("kind",kind).eq("status","ready").order("created_at",{ascending:false}).limit(30)
    if(error) throw new UtilityError("Saved documents could not be loaded.",503)
    return utilityJson({items:data,username:owner.username,pro:!!await paidAccess(db,owner.id,"pitch_pro")})
  } catch(e) { return utilityError(e) }
}
