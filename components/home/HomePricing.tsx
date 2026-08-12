import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

const PLANS = [
  {
    key: "free",
    label: "Free",
    who: "Everyone",
    price: "₹0",
    period: "forever",
    highlight: false,
    perks: ["Create your professional profile", "Create unlimited gigs", "Message clients directly", "Basic profile listing"],
    href: "/login",
    cta: "Join Free",
  },
  {
    key: "pro",
    label: "Pro",
    who: "Freelancers & Job Seekers",
    price: "₹49",
    period: "/month",
    highlight: true,
    perks: ["Profile visible in search results", "Apply to unlimited jobs & projects", "Instant job & project alerts", "Priority application badge"],
    href: "/login",
    cta: "Get Started",
  },
  {
    key: "business",
    label: "Business",
    who: "Companies & Individuals Hiring",
    price: "₹199",
    period: "/month",
    highlight: false,
    perks: ["Post unlimited jobs & projects", "Browse the full talent directory", "Direct message any professional", "Verified hirer badge"],
    href: "/login",
    cta: "Start Hiring",
  },
  {
    key: "verified",
    label: "Verified",
    who: "For Everyone",
    price: "₹299",
    period: "one-time",
    highlight: false,
    perks: ["Permanent verified checkmark", "Priority placement in search", "Never expires — pay once"],
    href: "/pricing",
    cta: "Get Verified",
  },
]

export default function HomePricing() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-14">
          <p className="text-brand-indigo font-bold text-body-sm uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-h2 font-extrabold text-brand-midnight mb-4">Free to join. 0% GigWay platform commission.</h2>
          <p className="text-body-lg text-brand-slate max-w-lg mx-auto">
            Basic access is always free. Paid plans add visibility and tools — GigWay never takes a cut of what you earn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map(plan => (
            <div key={plan.key}
              className={`relative rounded-card p-6 flex flex-col h-full ${
                plan.highlight ? "bg-brand-ivory border-2 border-brand-indigo shadow-elevated" : "bg-white border border-brand-borderLight shadow-soft"
              }`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-indigo text-white text-caption font-bold px-3 py-1 rounded-pill whitespace-nowrap">
                  Most Popular
                </span>
              )}
              <p className="text-brand-slate text-caption font-bold uppercase tracking-wider mb-1">{plan.label}</p>
              <p className="text-brand-midnight text-body-sm mb-4">{plan.who}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-h2 font-extrabold text-brand-midnight">{plan.price}</span>
                <span className="text-brand-slate text-body-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2 text-body-sm text-brand-midnight">
                    <CheckCircle2 className="h-4 w-4 text-brand-success mt-0.5 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className={`flex items-center justify-center w-full py-2.5 rounded-xl font-semibold text-body-sm transition-colors ${
                  plan.highlight ? "bg-brand-indigo text-white hover:bg-brand-indigoDark" : "border border-brand-borderLight text-brand-midnight hover:bg-brand-ivory"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
