import { IndianRupee, ShieldCheck, Globe, Zap, Star, Headphones } from "lucide-react"

const REASONS = [
  {
    icon: IndianRupee,
    title: "Zero Commission",
    description: "Freelancers 100% kamaai rakhte hain. Platform kabhi cut nahi leta.",
    gradient: "from-[#4F46E5] to-[#6366F1]",
    bg: "bg-[#4F46E5]/10",
    iconColor: "text-[#818CF8]",
  },
  {
    icon: ShieldCheck,
    title: "Verified Projects",
    description: "Har project authenticity ke liye reviewed hota hai. Genuine clients se hi kaam milega.",
    gradient: "from-[#10B981] to-[#34D399]",
    bg: "bg-[#10B981]/10",
    iconColor: "text-[#10B981]",
  },
  {
    icon: Globe,
    title: "Indian Platform",
    description: "Indians ke liye, Indians ke dwara. ₹ payments, Hindi support, local market understanding.",
    gradient: "from-[#F97316] to-[#FB923C]",
    bg: "bg-[#F97316]/10",
    iconColor: "text-[#F97316]",
  },
  {
    icon: Zap,
    title: "Fast Payments",
    description: "UPI, bank transfer, ya koi bhi Indian payment method. Instant settlement.",
    gradient: "from-[#8B5CF6] to-[#A78BFA]",
    bg: "bg-[#8B5CF6]/10",
    iconColor: "text-[#A78BFA]",
  },
  {
    icon: Star,
    title: "Top Talent",
    description: "Design, tech, content, marketing — har field mein verified professionals.",
    gradient: "from-[#EC4899] to-[#F472B6]",
    bg: "bg-[#EC4899]/10",
    iconColor: "text-[#F472B6]",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Kisi bhi problem ke liye hamare support team hamesha ready hai.",
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    bg: "bg-[#06B6D4]/10",
    iconColor: "text-[#22D3EE]",
  },
]

export default function WhyGigway() {
  return (
    <section className="py-28 px-4 bg-[#12121A] relative overflow-hidden">
      {/* Subtle gradient accents */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#4F46E5]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#F97316]/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <p className="text-[#F97316] text-sm font-bold uppercase tracking-widest mb-3">Our Advantages</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            GigWay Kyun Choose Karo?
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Woh platform jo freelancers aur clients dono deserve karte hain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
