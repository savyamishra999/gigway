import Link from "next/link"

export default function VerificationPrompt() {
  return <aside className="rounded-xl border border-brand-borderLight bg-white p-4 text-sm text-brand-midnight">
    <p className="font-bold">Build trust with a verified professional profile.</p>
    <p className="mt-1 text-brand-slate">Apply for professional verification for &#8377;299/year. Your personal profile receives a badge only after approval.</p>
    <Link prefetch={false} href="/tools/verification" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-bold text-brand-indigo underline">Explore verification (opens in a new tab)</Link>
  </aside>
}
