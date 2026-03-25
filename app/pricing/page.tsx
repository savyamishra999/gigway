import { Check, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    badge: null,
    description: "Perfect for getting started",
    connects: "10 connects",
    features: [
      "10 connects per month",
      "Browse all projects",
      "Submit up to 10 proposals",
      "Basic profile page",
      "Email support",
    ],
    cta: "Get Started",
    ctaStyle: "border border-white/20 text-white hover:bg-white/10",
  },
  {
    name: "Pro",
    price: "₹199",
    period: "/month",
    badge: "Most Popular",
    description: "For active freelancers",
    connects: "Unlimited connects",
    features: [
      "Unlimited connects",
      "Featured profile badge",
      "Priority in search results",
      "Advanced analytics",
      "Direct messaging",
      "Priority email support",
    ],
    cta: "Start Pro",
    ctaStyle: "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold",
  },
  {
    name: "Business",
    price: "₹999",
    period: "/month",
    badge: null,
    description: "For teams and agencies",
    connects: "Unlimited connects",
    features: [
      "Everything in Pro",
      "Post unlimited job listings",
      "Team management (up to 5)",
      "Dedicated account manager",
      "API access",
      "24/7 priority support",
      "Custom invoicing",
    ],
    cta: "Start Business",
    ctaStyle: "border border-white/20 text-white hover:bg-white/10",
  },
]

const FAQS = [
  {
    q: "What are connects?",
    a: "Connects are credits used to submit proposals on projects. Each proposal submission costs 1 connect. Free users get 10 connects per month, while Pro and Business users get unlimited connects.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your Pro or Business subscription at any time. Your plan will remain active until the end of your current billing period.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "We offer a 7-day free trial for the Pro plan. No credit card required. You can explore all Pro features risk-free.",
  },
  {
    q: "How does the featured profile badge work?",
    a: "Pro members get a featured badge on their profile and appear higher in search results when clients look for freelancers, significantly increasing visibility.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a]">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple <span className="text-[#FFD700]">Pricing</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Choose the plan that works best for you. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.badge
                  ? "border-[#FFD700]/50 bg-[#FFD700]/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#FFD700] text-black font-bold px-4 py-1 text-xs">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-[#FFD700] text-sm font-medium mt-2">{plan.connects}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-[#FFD700] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-6 group"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-white font-medium">{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-gray-400 text-sm mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
