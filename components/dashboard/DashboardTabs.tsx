"use client"

import { useState } from "react"

interface Props {
  findWorkContent: React.ReactNode
  hireTalentContent: React.ReactNode
}

export default function DashboardTabs({ findWorkContent, hireTalentContent }: Props) {
  const [activeTab, setActiveTab] = useState<"find_work" | "hire_talent">("find_work")

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1.5 bg-[#12121A] border border-[#1E293B] rounded-xl p-1.5 mb-6">
        <button
          onClick={() => setActiveTab("find_work")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "find_work"
              ? "bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20"
              : "text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          🔍 Find Work
        </button>
        <button
          onClick={() => setActiveTab("hire_talent")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "hire_talent"
              ? "bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20"
              : "text-[#64748B] hover:text-[#94A3B8]"
          }`}
        >
          👔 Hire Talent
        </button>
      </div>

      {activeTab === "find_work" ? findWorkContent : hireTalentContent}
    </div>
  )
}
