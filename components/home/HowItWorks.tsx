"use client"

import { UserPlus, Briefcase, Wallet } from "lucide-react"

const STEPS = [
  {
    num: "01",
    icon: UserPlus,
    title: "Get Started Free",
    description: "Create your account in 30 seconds. No credit card required. Set up your profile and start right away.",
    gradient: "from-[#4F46E5] to-[#6366F1]",
    glow: "rgba(79,70,229,0.3)",
  },
  {
    num: "02",
    icon: Briefcase,
    title: "Post or Find Work",
    description: "Clients post verified projects. Freelancers browse thousands of gigs and jobs across India.",
    gradient: "from-[#F97316] to-[#FB923C]",
    glow: "rgba(249,115,22,0.3)",
  },
  {
    num: "03",
    icon: Wallet,
    title: "Keep 100% of Earnings",
    description: "Zero commission — every rupee is yours. Secure payments, instant transfer, no hidden charges.",
    gradient: "from-[#10B981] to-[#34D399]",
    glow: "rgba(16,185,129,0.3)",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-28 px-4 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-[#4F46E5]/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <p className="text-[#4F46E5] text-sm font-bold uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Get Started in{" "}
            <span className="relative inline-block">
              3 Steps
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full" />
            </span>
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Sign up, find or post work, and keep every rupee you earn.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[calc(16.67%)] right-[calc(16.67%)] h-px border-t-2 border-dashed border-[#1E1E2E] z-0" />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="relative group z-10">
                <div
                  className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${step.glow}`
                    ;(e.currentTarget as HTMLElement).style.borderColor = step.glow
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = ""
                    ;(e.currentTarget as HTMLElement).style.borderColor = ""
                  }}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#F97316] flex items-center justify-center text-white text-xs font-black">
                    {i + 1}
                  </div>
                  <div className="text-7xl font-black text-white/[0.03] absolute top-4 right-5 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
