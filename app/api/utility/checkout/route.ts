import { utilityProduct } from "@/lib/utility/catalog"
import { prepareUtility,recoverUtility,settleUtility,utilityGateway, type UtilityOrder } from "@/lib/utility/payments"
import { utilityDb,utilityOwner,utilityBody,utilityJson,utilityError,UtilityError,uuid,validSignature } from "@/lib/utility/server"
import { resumePdf } from "@/lib/utility/pdf"
import { validateReport } from "@/lib/utility/catalog"
import { ownedDocument } from "@/lib/utility/server"
export async function POST(req:Request){
 try{
  const db=utilityDb(),owner=await utilityOwner(db),b=await utilityBody(req),g=utilityGateway(),product=utilityProduct(b.product)
  if(!product)throw new UtilityError("Invalid product.")
  const document=product==="resume_report"&&uuid(b.documentId)?b.documentId:null
  if(product==="resume_report"){
    const doc=await ownedDocument(db,owner.id,document)
    if(doc.kind!=="resume")throw new UtilityError("Invalid report.")
    resumePdf(validateReport(doc.result),doc.title)
  }
  if(b.operation==="create"){
   const o=await prepareUtility(db,owner.id,product,document,g)
   return utilityJson({id:o.id,order_id:o.provider_order,amount:o.amount_paise,currency:o.currency,key_id:g.key,paid:o.status==="paid",mode:g.mode})
  }
  if(!uuid(b.id))throw new UtilityError("Invalid order.")
  const{data,error}=await db.from("utility_orders").select("*").eq("id",b.id).eq("owner_id",owner.id).maybeSingle()
  const o=data as UtilityOrder|null
  if(error||!o||o.product!==product||o.document_id!==document||o.mode!==g.mode)throw new UtilityError("Order not found.",404)
  let result
  if(b.operation==="verify"){
   if(b.razorpay_order_id!==o.provider_order||typeof b.razorpay_payment_id!=="string"||!validSignature(`${o.provider_order}|${b.razorpay_payment_id}`,b.razorpay_signature,g.secret))throw new UtilityError("Invalid payment signature.")
   result=await settleUtility(db,o,b.razorpay_payment_id,g)
  }else if(b.operation==="restore")result=await recoverUtility(db,o,g)
  else throw new UtilityError("Invalid checkout action.")
  if(result.status!=="paid")throw new UtilityError("Payment is not confirmed. Do not pay again while confirmation is pending.",409)
  return utilityJson({paid:true})
 }catch(e){return utilityError(e)}
}
