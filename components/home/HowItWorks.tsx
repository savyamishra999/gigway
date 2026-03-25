import { UserPlus, Briefcase, Wallet } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in 30 seconds. No credit card required. Choose freelancer or client.",
    color: "from-blue-500 to-blue-700",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    number: "02",
    icon: Briefcase,
    title: "Post or Find Work",
    description: "Clients post verified projects. Freelancers browse thousands of opportunities across India.",
    color: "from-[#FFD700] to-[#FFA500]",
    glow: "group-hover:shadow-[#FFD700]/20",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Get Paid 100%",
    description: "Zero commission means every rupee goes to you. Secure payments, no hidden charges.",
    color: "from-green-500 to-emerald-700",
    glow: "group-hover:shadow-green-500/20",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-[#0A0A0A] to-[#111111]">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-[#FFD700] text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            How It <span className="text-[#FFD700]">Works</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative group">
                <div
                  className={`bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:border-white/20 transition-all hover:shadow-2xl ${step.glow} duration-300`}
                >
                  {/* Number badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  <div className="text-6xl font-black text-white/5 absolute top-6 right-6 select-none">
                    {step.number}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
