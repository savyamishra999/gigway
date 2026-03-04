import { UserPlus, Briefcase, Wallet } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in 30 seconds - it's completely free",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Briefcase,
    title: "Post or Find Work",
    description: "Clients post projects, freelancers find their dream gigs",
    color: "from-[#FFD700] to-[#FFA500]",
  },
  {
    icon: Wallet,
    title: "Get Paid 100%",
    description: "Zero commission means you keep everything you earn",
    color: "from-green-400 to-green-600",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#D4A5A5] to-[#A7C7E7]">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          How It <span className="text-[#FFD700]">Works</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="relative group"
              >
                <div className="absolute inset-0 bg-white rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative bg-white/30 backdrop-blur-sm p-8 rounded-2xl border border-white/20 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center font-bold text-black">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}