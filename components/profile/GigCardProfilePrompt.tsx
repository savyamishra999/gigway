import Link from "next/link"
import { getViewer } from "@/lib/auth/server"
import { GIGCARD_PRICE_LABEL } from "@/lib/gigcard/purchase"

type CardProfile = { id: string; username: string; full_name: string | null; avatar_url: string | null; tagline: string | null }

export default async function GigCardProfilePrompt({ profile }: { profile: CardProfile }) {
  const viewer = await getViewer().catch(() => null)
  if (!viewer || viewer.id !== profile.id) return null

  const name = profile.full_name?.trim() || profile.username
  return <section aria-label="Create your visiting card" className="my-6 grid min-w-0 gap-6 overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-[#29204d] via-[#201b39] to-[#172637] p-5 sm:p-7 md:grid-cols-2 md:items-center">
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Your profile. Your visiting card.</p>
      <h2 className="mt-3 text-2xl font-bold leading-tight text-white">Your next introduction could look like this.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">Make a visiting card for yourself or your business. Choose a style, add your details and share your card image.</p>
      <p className="mt-3 text-sm font-medium leading-6 text-violet-100">Free to design · {GIGCARD_PRICE_LABEL} one-time per card to download &amp; share.</p>
      <Link href="/profile/gigcard" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Customize your card <span aria-hidden="true" className="ml-2">→</span></Link>
      <p className="mt-3 text-xs leading-5 text-slate-300">Only you see this preview. Nothing is published.</p>
    </div>
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/30 bg-[#faf3e5] p-5 text-[#242037] shadow-xl sm:p-6">
      <div aria-hidden="true" className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#c3b5f8]/40" />
      <p className="relative text-xs font-bold uppercase tracking-widest text-[#63508a]">GigCard · Preview</p>
      <div className="relative mt-6 flex min-w-0 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ddd2f7] text-2xl font-bold text-[#483675]">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" width={64} height={64} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0"><p className="break-words text-2xl font-bold leading-tight">{name}</p><p className="mt-2 break-words text-base font-medium leading-6 text-[#574299]">{profile.tagline?.trim() || "Your headline goes here"}</p></div>
      </div>
      <p className="relative mt-6 break-all border-t border-[#d9cde9] pt-4 text-sm font-semibold text-[#574299]">gigway.in/u/{profile.username}</p>
    </div>
  </section>
}
