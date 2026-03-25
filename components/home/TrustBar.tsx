const COMPANIES = [
  "Zomato", "Paytm", "Swiggy", "CRED", "Razorpay", "Meesho",
  "Dream11", "Zepto", "Groww", "Slice", "BharatPe", "PhonePe",
]

const TRUST_STATS = [
  { icon: "⭐", value: "4.9/5", label: "Rating" },
  { icon: "🔒", value: "100%", label: "Secure" },
  { icon: "⚡", value: "Instant", label: "Payout" },
  { icon: "🇮🇳", value: "Made in", label: "India" },
]

export default function TrustBar() {
  return (
    <div className="bg-[#12121A] border-y border-[#1E1E2E]">
      {/* Stats row */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <p className="text-[#6B7280] text-sm font-medium shrink-0">
            Join <span className="text-white font-bold">15,000+</span> Indian freelancers who chose GigWay
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

      {/* Scrolling logos */}
      <div className="border-t border-[#1E1E2E] py-4 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="marquee flex items-center gap-12 pr-12">
            {[...COMPANIES, ...COMPANIES].map((company, i) => (
              <span
                key={i}
                className="text-[#4B5563] font-semibold text-sm hover:text-[#4F46E5] transition-colors cursor-default"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
