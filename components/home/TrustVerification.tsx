import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react"

const POINTS = [
  { icon: FileCheck2,  title: "ID or company document review", desc: "Verification is based on real identity or business documents, checked by GigWay." },
  { icon: BadgeCheck,  title: "A visible verified badge",       desc: "Once approved, your profile or organization carries a clear verified mark." },
  { icon: ShieldCheck, title: "Optional, not required",          desc: "You can use GigWay freely without it — verification is there when you want extra trust." },
]

export default async function TrustVerification() {
  const supabase = await createClient()
  const { count: verifiedCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-3">Trust &amp; Verification</p>
          <h2 className="text-h2 font-extrabold text-brand-midnight mb-4">Build trust with a verified professional identity</h2>
          <p className="text-body-lg text-brand-slate">
            Verification tells the people you work with that you are who you say you are —
            reviewed once, shown everywhere on your profile.
          </p>
          {!!verifiedCount && verifiedCount > 0 && (
            <p className="mt-4 text-brand-indigo font-semibold text-body-sm">{verifiedCount.toLocaleString("en-IN")} verified professionals on GigWay</p>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {POINTS.map(point => {
            const Icon = point.icon
            return (
              <div key={point.title} className="bg-brand-ivory border border-brand-borderLight rounded-card p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-brand-indigo/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-5 w-5 text-brand-indigo" />
                </div>
                <p className="font-bold text-brand-midnight text-body-sm mb-1.5">{point.title}</p>
                <p className="text-brand-slate text-body-sm">{point.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/verify" className="inline-flex items-center gap-2 text-brand-indigo font-semibold text-body-sm hover:text-brand-indigoDark">
            Get verified →
          </Link>
        </div>
      </div>
    </section>
  )
}
