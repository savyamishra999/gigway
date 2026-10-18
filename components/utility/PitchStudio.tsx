"use client"
import { useEffect,useState } from "react"
import UtilityCheckout from "./UtilityCheckout"
import type { Pitch } from "@/lib/utility/catalog"
type Draft={id:string;result:Pitch;published:boolean}
export default function PitchStudio({mode}:{mode:string}){
 const[job,setJob]=useState(""),[experience,setExperience]=useState(""),[draft,setDraft]=useState<Draft|null>(null),[username,setUsername]=useState(""),[saved,setSaved]=useState<{id:string;title:string;published:boolean}[]>([]),[pro,setPro]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("")
 async function history(){const r=await fetch("/api/tools/documents?kind=pitch");const d=await r.json();if(!r.ok)throw Error(d.error);setSaved(d.items);setUsername(d.username);setPro(d.pro)}
 useEffect(()=>{void history().catch(e=>setError(e.message))},[])
 async function run(operation:()=>Promise<void>){setBusy(true);setError("");setNotice("");try{await operation()}catch(e){setError(e instanceof Error?e.message:"Please retry.")}finally{setBusy(false)}}
 async function create(){
  const r=await fetch("/api/tools/pitch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobDescription:job,experience})}),d=await r.json()
  if(!r.ok)throw Error(d.error);setDraft(d);setUsername(d.username);await history()
 }
 async function save(publish:boolean){
  if(!draft)return
  const r=await fetch("/api/tools/pitch",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:draft.id,result:draft.result,publish})}),d=await r.json()
  if(!r.ok)throw Error(d.error);setDraft({...draft,published:publish});setNotice(publish?"Published. Anyone with your pitch link can read this draft.":"Saved privately. This draft is not public.");await history()
 }
 const change=(key:keyof Pitch,value:string)=>setDraft(d=>d?{...d,result:{...d.result,[key]:value}}:null)
 return <div className="space-y-6">
  <section className="rounded-2xl border bg-white p-4"><p className="font-bold">{pro?"GigWay Pro active":"1 pitch free · GigWay Pro ₹149 / 30 days"}</p><p className="mt-2 text-sm text-brand-slate">Unlimited pitches during paid access. Prepaid; does not auto-renew. To prevent abuse, generation is paced at up to 10 requests per hour.</p>{!pro&&<div className="mt-3"><UtilityCheckout product="pitch_pro" mode={mode} onPaid={history}/></div>}</section>
  <label className="block text-sm font-semibold">Job description<textarea rows={6} value={job} onChange={e=>setJob(e.target.value)} maxLength={16000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Paste at least 100 characters"/></label>
  <label className="block text-sm font-semibold">Your relevant experience<textarea rows={6} value={experience} onChange={e=>setExperience(e.target.value)} maxLength={12000} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Skills, projects and experience you can support (at least 100 characters)"/></label>
  <p className="text-xs text-brand-slate">Inputs are sent to our AI provider. Avoid sensitive details. Review the draft before sharing.</p>
  <button disabled={busy||job.trim().length<100||experience.trim().length<100} onClick={()=>void run(create)} className="rounded-xl bg-brand-indigo px-5 py-3 font-bold text-white disabled:opacity-50">{busy?"Working…":"Generate my pitch"}</button>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm text-brand-indigo">{notice}</p>}
  {draft&&<section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Review your draft</h2><label className="block text-sm font-semibold">Title<input value={draft.result.title} maxLength={160} onChange={e=>change("title",e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label><label className="block text-sm font-semibold">Pitch<textarea rows={5} value={draft.result.pitch} maxLength={4000} onChange={e=>change("pitch",e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label><label className="block text-sm font-semibold">Cover letter<textarea rows={10} value={draft.result.coverLetter} maxLength={10000} onChange={e=>change("coverLetter",e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label><p className="text-sm text-brand-slate">Publishing makes the pitch and cover letter public and replaces your previously published pitch.</p><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={()=>void run(()=>save(false))} className="rounded-xl border px-4 py-3 font-semibold">{draft.published?"Unpublish & save privately":"Save privately"}</button><button disabled={busy} onClick={()=>void run(()=>save(true))} className="rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">Publish pitch</button><button onClick={()=>void run(async()=>{await navigator.clipboard.writeText(draft.result.coverLetter);setNotice("Cover letter copied.")})} className="px-3 py-3 text-sm font-semibold text-brand-indigo">Copy cover letter</button></div>{draft.published&&<a href={`/u/${username}/pitch`} className="block break-all font-semibold text-brand-indigo">View public pitch: /u/{username}/pitch</a>}</section>}
  {saved.length>0&&<section><h2 className="font-bold">Saved pitches</h2><div className="mt-3 space-y-2">{saved.map(d=><button key={d.id} disabled={busy} className="block w-full rounded-xl border bg-white p-3 text-left" onClick={()=>void run(async()=>{const r=await fetch(`/api/tools/documents?id=${d.id}`);const data=await r.json();if(!r.ok)throw Error(data.error);setDraft(data)})}>{d.title}{d.published?" · Public":""}</button>)}</div></section>}
 </div>
}
