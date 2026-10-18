"use client"
import {useEffect,useState} from "react"
export default function VerificationReview(){
 const[items,setItems]=useState<any[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false)
 async function load(){const r=await fetch("/api/admin/utility-verifications"),d=await r.json();if(!r.ok)throw Error(d.error);setItems(d.items)}
 useEffect(()=>{void load().catch(e=>setError(e.message))},[])
 async function review(ownerId:string,status:string){
  const reason=window.prompt("Record the evidence checked and your review reason (at least 10 characters).")
  if(!reason)return
  setBusy(true);setError("")
  try{const r=await fetch("/api/admin/utility-verifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ownerId,status,reason})}),d=await r.json();if(!r.ok)throw Error(d.error);await load()}catch(e){setError(e instanceof Error?e.message:"Review failed")}finally{setBusy(false)}
 }
 return <div className="space-y-4">{error&&<p role="alert">{error}</p>}{items.map(i=><article key={i.owner_id} className="rounded-xl border bg-white p-4 text-brand-midnight"><p className="break-all text-sm font-bold">{i.profile?.full_name||i.owner_id} · {i.status}</p>{i.profile?.username&&<a href={`/u/${i.profile.username}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand-indigo">Review @{i.profile.username} ↗</a>}<p className="my-4 whitespace-pre-wrap break-words">{i.evidence}</p>{i.reason&&<p className="mb-3 text-sm">Previous review: {i.reason}</p>}<div className="flex gap-3"><button disabled={busy} onClick={()=>review(i.owner_id,"approved")} className="rounded-lg bg-brand-indigo px-4 py-2 text-white">Approve evidence</button><button disabled={busy} onClick={()=>review(i.owner_id,"rejected")} className="rounded-lg border px-4 py-2">Reject / revoke</button></div></article>)}</div>
}
