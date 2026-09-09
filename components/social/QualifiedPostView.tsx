"use client";
import { useEffect, useRef } from "react";

const key = "gigway:qualified-post-views:v1";
function seen(id: string) { try { return new Set<string>(JSON.parse(sessionStorage.getItem(key) || "[]")); } catch { return new Set<string>(); } }
export default function QualifiedPostView({ postId, onQualified, children }: { postId: string; onQualified?: (viewCount: number) => void; children: React.ReactNode }) {
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => { const element=node.current; if(!element||seen(postId).has(postId)) return; let timer: ReturnType<typeof setTimeout>|null=null,done=false; const record=()=>{ if(done)return; done=true; const values=seen(postId); values.add(postId); try{sessionStorage.setItem(key,JSON.stringify([...values].slice(-500)))}catch{}; fetch(`/api/social/posts/${postId}/view`,{method:"POST",keepalive:true}).then(async response=>{const body=await response.json().catch(()=>null);if(response.ok&&body&&typeof body.viewCount==="number")onQualified?.(body.viewCount)}).catch(()=>undefined); }; const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&entry.intersectionRatio>=.5){if(!timer)timer=setTimeout(record,1000)}else if(timer){clearTimeout(timer);timer=null}}, {threshold:[.5]}); observer.observe(element); return()=>{observer.disconnect();if(timer)clearTimeout(timer)}; },[onQualified,postId]);
  return <div ref={node}>{children}</div>;
}
