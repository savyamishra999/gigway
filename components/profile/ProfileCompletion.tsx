interface Props {
  pct: number
  missing: string[]
}

export default function ProfileCompletion({ pct, missing }: Props) {
  if (pct >= 100) return null

  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct < 40 ? "#EF4444" : pct < 70 ? "#F97316" : "#22C55E"

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5">
      <div className="flex items-center gap-4">
        {/* Circle */}
        <div className="relative flex-shrink-0">
          <svg width={56} height={56} viewBox="0 0 56 56">
            <circle cx={28} cy={28} r={r} fill="none" stroke="#1E1E2E" strokeWidth={5} />
            <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={5}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-black">{pct}%</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm mb-0.5">Complete your profile</p>
          <p className="text-[#6B7280] text-xs leading-relaxed">
            A complete profile gets <span className="text-[#818CF8] font-semibold">5× more views</span> and better matches.
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {missing.slice(0, 5).map(item => (
            <span key={item}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E1E2E] border border-[#334155] text-[#9CA3AF] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] flex-shrink-0" />
              {item}
            </span>
          ))}
          {missing.length > 5 && (
            <span className="px-2.5 py-1 rounded-full bg-[#1E1E2E] border border-[#334155] text-[#6B7280] text-xs">
              +{missing.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
