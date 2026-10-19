import Link from "next/link"

export default function VerificationPrompt() {
  return <aside className="rounded-xl border border-brand-borderLight bg-white p-4 text-sm text-brand-midnight">
    <p className="font-bold">Build trust with a verified professional profile.</p>
    <p className="mt-1 text-brand-slate">Let clients see that GigWay has reviewed your professional details and work evidence. After approval and payment, your public profile displays a Verified Professional badge for 365 days.</p>
    <p className="mt-2 text-brand-slate">&#8377;299/year. Pay after approval. No automatic renewal.</p>
    <p className="mt-2 text-xs text-brand-slate">Verification does not guarantee jobs, clients or earnings.</p>
    <Link prefetch={false} href="/tools/verification" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-bold text-brand-indigo underline">Apply for verification (opens in a new tab)</Link>
  </aside>
}
