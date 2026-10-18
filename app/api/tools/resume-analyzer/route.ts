import { createHash } from "node:crypto"
import { resumePdf } from "@/lib/utility/pdf"
import { generateUtility } from "@/lib/utility/ai"
import { reportPreview, validateReport } from "@/lib/utility/catalog"
import { utilityDb, utilityOwner, utilityBody, utilityJson, utilityError, UtilityError, rpc, accessMode, paidAccess } from "@/lib/utility/server"
export const maxDuration = 90
export async function POST(req: Request) {
  let reservation: { id: string; created_at: string } | undefined
  let db: ReturnType<typeof utilityDb> | undefined
  try {
    db = utilityDb()
    const owner = await utilityOwner(db), body = await utilityBody(req)
    const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : ""
    const targetRole = typeof body.targetRole === "string" ? body.targetRole.trim().slice(0,120) : ""
    if (resumeText.length < 200 || resumeText.length > 20000) throw new UtilityError("Paste 200 to 20,000 characters of resume text.")
    if (!process.env.OPENAI_API_KEY) throw new UtilityError("Resume analysis is temporarily unavailable.",503)
    const doc = await rpc(db, "utility_reserve_document", { p_owner: owner.id, p_kind: "resume", p_hash: createHash("sha256").update(JSON.stringify({ resumeText, targetRole })).digest("hex"), p_title: targetRole || "Resume report", p_mode: accessMode() })
    let result = doc.result
    if (doc.generate) {
      reservation = doc
      result = await generateUtility("resume", { resumeText, targetRole })
      resumePdf(validateReport(result), targetRole)
      const { data, error } = await db.from("utility_documents").update({ result, status: "ready" }).eq("id", doc.id).eq("status", "generating").eq("created_at",doc.created_at).select("id").maybeSingle()
      if (error || !data) throw new UtilityError("Your report could not be saved. Please retry.",503)
    }
    const full = !!await paidAccess(db, owner.id, "resume_report", doc.id)
    return utilityJson({ id: doc.id, result: full ? validateReport(result) : reportPreview(validateReport(result)), locked: !full })
  } catch (e) {
    if (reservation && db) await db.from("utility_documents").update({ status: "failed" }).eq("id",reservation.id).eq("created_at",reservation.created_at).eq("status","generating")
    return utilityError(e)
  }
}
