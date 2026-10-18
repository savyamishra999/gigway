import "server-only"
import Razorpay from "razorpay"
import { UTILITY_PRODUCTS, type UtilityProduct } from "./catalog"
import { UtilityError, utilityMode, rpc, type UtilityDb } from "./server"
export type UtilityOrder={id:string;owner_id:string;product:UtilityProduct;document_id:string|null;mode:"test"|"live";amount_paise:number;currency:string;status:string;provider_order:string|null;provider_payment:string|null;new_order?:boolean;expires_at:string|null}
export function utilityGateway(){
 const mode=utilityMode(),key=process.env.RAZORPAY_KEY_ID||process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET
 if(mode==="paused")throw new UtilityError("Checkout is not open yet. Your saved work is safe.",503)
 if(!key?.startsWith(`rzp_${mode}_`)||!secret||!process.env.UTILITY_RAZORPAY_WEBHOOK_SECRET)throw new UtilityError("Checkout is not configured yet.",503)
 return{mode,key,secret,sdk:new Razorpay({key_id:key,key_secret:secret})}
}
export function assertUtilityPayment(o:UtilityOrder,remote:any,payment?:any){
 const product=UTILITY_PRODUCTS[o.product]
 if(!product||o.amount_paise!==product.amount||o.currency!=="INR"||!remote||remote.id!==o.provider_order||remote.amount!==o.amount_paise||remote.currency!=="INR"||remote.receipt!==`ut_${o.id.replace(/-/g,"")}`||remote.notes?.utility_order!==o.id||remote.notes?.owner_id!==o.owner_id)throw new UtilityError("Payment order could not be validated.",409)
 if(payment&&(payment.order_id!==o.provider_order||payment.amount!==o.amount_paise||payment.currency!=="INR"||!["captured","refunded"].includes(payment.status)||typeof payment.amount_refunded!=="number"||payment.amount_refunded<0||payment.amount_refunded>payment.amount))throw new UtilityError("Payment confirmation is pending. Do not pay again.",409)
}
export async function settleUtility(db:UtilityDb,o:UtilityOrder,paymentId:string,g:ReturnType<typeof utilityGateway>){
 if(!o.provider_order||!/^pay_[A-Za-z0-9]+$/.test(paymentId)||o.mode!==g.mode)throw new UtilityError("Invalid payment reference.")
 const[remote,payment]=await Promise.all([g.sdk.orders.fetch(o.provider_order),g.sdk.payments.fetch(paymentId)])
 assertUtilityPayment(o,remote,payment)
 if(payment.id!==paymentId)throw new UtilityError("Invalid payment reference.")
 return await rpc(db,"utility_settle_order",{p_id:o.id,p_order:o.provider_order,p_payment:paymentId,p_amount:o.amount_paise,p_refunded:payment.status==="refunded"||Number(payment.amount_refunded)>0}) as UtilityOrder
}
export async function recoverUtility(db:UtilityDb,o:UtilityOrder,g:ReturnType<typeof utilityGateway>){
 if(!o.provider_order)return o
 if(o.provider_payment)return settleUtility(db,o,o.provider_payment,g)
 const remote=await g.sdk.orders.fetch(o.provider_order);assertUtilityPayment(o,remote)
 if(remote.status!=="paid")return o
 const payments=await g.sdk.orders.fetchPayments(o.provider_order),captured=payments.items.filter(p=>["captured","refunded"].includes(p.status))
 if(captured.length!==1)throw new UtilityError("Payment is being confirmed. Do not pay again.",409)
 return settleUtility(db,o,captured[0].id,g)
}
export async function prepareUtility(db:UtilityDb,owner:string,product:UtilityProduct,document:string|null,g:ReturnType<typeof utilityGateway>){
 let o=await rpc(db,"utility_reserve_order",{p_owner:owner,p_product:product,p_document:document,p_mode:g.mode}) as UtilityOrder
 if(!o.provider_order){
   const receipt=`ut_${o.id.replace(/-/g,"")}`
   let remote
   if(o.new_order)remote=await g.sdk.orders.create({amount:o.amount_paise,currency:"INR",receipt,notes:{utility_order:o.id,owner_id:owner,product}})
   else{
     const matches=(await g.sdk.orders.all({receipt,count:100})).items
     if(matches.length!==1)throw new UtilityError("An earlier order is being confirmed. Please retry later; do not pay again.",409)
     remote=matches[0]
   }
   assertUtilityPayment({...o,provider_order:remote.id},remote)
   const{data,error}=await db.from("utility_orders").update({provider_order:remote.id,status:"created"}).eq("id",o.id).eq("owner_id",owner).is("provider_order",null).select("*").maybeSingle()
   if(error||!data){
     const retry=await db.from("utility_orders").select("*").eq("id",o.id).eq("owner_id",owner).maybeSingle()
     if(retry.error||retry.data?.provider_order!==remote.id)throw new UtilityError("Order confirmation is pending. Please retry.",409)
     o=retry.data
   }else o=data
 }
 o=await recoverUtility(db,o,g)
 if(o.status==="refunded")throw new UtilityError("This purchase was refunded. Contact support before buying again.",409)
 return o
}
