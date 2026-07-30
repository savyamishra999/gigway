"use client"

import { useState } from "react"

const MAX_VISIBLE = 8

export default function SkillsList({ skills }: { skills: string[] }) {
  const [showAll, setShowAll] = useState(false)

  if (skills.length === 0) return null

  const visible = showAll ? skills : skills.slice(0, MAX_VISIBLE)
  const hidden  = skills.length - MAX_VISIBLE

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(skill => (
        <span key={skill}
          className="px-3 py-1 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/25 text-[#818CF8] text-xs font-medium">
          {skill}
        </span>
      ))}
      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="px-3 py-1 rounded-full bg-[#1E1E2E] border border-[#334155] text-[#6B7280] hover:text-white text-xs font-medium transition-colors">
          +{hidden} more
        </button>
      )}
    </div>
  )
}
