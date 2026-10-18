import { utilityDb,utilityJson,utilityError,UtilityError,validSignature } from "@/lib/utility/server"
import { utilityGateway,settleUtility,prepareUtility,type UtilityOrder } from "@/lib/utility/payments"
export async function POST(req:Request){
 try{
  const g=utilityGateway(),secret=process.env.UTILITY_RAZORPAY_WEBHOOK_SECRET!
  const raw=await req.text()
  if(raw.length>100000)throw new UtilityError("Request too large.",413)
  if(!validSignature(raw,req.headers.get("x-razorpay-signature"),secret))throw new UtilityError("Invalid signature.",401)
  const payload=JSON.parse(raw)
  if(!["payment.captured","refund.processed"].includes(payload.event))return utilityJson({ok:true})
  const payment=payload.payload?.payment?.entity, refund=payload.payload?.refund?.entity
  const paymentId=payment?.id||refund?.payment_id
  if(typeof paymentId!=="string")throw new UtilityError("Missing payment.")
  const remote=await g.sdk.payments.fetch(paymentId)
  if(!remote.order_id)return utilityJson({ok:true})
  const db=utilityDb()
  let{data,error}=await db.from("utility_orders").select("*").eq("provider_order",remote.order_id).maybeSingle()
  if(error)throw new UtilityError("Order storage unavailable.",503)
  if(!data){
   const order=await g.sdk.orders.fetch(remote.order_id)
   const localId=order.notes?.utility_order
   if(!localId)return utilityJson({ok:true})
   const local=await db.from("utility_orders").select("*").eq("id",localId).maybeSingle()
   if(local.error||!local.data)throw new UtilityError("Order confirmation pending.",503)
   // Recover an interrupted provider-order attachment using the stored reservation.
   data=await prepareUtility(db,local.data.owner_id,local.data.product,local.data.document_id,g)
  }
  await settleUtility(db,data as UtilityOrder,paymentId,g)
  return utilityJson({ok:true})
 }catch(e){return utilityError(e)}
}
