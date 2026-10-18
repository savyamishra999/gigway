import { notFound } from "next/navigation"
import Link from "next/link"
import { utilityDb } from "@/lib/utility/server"
import { validatePitch } from "@/lib/utility/catalog"
export const dynamic="force-dynamic"
export const metadata={title:"Professional pitch | GigWay",robots:{index:false,follow:false}}
export default async function Page({params}:{params:Promise<{username:string}>}){
 const {username}=await params, db=utilityDb()
 const {data:p,error:pe}=await db.from("profiles").select("id,username,full_name").eq("username",username.toLowerCase()).eq("is_banned",false).eq("profile_completed",true).maybeSingle()
 if(pe)throw Error("Pitch unavailable")
 if(!p)notFound()
 const {data:d,error}=await db.from("utility_documents").select("result").eq("owner_id",p.id).eq("kind","pitch").eq("status","ready").eq("published",true).maybeSingle()
 if(error)throw Error("Pitch unavailable")
 if(!d)notFound()
 const pitch=validatePitch(d.result)
 return <main className="min-h-screen bg-brand-ivory px-4 py-10"><article className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 sm:p-10"><Link href={`/u/${p.username}`} className="font-semibold text-brand-indigo">{p.full_name} · @{p.username}</Link><h1 className="mt-5 text-3xl font-extrabold text-brand-midnight">{pitch.title}</h1><p className="mt-6 whitespace-pre-wrap break-words leading-7">{pitch.pitch}</p><h2 className="mt-8 text-xl font-bold">Cover letter</h2><p className="mt-3 whitespace-pre-wrap break-words leading-7 text-brand-slate">{pitch.coverLetter}</p><Link href={`/u/${p.username}`} className="mt-8 inline-block font-bold text-brand-indigo">View professional profile →</Link></article></main>
}
