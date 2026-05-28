interface TrustBarProps {
  freelancerCount: number
}

const TRUST_STATS = [
  { icon: "⭐", value: "4.9/5",    label: "Platform Rating" },
  { icon: "🔒", value: "100%",     label: "Secure Payments" },
  { icon: "⚡", value: "Instant",  label: "Payout" },
  { icon: "🇮🇳", value: "Made in", label: "India" },
]

export default function TrustBar({ freelancerCount }: TrustBarProps) {
  const displayCount = freelancerCount > 0 ? `${freelancerCount}+` : "Hundreds of"

  return (
    <div className="bg-[#12121A] border-y border-[#1E1E2E]">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <p className="text-[#6B7280] text-sm font-medium shrink-0">
            Join <span className="text-white font-bold">{displayCount}</span> Indian freelancers who chose GigWay
          </p>
          <div className="flex items-center gap-8">
            {TRUST_STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-sm font-bold text-white">
                  <span className="mr-1">{stat.icon}</span>
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#6B7280]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
