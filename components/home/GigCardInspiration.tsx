import Link from "next/link"
import { GIGCARD_PRICE_LABEL } from "@/lib/gigcard/purchase"

const examples = [
  { name: "Aarav Shah", role: "Founder", company: "Northstar Studio", detail: "Brand strategy & design", style: "bg-[#141627] text-white", accent: "text-[#b7acff]" },
  { name: "Meera Rao", role: "Independent consultant", company: "Meera Advisory", detail: "Operations & growth", style: "bg-[#faf3e5] text-[#242037]", accent: "text-[#574299]" },
  { name: "Riya Kapoor", role: "Creative director", company: "Bloom Creative", detail: "Identity & storytelling", style: "bg-gradient-to-br from-[#40328c] to-[#a73d79] text-white", accent: "text-[#f3d7ff]" },
]

export default function GigCardInspiration() {
  return <section aria-label="GigCard inspiration" className="my-7 min-w-0 rounded-2xl border border-brand-borderLight bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-brand-midnight">Your next introduction, beautifully designed.</h2><Link href="/profile/gigcard" className="inline-flex min-h-11 items-center rounded-xl bg-brand-indigo px-4 py-2 font-bold text-white">Design your card</Link></div>
    <p className="mt-2 text-sm leading-6 text-brand-slate">For you, your startup or your business. Sample concepts with fictional names—not customer cards. Free to design. {GIGCARD_PRICE_LABEL} one-time per card for downloads and sharing when checkout opens.</p>
    <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" tabIndex={0} aria-label="Scroll through sample card concepts">
      {examples.map(card => <article key={card.name} className={`w-72 shrink-0 snap-start rounded-2xl p-6 ${card.style}`}>
        <p className={`text-sm font-semibold ${card.accent}`}>{card.company}</p><h3 className="mt-7 text-2xl font-bold">{card.name}</h3><p className="mt-2 text-xl font-semibold">{card.role}</p><p className={`mt-3 text-base ${card.accent}`}>{card.detail}</p><p className="mt-6 border-t border-current/20 pt-3 text-xs">SAMPLE CONCEPT</p>
      </article>)}
    </div>
    <p className="text-xs leading-5 text-brand-slate">Your designs stay private. Real member cards will only be featured with their permission.</p>
  </section>
}
