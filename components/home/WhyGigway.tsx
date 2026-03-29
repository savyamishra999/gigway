import { IndianRupee, ShieldCheck, Globe, Zap, Star, Headphones, MapPin, Sparkles } from "lucide-react"

const REASONS = [
  {
    icon: IndianRupee,
    title: "Zero Commission",
    description: "Freelancers keep 100% of their earnings. The platform never takes a cut.",
    gradient: "from-[#4F46E5] to-[#6366F1]",
    bg: "bg-[#4F46E5]/10",
    iconColor: "text-[#818CF8]",
  },
  {
    icon: ShieldCheck,
    title: "Verified Projects",
    description: "Every project is reviewed for authenticity. Only genuine clients can post work.",
    gradient: "from-[#10B981] to-[#34D399]",
    bg: "bg-[#10B981]/10",
    iconColor: "text-[#10B981]",
  },
  {
    icon: Globe,
    title: "Built for India",
    description: "Designed for Indian freelancers and businesses. ₹ payments, local market expertise.",
    gradient: "from-[#F97316] to-[#FB923C]",
    bg: "bg-[#F97316]/10",
    iconColor: "text-[#F97316]",
  },
  {
    icon: Zap,
    title: "Fast Payments",
    description: "UPI, bank transfer, or any Indian payment method. Instant settlement on completion.",
    gradient: "from-[#8B5CF6] to-[#A78BFA]",
    bg: "bg-[#8B5CF6]/10",
    iconColor: "text-[#A78BFA]",
  },
  {
    icon: MapPin,
    title: "Local Services",
    description: "From carpenters to tutors — find skilled professionals for in-person services near you.",
    gradient: "from-[#EC4899] to-[#F472B6]",
    bg: "bg-[#EC4899]/10",
    iconColor: "text-[#F472B6]",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "Smart recommendations powered by AI — find the right talent or project faster.",
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    bg: "bg-[#06B6D4]/10",
    iconColor: "text-[#22D3EE]",
  },
  {
    icon: Star,
    title: "Top Talent",
    description: "Design, tech, content, marketing — verified professionals in every field.",
    gradient: "from-[#F97316] to-[#FBBF24]",
    bg: "bg-[#F97316]/10",
    iconColor: "text-[#FBBF24]",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is always ready to help you resolve any issue, any time.",
    gradient: "from-[#4F46E5] to-[#8B5CF6]",
    bg: "bg-[#4F46E5]/10",
    iconColor: "text-[#A5B4FC]",
  },
]

export default function WhyGigway() {
  return (
    <section className="py-28 px-4 bg-[#12121A] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#4F46E5]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#F97316]/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-3">Our Advantages</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Why Choose GigWay?
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            The platform that both freelancers and clients deserve.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {REASONS.map(r => {
            const Icon = r.icon
            return (
              <div
                key={r.title}
                className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl p-6 group hover:border-[#2A2A3E] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl ${r.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-7 h-7 ${r.iconColor}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#818CF8] transition-colors">
                  {r.title}
                </h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{r.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
