"use client"

import { useState } from "react"
import { ExternalLink, Link2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function displayTitle(url: string) {
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname !== "/" ? pathname : ""
    return `${hostname.replace(/^www\./, "")}${path}`.slice(0, 60)
  } catch {
    return url
  }
}

// Existing data model is unchanged — profiles.portfolio_links: text[]. This only
// changes how each URL is presented: a card instead of a raw link row.
export default function PortfolioEditor({ links, onChange }: { links: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState("")

  const add = () => {
    const trimmed = input.trim()
    if (!trimmed || links.includes(trimmed)) { setInput(""); return }
    onChange([...links, trimmed])
    setInput("")
  }
  const remove = (link: string) => onChange(links.filter(l => l !== link))

  return (
    <div className="space-y-4">
      {links.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {links.map(link => (
            <div key={link} className="flex items-start gap-3 bg-[#0F172A] border border-[#334155] rounded-xl p-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-4 w-4 text-[#818CF8]" />
              </div>
              <div className="min-w-0 flex-1">
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#F8FAFC] text-sm font-medium hover:text-[#A5B4FC] truncate">
                  <span className="truncate">{displayTitle(link)}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <p className="text-[#64748B] text-xs truncate mt-0.5">{link}</p>
              </div>
              <button type="button" onClick={() => remove(link)} className="text-[#64748B] hover:text-red-400 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder="https://yourproject.com"
          className="bg-[#0F172A] border-[#334155] text-[#F8FAFC] placeholder:text-[#475569] focus:border-[#6366F1]" />
        <Button type="button" onClick={add} disabled={!input.trim()}
          className="bg-[#0F172A] hover:bg-[#334155] text-white border border-[#334155]">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
