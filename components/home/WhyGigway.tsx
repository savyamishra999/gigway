import { IndianRupee, ShieldCheck, Globe, Zap, Star, Headphones } from "lucide-react"

const REASONS = [
  {
    icon: IndianRupee,
    title: "Zero Commission",
    description: "Freelancers keep 100% of their earnings. We never take a cut from your hard-earned money.",
    color: "text-[#FFD700]",
    bg: "bg-[#FFD700]/10",
  },
  {
    icon: ShieldCheck,
    title: "Verified Projects",
    description: "Every project is reviewed for authenticity. Work with confidence knowing clients are genuine.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Globe,
    title: "Indian Platform",
    description: "Built for India, by Indians. Understand the local market with ₹ payments and local support.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Fast Payments",
    description: "Get paid quickly through UPI, bank transfer, or any popular Indian payment method.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Star,
    title: "Top Talent",
    description: "Access thousands of verified, skilled professionals across design, tech, content, and more.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated support team is always ready to help you with any questions or concerns.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
]

export default function WhyGigway() {
  return (
    <section className="py-24 px-4 bg-[#0A0A0A]">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-[#FFD700] text-sm font-semibold uppercase tracking-widest mb-3">Our Advantages</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Why Choose <span className="text-[#FFD700]">GigWAY?</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            We built the platform freelancers and clients actually deserve.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REASONS.map(reason => {
            const Icon = reason.icon
            return (
              <div
                key={reason.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/8 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl ${reason.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-7 h-7 ${reason.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[#FFD700] transition-colors">
                  {reason.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{reason.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
