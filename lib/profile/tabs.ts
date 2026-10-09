export const PROFILE_TABS = [
  { value: "gigthoughts", label: "GigThoughts", empty: "No GigThoughts yet." },
  { value: "work", label: "Work", empty: "No public work yet." },
  { value: "reposts", label: "Reposts", empty: "No reposts yet." },
] as const

export type ProfileTab = typeof PROFILE_TABS[number]["value"]
export function profileTab(value?: string): ProfileTab {
  return value === "work" || value === "reposts" ? value : "gigthoughts"
}
