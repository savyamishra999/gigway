"use client"
import { useState } from "react"
import { UTILITY_PRODUCTS,type UtilityProduct } from "@/lib/utility/catalog"
let scriptPromise:Promise<void>|undefined
function loadCheckout(){
 if(window.Razorpay)return Promise.resolve()
 if(!scriptPromise)scriptPromise=new Promise<void>((resolve,reject)=>{
  const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js"
  s.onload=()=>window.Razorpay?resolve():reject(Error("Checkout unavailable"));s.onerror=()=>{s.remove();scriptPromise=undefined;reject(Error("Checkout could not load. Please retry."))};document.body.appendChild(s)
 })
 return scriptPromise
}
export default function UtilityCheckout({product,documentId,mode,onPaid}:{product:UtilityProduct;documentId?:string;mode:string;onPaid:()=>void|Promise<void>}){
 const[busy,setBusy]=useState(false),[error,setError]=useState("")
 const post=async(body:Record<string,unknown>)=>{
  const r=await fetch("/api/utility/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product,documentId,...body})})
  const d=await r.json();if(!r.ok)throw Error(d.error||"Checkout failed.");return d
 }
 async function buy(){
  setBusy(true);setError("")
  try{
   await loadCheckout()
   const order=await post({operation:"create"})
   if(order.paid){await onPaid();setBusy(false);return}
   const checkout=new window.Razorpay({key:order.key_id,amount:order.amount,currency:order.currency,order_id:order.order_id,name:"GigWay",description:UTILITY_PRODUCTS[product].label,theme:{color:"#4F46E5"},
    handler:async(response:Record<string,string>)=>{
     try{await post({operation:"verify",id:order.id,...response});await onPaid()}
     catch{setError("Payment confirmation is pending. Use Restore purchase; do not pay again.")}
     finally{setBusy(false)}
    },modal:{ondismiss:()=>setBusy(false)}})
   checkout.on("payment.failed",()=>{setError("Payment failed. You can retry or restore a completed purchase.");setBusy(false)});checkout.open()
  }catch(e){setError(e instanceof Error?e.message:"Checkout failed.");setBusy(false)}
 }
 async function restore(){
  setBusy(true);setError("")
  try{
   // create is idempotent: it reuses an existing reservation and reconciles payment.
   const order=await post({operation:"create"})
   if(!order.paid)await post({operation:"restore",id:order.id})
   await onPaid()
  }catch(e){setError(e instanceof Error?e.message:"Could not restore purchase.")}
  finally{setBusy(false)}
 }
 if(mode==="paused")return <p className="rounded-xl bg-slate-50 p-3 text-sm text-brand-slate">Checkout is not open yet. Your preview stays saved.</p>
 return <div className="space-y-2">{mode==="test"&&<p className="text-sm font-bold text-amber-700">Test checkout — no live purchase</p>}<div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={buy} className="rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white disabled:opacity-50">{busy?"Please wait…":`Unlock for ₹${UTILITY_PRODUCTS[product].amount/100}`}</button><button type="button" disabled={busy} onClick={restore} className="px-2 py-3 text-sm font-semibold text-brand-indigo disabled:opacity-50">Restore purchase</button></div>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>
}
