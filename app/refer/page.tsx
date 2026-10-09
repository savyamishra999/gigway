import { loginForCurrent } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export const metadata = { title: "Referrals — GigWay", description: "GigWay referral rewards status." }

export default async function ReferPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect(await loginForCurrent("/refer"))
  // No code generation or balance writes while atomic, idempotent rewards are pending.
  return <main className="min-h-screen bg-brand-ivory px-4 py-12 pb-24">
    <section className="mx-auto max-w-lg rounded-2xl border border-brand-borderLight bg-white p-6">
      <h1 className="text-h2 font-bold text-brand-midnight">Referral rewards are paused</h1>
      <p className="mt-3 text-brand-slate">New referral rewards are currently unavailable. Your existing balance remains unchanged.</p>
      <Link href="/home" className="mt-5 inline-block font-semibold text-brand-indigo">Back to Home</Link>
    </section>
  </main>
}
