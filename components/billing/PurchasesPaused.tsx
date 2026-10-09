import Link from "next/link"

export default function PurchasesPaused() {
  return (
    <main className="min-h-screen bg-brand-ivory px-4 py-12">
      <section className="mx-auto max-w-xl rounded-card border border-brand-borderLight bg-white p-6">
        <h1 className="text-h2 font-extrabold text-brand-midnight">Purchases are paused</h1>
        <p className="mt-3 text-body-sm text-brand-slate">
          Connects, paid plans, job boosts and paid verification are currently unavailable.
          Proposal submissions and verification document collection are also paused.
        </p>
        <p className="mt-3 text-body-sm text-brand-slate">
          You can still build your professional profile, explore work and grow your network for free.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs" className="rounded-xl bg-brand-indigo px-4 py-3 font-bold text-white">Explore jobs</Link>
          <Link href="/profile" className="rounded-xl border border-brand-borderLight px-4 py-3 font-bold text-brand-midnight">Your profile</Link>
        </div>
      </section>
    </main>
  )
}
