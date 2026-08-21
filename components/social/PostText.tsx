import Link from "next/link"
import {tokenizePostText} from "@/lib/social/mentions"
export default function PostText({body,mentions=[]}:{body:string;mentions?:string[]}){return <p className="whitespace-pre-wrap break-words pt-4 text-body-sm leading-6 text-brand-midnight">{tokenizePostText(body,mentions).map((token,i)=>token.username?<Link key={i} href={`/u/${token.username}`} className="font-semibold text-brand-indigo hover:underline">{token.text}</Link>:token.text)}</p>}
