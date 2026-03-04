import { Shield, Zap, IndianRupee } from "lucide-react"

const features = [
  {
    icon: IndianRupee,
    title: "0% Commission",
    description: "Freelancers keep 100% of their earnings - no hidden fees",
    color: "text-[#FFD700]",
  },
  {
    icon: Shield,
    title: "Verified Projects",
    description: "Every project is verified for authenticity and quality",
    color: "text-green-500",
  },
  {
    icon: Zap,
    title: "India First",
    description: "Built specifically for the Indian freelance community",
    color: "text-blue-500",
  },
]

export default function WhyGigway() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-12">
          Why Choose <span className="text-[#FFD700]">GigWAY?</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <Icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}