"use client"

import { useState } from "react"
import { Search, X, Plus } from "lucide-react"

interface ChipPickerProps {
  selected: string[]
  onChange: (next: string[]) => void
  options: string[] | Record<string, string[]>
  max?: number
  addLabel: string
  searchPlaceholder?: string
  allowCustom?: boolean
  customPlaceholder?: string
}

// Generic "selected chips + searchable add drawer" picker — shared by Skills and
// Job Functions so both follow the same interaction pattern instead of a wall
// of always-visible option buttons.
export default function ChipPicker({
  selected, onChange, options, max, addLabel,
  searchPlaceholder = "Search…", allowCustom = false, customPlaceholder = "Add your own…",
}: ChipPickerProps) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState("")
  const categorized = !Array.isArray(options)
  const categories = categorized ? Object.keys(options as Record<string, string[]>) : []
  const [category, setCategory] = useState(categories[0] ?? "")
  const [customValue, setCustomValue] = useState("")

  const atMax = typeof max === "number" && selected.length >= max

  const pool: string[] = search
    ? (categorized ? Object.values(options as Record<string, string[]>).flat() : (options as string[]))
        .filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : categorized ? (options as Record<string, string[]>)[category] ?? [] : (options as string[])
  const visiblePool = pool.filter(o => !selected.includes(o))

  const toggle = (value: string) => {
    if (selected.includes(value)) { onChange(selected.filter(v => v !== value)); return }
    if (atMax) return
    onChange([...selected, value])
  }

  const addCustom = () => {
    const trimmed = customValue.trim()
    setCustomValue("")
    if (!trimmed || selected.includes(trimmed) || atMax) return
    onChange([...selected, trimmed])
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(value => (
            <span key={value} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 text-sm font-medium">
              {value}
              <button type="button" onClick={() => toggle(value)} className="hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {!expanded ? (
        !atMax && (
          <button type="button" onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-white">
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        )
      ) : (
        <div className="space-y-3 rounded-xl border border-[#334155] p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]" />
          </div>

          {categorized && !search && (
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    category === cat ? "bg-[#6366F1] text-white" : "bg-[#0F172A] text-[#64748B] hover:text-[#94A3B8] border border-[#334155]"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {visiblePool.map(option => (
              <button key={option} type="button" onClick={() => toggle(option)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-[#334155] text-[#94A3B8] hover:border-[#6366F1]/50 hover:text-[#A5B4FC] transition-all">
                {option}
              </button>
            ))}
            {visiblePool.length === 0 && <p className="text-xs text-[#475569] px-1 py-1">No matches.</p>}
          </div>

          {allowCustom && (
            <div className="flex gap-2">
              <input value={customValue} onChange={e => setCustomValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom() } }}
                placeholder={customPlaceholder}
                className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#6366F1]" />
              <button type="button" onClick={addCustom} disabled={!customValue.trim()}
                className="px-3 rounded-lg bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155] disabled:opacity-40 text-sm">
                Add
              </button>
            </div>
          )}

          <button type="button" onClick={() => setExpanded(false)} className="text-xs text-[#64748B] hover:text-white">Done</button>
        </div>
      )}
    </div>
  )
}
